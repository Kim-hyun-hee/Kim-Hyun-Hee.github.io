# 글 하단 재구성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 글 본문 아래 영역을 정리한다 — 태그를 칩으로 바꾸고, 중복된 "맨 위로" 버튼을 없애고, 같은 분류의 다른 글로 넘어갈 통로를 만든다.

**Architecture:** 순수 함수 유틸(`getNearbyCategoryPosts`)이 "어떤 글을 보여줄지"를 정하고, 표현 컴포넌트(`OtherPosts.astro`)가 "어떻게 보여줄지"만 맡는다. 유틸은 정렬을 직접 하지 않고 **정렬된 목록을 인자로 받는다** — 그래야 `config`/`import.meta.env`에 의존하지 않아 Astro 런타임 없이 단위 테스트할 수 있고, 기존 `getPostsByCategory.ts`의 순수 함수 패턴과 결이 같다. 정렬은 호출부(`index.astro`)가 이미 쓰고 있는 `getSortedPosts`로 한다. 색은 새 CSS 변수 두 개를 빼고는 전부 기존 토큰을 쓴다.

**Tech Stack:** Astro 5, Tailwind CSS v4 (`@theme inline` 토큰), TypeScript, Vitest, Pagefind

**설계 문서:** `docs/superpowers/specs/2026-08-07-post-footer-design.md`

## Global Constraints

- **패키지 매니저는 pnpm이고 PATH에 없다.** 모든 명령은 `corepack pnpm ...` 으로 실행한다. `npm install`을 절대 돌리지 않는다 — `package-lock.json`이 생긴다.
- **커밋 메시지와 `docs/superpowers/**`, 코드 주석에 다음 고유명사를 쓰지 않는다:** hELLO, Inpa Dev, 티스토리/Tistory. 같은 뜻을 말해야 하면 "기존에 쓰던 블로그" 같은 중립적 표현으로 바꾼다.
- **시리즈 컴포넌트를 열지 않는다.** `src/components/series/SeriesBox.astro`, `src/components/series/SeriesNav.astro`는 이번 diff에 등장하면 안 된다. 시리즈 UI는 별도 작업에서 아코디언으로 다시 짠다.
- **UI에 유채색을 쓰지 않는다.** 새로 넣는 색도 무채색이어야 한다.
- 아이콘은 Tabler Icons(MIT) 계열로 통일돼 있다. 새 아이콘도 같은 규격(24×24, `stroke="currentColor"`, `stroke-width="2"`)을 따른다.
- `tests/routes.test.ts`는 `dist/`가 있어야 돌아간다. 전체 검증은 `corepack pnpm verify`(= `build && test`)를 쓴다.

---

### Task 1: 태그 칩

**Files:**
- Create: `src/assets/icons/IconTag.svg`
- Modify: `src/styles/theme.css`
- Modify: `src/components/Tag.astro`
- Modify: `src/pages/posts/[...slug]/index.astro:188`
- Modify: `src/pages/tags/index.astro:26`

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces: CSS 유틸리티 `bg-tag-hover`, `text-tag-hover-foreground`. `Tag.astro`의 props(`tag: string`, `tagName: string`, `size?: "sm" | "lg"`)는 바뀌지 않는다.

- [ ] **Step 1: 태그 아이콘 추가**

`src/assets/icons/IconTag.svg`를 만든다. Tabler Icons의 `tag`이고, 저장소의 다른 아이콘과 속성 순서까지 같은 형태다.

```svg
<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-tag"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M3 6v5.172a2 2 0 0 0 .586 1.414l7.71 7.71a2.41 2.41 0 0 0 3.408 0l5.592 -5.592a2.41 2.41 0 0 0 0 -3.408l-7.71 -7.71a2 2 0 0 0 -1.414 -.586h-5.172a3 3 0 0 0 -3 3z" /></svg>
```

- [ ] **Step 2: hover 토큰 등록**

`src/styles/theme.css`의 `@theme inline { ... }` 블록에서 `--color-sidebar-link` 줄 **바로 아래**에 두 줄을 넣는다.

```css
  --color-sidebar-link: var(--sidebar-link);
  --color-tag-hover: var(--tag-hover);
  --color-tag-hover-foreground: var(--tag-hover-foreground);
```

- [ ] **Step 3: hover 토큰 값 정의**

같은 파일에서 `/* Dark theme values */` 블록(`[data-theme="dark"] { ... }`)이 끝난 **직후**, `/* Layout widths ... */` 주석 **앞**에 새 블록을 넣는다.

```css
/* 테마와 무관한 값 — 위의 라이트/다크 블록에서 덮지 않는다.
   태그 칩 hover는 기존에 쓰던 블로그와 같이 양쪽 테마 모두 먹색으로
   어두워진다. --foreground/--background 는 테마에 따라 뒤집히므로
   이 동작을 표현할 수 없어 별도 토큰을 둔다. */
:root {
  --tag-hover: #353638;
  --tag-hover-foreground: #f4f4f6;
}
```

- [ ] **Step 4: `Tag.astro`를 칩으로 바꾼다**

`src/components/Tag.astro` 전체를 아래로 교체한다. frontmatter에서 바뀌는 것은 import 한 줄(`IconHash` → `IconTag`)뿐이고, props와 링크 대상은 그대로다.

```astro
---
import { getRelativeLocaleUrl } from "astro:i18n";
import IconTag from "@/assets/icons/IconTag.svg";
import config from "@/config";

type Props = {
  tag: string;
  tagName: string;
  size?: "sm" | "lg";
};

const { tag, tagName, size = "lg" } = Astro.props;

const locale = Astro.currentLocale ?? config.site.lang;
---

<li>
  <a
    href={getRelativeLocaleUrl(locale, `tags/${tag}/`)}
    transition:name={tag}
    class:list={[
      "inline-flex items-center gap-1.5 rounded-md px-4 py-2 transition-colors",
      "bg-muted text-muted-foreground dark:text-foreground",
      "hover:bg-tag-hover hover:text-tag-hover-foreground",
      "focus-visible:bg-tag-hover focus-visible:text-tag-hover-foreground",
      { "text-sm": size === "sm" },
      { "text-base": size === "lg" },
    ]}
  >
    <IconTag class="size-4 shrink-0" />
    {tagName}
  </a>
</li>
```

여백·모서리·아이콘 크기는 두 size가 완전히 같고 글자 크기만 다르다. 이건 의도다 — 두 페이지의 칩이 한 부품으로 보이게 하고, 나중에 모양을 손볼 때 고칠 곳을 한 군데로 남긴다.

- [ ] **Step 5: 호출부 간격을 좁힌다**

칩은 밑줄 링크보다 폭이 넓어 기존 간격이 과하다.

`src/pages/posts/[...slug]/index.astro` 188번째 줄:

```astro
    <ul class="mt-4 mb-8 flex flex-wrap gap-2 sm:my-8">
```

`src/pages/tags/index.astro` 26번째 줄:

```astro
    <ul class="flex flex-wrap gap-2">
```

- [ ] **Step 6: `IconHash`가 아직 쓰이는지 확인**

Run: `git grep -n "IconHash" -- src/`
Expected: 아무것도 안 나옴. 나오면 그 파일은 이번 작업 범위가 아니므로 그대로 둔다. 어느 쪽이든 `IconHash.svg` 파일 자체는 **지우지 않는다** — 업스트림 자산이라 병합 표면을 늘리지 않는다.

- [ ] **Step 7: 빌드로 검증**

Run: `corepack pnpm build`
Expected: 성공. `astro check`가 타입 오류 없이 통과한다.

- [ ] **Step 8: 눈으로 확인**

Run: `corepack pnpm dev`
확인할 것 (dev 서버는 http://localhost:4321):
- 아무 글이나 열어 하단 태그가 회색 칩으로 보인다
- 칩에 마우스를 올리면 **라이트·다크 모두** 배경이 어두운 먹색(`#353638`), 글자가 밝은 회색(`#f4f4f6`)이 된다 — 다크에서 밝게 반전되면 Step 3이 잘못 들어간 것이다
- 칩마다 태그 아이콘이 하나씩 있다
- `/tags` 페이지의 태그도 같은 칩이고 글자만 조금 크다
- Tab 키로 칩에 포커스를 옮기면 hover와 같은 모습이 된다

- [ ] **Step 9: 포맷과 커밋**

```bash
corepack pnpm format
git add src/assets/icons/IconTag.svg src/styles/theme.css src/components/Tag.astro "src/pages/posts/[...slug]/index.astro" src/pages/tags/index.astro
git commit -m "feat(tag): 본문 하단·태그 목록의 태그를 칩으로 재디자인

hover는 라이트·다크 모두 먹색으로 어두워진다. 테마에 따라 뒤집히는
기존 토큰으로는 표현할 수 없어 --tag-hover 토큰 두 개를 추가했다.
아이콘은 의미가 약한 해시(#)에서 태그로 교체하고 칩마다 넣는다."
```

---

### Task 2: 본문 하단 "맨 위로" 버튼 제거

**Files:**
- Modify: `src/pages/posts/[...slug]/index.astro:24, 186`
- Delete: `src/pages/posts/[...slug]/_components/BackToTopButton.astro`

**Interfaces:**
- Consumes: 없음
- Produces: 없음. i18n 키 `post.backToTop`은 **남는다** — `src/components/layout/FloatingControls.astro`가 계속 쓴다.

우하단 플로팅 버튼이 같은 일을 하므로 중복이다. 이 컴포넌트가 그리던 원형 진행률 표시도 함께 사라지지만, 화면 상단의 진행 바(`index.astro`의 인라인 스크립트, 203번째 줄부터)가 그대로 남으므로 독자가 잃는 정보는 없다.

- [ ] **Step 1: import를 지운다**

`src/pages/posts/[...slug]/index.astro` 24번째 줄을 삭제한다.

```astro
import BackToTopButton from "./_components/BackToTopButton.astro";
```

- [ ] **Step 2: 사용처를 지운다**

같은 파일 186번째 줄 근처. `<EditPost class="sm:hidden" ...>`와 태그 `<ul>` 사이의 이 줄을 삭제한다.

```astro
    <BackToTopButton />
```

- [ ] **Step 3: 컴포넌트 파일을 지운다**

```bash
git rm "src/pages/posts/[...slug]/_components/BackToTopButton.astro"
```

- [ ] **Step 4: 남은 참조가 없는지 확인**

Run: `git grep -n "BackToTopButton" -- src/`
Expected: 아무것도 안 나옴

Run: `git grep -n "backToTop" -- src/`
Expected: `src/components/layout/FloatingControls.astro`와 i18n 파일들(`src/i18n/lang/ko.ts`, `src/i18n/lang/en.ts`, `src/i18n/types.ts`)만 나옴. i18n 키는 지우지 않는다.

- [ ] **Step 5: 빌드로 검증**

Run: `corepack pnpm build`
Expected: 성공

- [ ] **Step 6: 눈으로 확인**

Run: `corepack pnpm dev`
확인할 것:
- 글을 아래로 스크롤해도 본문 안에 "맨 위로" 버튼이 더는 안 나온다
- 우하단 플로팅 버튼 두 개(테마·맨 위로)는 그대로 동작한다
- 화면 맨 위 진행 바는 그대로 있다

- [ ] **Step 7: 커밋**

```bash
git add "src/pages/posts/[...slug]/index.astro"
git commit -m "refactor(post): 본문 하단 맨 위로 버튼 제거

우하단 플로팅 버튼이 같은 일을 한다. i18n 키 post.backToTop은
플로팅 버튼이 계속 쓰므로 남긴다."
```

---

### Task 3: `getNearbyCategoryPosts` 유틸 (TDD)

**Files:**
- Create: `src/utils/getNearbyCategoryPosts.ts`
- Test: `tests/getNearbyCategoryPosts.test.ts`

**Interfaces:**
- Consumes: `filterByCategory`, `filterBySubcategory`, `type TaxonomyPost` (모두 `@/utils/getPostsByCategory`에 이미 있다)
- Produces:
  ```ts
  export type NearbyPost = TaxonomyPost & { id: string };
  export function getNearbyCategoryPosts<T extends NearbyPost>(
    sortedPosts: T[],
    current: T,
    limit?: number   // 기본 5
  ): T[];
  ```
  Task 4가 `CollectionEntry<"posts">[]`를 그대로 넘긴다. `CollectionEntry<"posts">`가 구조적으로 `NearbyPost`를 만족하므로 변환이 필요 없다.

**이 함수가 하지 않는 것:** 정렬과 초안/예약글 걸러내기. 호출부가 `getSortedPosts()`로 이미 끝낸 목록을 넘긴다. 그래서 이 함수는 `config`를 import하지 않고, 테스트도 Astro 런타임 없이 돈다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`tests/getNearbyCategoryPosts.test.ts`를 만든다. 픽스처 방식은 `tests/getPostsByCategory.test.ts`를 그대로 따랐다. 배열 순서가 곧 "최신순"이다 — 이 함수는 정렬하지 않고 받은 순서를 그대로 쓴다.

```ts
import { describe, it, expect } from "vitest";
import { getNearbyCategoryPosts } from "@/utils/getNearbyCategoryPosts";
import type { TaxonomyPost } from "@/utils/getPostsByCategory";

const post = (
  id: string,
  category: TaxonomyPost["data"]["category"],
  subcategory?: string,
  series?: string
) => ({ id, data: { category, subcategory, series } });

// 최신순으로 늘어놓은 목록. rendering 8개 + 다른 소분류/대분류.
const rendering = [
  post("r1", "deep-dive", "rendering"),
  post("r2", "deep-dive", "rendering"),
  post("r3", "deep-dive", "rendering"),
  post("r4", "deep-dive", "rendering"),
  post("r5", "deep-dive", "rendering"),
  post("r6", "deep-dive", "rendering"),
  post("r7", "deep-dive", "rendering"),
  post("r8", "deep-dive", "rendering"),
];
const all = [
  ...rendering,
  post("m1", "deep-dive", "memory"),
  post("e1", "etc"),
  post("e2", "etc"),
  post("e3", "etc"),
];
const ids = (posts: { id: string }[]) => posts.map(p => p.id);

describe("getNearbyCategoryPosts — 창 잡기", () => {
  it("가운데 글은 앞뒤를 섞어 5개를 준다", () => {
    expect(ids(getNearbyCategoryPosts(all, rendering[3]))).toEqual([
      "r1",
      "r2",
      "r3",
      "r5",
      "r6",
    ]);
  });

  it("맨 앞(최신) 글은 뒤쪽으로만 채워 5개를 준다", () => {
    expect(ids(getNearbyCategoryPosts(all, rendering[0]))).toEqual([
      "r2",
      "r3",
      "r4",
      "r5",
      "r6",
    ]);
  });

  it("맨 뒤(가장 오래된) 글은 앞쪽으로만 채워 5개를 준다", () => {
    expect(ids(getNearbyCategoryPosts(all, rendering[7]))).toEqual([
      "r3",
      "r4",
      "r5",
      "r6",
      "r7",
    ]);
  });

  it("limit 인자를 존중한다", () => {
    expect(ids(getNearbyCategoryPosts(all, rendering[3], 2))).toEqual([
      "r3",
      "r5",
    ]);
  });
});

describe("getNearbyCategoryPosts — 범위", () => {
  it("소분류가 있으면 같은 대분류의 다른 소분류를 섞지 않는다", () => {
    expect(ids(getNearbyCategoryPosts(all, rendering[3]))).not.toContain("m1");
  });

  it("소분류가 없으면 대분류 기준으로 모은다", () => {
    const current = all.find(p => p.id === "e2")!;
    expect(ids(getNearbyCategoryPosts(all, current))).toEqual(["e1", "e3"]);
  });

  it("글이 limit보다 적으면 있는 만큼만 주고 현재 글은 뺀다", () => {
    const current = all.find(p => p.id === "e1")!;
    expect(ids(getNearbyCategoryPosts(all, current))).toEqual(["e2", "e3"]);
  });

  it("범위 안에 현재 글뿐이면 빈 배열", () => {
    const solo = post("solo", "project");
    expect(getNearbyCategoryPosts([...all, solo], solo)).toEqual([]);
  });

  it("현재 글이 목록에 없으면 빈 배열", () => {
    const ghost = post("ghost", "deep-dive", "rendering");
    expect(getNearbyCategoryPosts(all, ghost)).toEqual([]);
  });
});

describe("getNearbyCategoryPosts — 시리즈", () => {
  // 시리즈 UI가 이미 같은 편들을 보여주므로 같은 연재는 뺀다.
  const seriesList = [
    post("s1", "project", undefined, "alpha"),
    post("s2", "project", undefined, "alpha"),
    post("s3", "project", undefined, "alpha"),
    post("p1", "project"),
    post("p2", "project"),
  ];

  it("같은 연재의 다른 편을 빼고 연재 밖 글로만 채운다", () => {
    expect(ids(getNearbyCategoryPosts(seriesList, seriesList[1]))).toEqual([
      "p1",
      "p2",
    ]);
  });

  it("다른 연재의 글은 남긴다", () => {
    const withBeta = [...seriesList, post("b1", "project", undefined, "beta")];
    expect(ids(getNearbyCategoryPosts(withBeta, withBeta[1]))).toContain("b1");
  });

  it("범위 안이 전부 같은 연재이면 빈 배열", () => {
    const onlySeries = seriesList.slice(0, 3);
    expect(getNearbyCategoryPosts(onlySeries, onlySeries[1])).toEqual([]);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `corepack pnpm exec vitest run tests/getNearbyCategoryPosts.test.ts`
Expected: FAIL — `Failed to resolve import "@/utils/getNearbyCategoryPosts"`

- [ ] **Step 3: 최소 구현을 쓴다**

`src/utils/getNearbyCategoryPosts.ts`를 만든다.

```ts
import {
  filterByCategory,
  filterBySubcategory,
  type TaxonomyPost,
} from "./getPostsByCategory";

/** 이 유틸이 요구하는 최소 형태. `CollectionEntry<"posts">`가 구조적으로 만족한다. */
export type NearbyPost = TaxonomyPost & { id: string };

/**
 * 같은 분류에서 현재 글 주변에 있는 글들을 돌려준다.
 *
 * 범위는 소분류가 있으면 소분류, 없으면 대분류다. 현재 글이 연재에 속해 있으면
 * 같은 연재의 다른 편은 뺀다 — 시리즈 UI가 이미 그 편들을 보여주므로 한 화면에
 * 같은 링크가 두 번 이상 뜨는 것을 막는다.
 *
 * 정렬과 초안/예약글 걸러내기는 하지 않는다. 호출부가 `getSortedPosts()`로
 * 끝낸 목록을 넘긴다.
 */
export function getNearbyCategoryPosts<T extends NearbyPost>(
  sortedPosts: T[],
  current: T,
  limit = 5
): T[] {
  const { category, subcategory, series } = current.data;

  const scoped = subcategory
    ? filterBySubcategory(sortedPosts, category, subcategory)
    : filterByCategory(sortedPosts, category);

  // current 자신은 창의 기준점이므로 남겨두고, 마지막에 뺀다.
  const pool = series
    ? scoped.filter(p => p.id === current.id || p.data.series !== series)
    : scoped;

  const index = pool.findIndex(p => p.id === current.id);
  if (index === -1) return [];

  // current를 포함한 limit+1 크기의 창을 잡는다. 창이 목록 경계를 넘으면
  // 남는 쪽으로 밀어 개수를 채운다 — 목록의 처음이나 끝에서도 짧아지지 않는다.
  const size = Math.min(limit + 1, pool.length);
  const start = Math.max(
    0,
    Math.min(index - Math.floor(size / 2), pool.length - size)
  );

  return pool.slice(start, start + size).filter(p => p.id !== current.id);
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

Run: `corepack pnpm exec vitest run tests/getNearbyCategoryPosts.test.ts`
Expected: PASS — 12개 테스트 전부 통과

- [ ] **Step 5: 포맷·린트하고 커밋**

```bash
corepack pnpm format
corepack pnpm lint
git add src/utils/getNearbyCategoryPosts.ts tests/getNearbyCategoryPosts.test.ts
git commit -m "feat(utils): 같은 분류에서 현재 글 주변 글을 찾는 유틸 추가

범위는 소분류 우선, 없으면 대분류. 같은 연재의 다른 편은 시리즈 UI가
이미 보여주므로 뺀다. 정렬은 호출부가 맡아 순수 함수로 유지했다."
```

---

### Task 4: "카테고리의 다른 글" 블록

**Files:**
- Create: `src/components/category/OtherPosts.astro`
- Modify: `src/i18n/types.ts:67-73`
- Modify: `src/i18n/lang/ko.ts`
- Modify: `src/i18n/lang/en.ts`
- Modify: `src/pages/posts/[...slug]/index.astro`

**Interfaces:**
- Consumes: `getNearbyCategoryPosts(sortedPosts, current, limit?)` (Task 3), `getSortedPosts(posts)` (`@/utils/getSortedPosts`, 이미 import돼 있음), `getPostUrl(id, filePath, locale)` (`@/utils/getPostPaths`), `getSubcategoryLabel(categoryId, sub)`와 `CATEGORIES` (`@/categories`), `useTranslations(locale)`·`tplStr(template, vars)` (`@/i18n`)
- Produces: 없음 (마지막 태스크)

- [ ] **Step 1: i18n 타입에 키를 추가한다**

`src/i18n/types.ts`의 `category` 블록에 한 줄을 넣는다.

```ts
  category: {
    desc: string;
    allPosts: string;
    seeMore: string;
    seriesCount: string;
    postCount: string;
    otherPosts: string;
  };
```

- [ ] **Step 2: 두 언어에 문자열을 넣는다**

`src/i18n/lang/ko.ts`의 `category` 블록에:

```ts
    otherPosts: "'{{label}}' 카테고리의 다른 글",
```

`src/i18n/lang/en.ts`의 `category` 블록에:

```ts
    otherPosts: "More in '{{label}}'",
```

- [ ] **Step 3: 타입 검사로 두 언어가 다 채워졌는지 확인**

Run: `corepack pnpm exec astro check`
Expected: 오류 없음. 한 언어만 넣었다면 `UIStrings`를 만족하지 않는다고 잡힌다.

- [ ] **Step 4: 컴포넌트를 만든다**

`src/components/category/OtherPosts.astro`. 업스트림 파일과 섞이지 않도록 `_components/`가 아니라 `src/components/` 아래 새 폴더에 둔다 — `series/`, `toc/`, `layout/`과 같은 방식이다.

```astro
---
import type { CollectionEntry } from "astro:content";
import IconMenuDeep from "@/assets/icons/IconMenuDeep.svg";
import IconArrowRight from "@/assets/icons/IconArrowRight.svg";
import { getPostUrl } from "@/utils/getPostPaths";
import { useTranslations, tplStr } from "@/i18n";
import config from "@/config";

type Props = {
  /** getNearbyCategoryPosts()의 결과. 비어 있으면 아무것도 렌더하지 않는다. */
  posts: CollectionEntry<"posts">[];
  /** 범위 이름. 소분류가 있으면 소분류 라벨, 없으면 대분류 라벨. */
  label: string;
};

const { posts, label } = Astro.props;
const locale = Astro.currentLocale ?? config.site.lang;
const t = useTranslations(locale);
---

{
  posts.length > 0 && (
    <aside
      data-pagefind-ignore
      class="bg-muted text-muted-foreground dark:text-foreground mt-4 mb-2 rounded-md p-5"
    >
      <div class="border-border mb-4 flex items-center justify-between gap-2 border-b pb-2 text-sm font-bold">
        <span class="truncate">{tplStr(t.category.otherPosts, { label })}</span>
        <IconMenuDeep class="size-4 shrink-0" aria-hidden="true" />
      </div>
      <ul class="flex flex-col gap-y-2">
        {posts.map(p => (
          <li>
            <a
              href={getPostUrl(p.id, p.filePath, locale)}
              class="flex items-center justify-between gap-2 text-sm underline-offset-4 hover:underline"
            >
              <span class="truncate">{p.data.title}</span>
              <IconArrowRight class="size-4 shrink-0" />
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}
```

두 가지가 의도적이다:

- `data-pagefind-ignore` — 글 페이지의 `<main>`에 `data-pagefind-body`가 붙어 있어서, 이걸 안 달면 **다른 글 제목 5개가 이 글의 본문으로 검색 색인에 들어간다.** 그러면 본문에 없는 단어로 이 글이 검색되고, 검색 결과 미리보기에 남의 글 제목이 뜬다. `AdjacentPostNav.astro`가 같은 이유로 같은 처리를 하고 있다.
- hover가 색이 아니라 밑줄이다 — 다크에서 `--accent`가 본문 글자색과 같아서 색으로는 변화가 안 보인다. "강조는 굵기·크기·밑줄로 낸다"는 이 저장소의 색 운용 원칙과도 맞는다.

- [ ] **Step 5: 페이지 frontmatter를 연결한다**

`src/pages/posts/[...slug]/index.astro`.

먼저 import를 추가한다. `import config from "@/config";` 줄 위, `AdjacentPostNav` import 아래에 넣는다.

```ts
import OtherPosts from "@/components/category/OtherPosts.astro";
import { getNearbyCategoryPosts } from "@/utils/getNearbyCategoryPosts";
import { CATEGORIES, getSubcategoryLabel } from "@/categories";
```

다음으로 시리즈 계산 블록(73~82번째 줄 근처)을 고친다. 지금은 `getCollection("posts")`를 인라인으로 부르고 있는데, 같은 결과를 두 번 읽지 않도록 변수로 뺀다.

**바꾸기 전:**

```ts
const seriesPosts = seriesId
  ? getSeriesPosts((await getCollection("posts")).filter(postFilter), seriesId)
  : [];
```

**바꾼 뒤:**

```ts
const allPosts = await getCollection("posts");

const seriesPosts = seriesId
  ? getSeriesPosts(allPosts.filter(postFilter), seriesId)
  : [];
```

그리고 `const { Content, headings } = await render(post);` 줄 **아래**에 다음을 넣는다.

```ts
// 같은 분류의 다른 글. 범위 라벨은 유틸이 고르는 범위와 같은 기준으로 뽑는다 —
// 제목이 곧 범위 설명이라 목록 항목에 소분류 뱃지를 달 필요가 없다.
const nearbyCategoryPosts = getNearbyCategoryPosts(
  getSortedPosts(allPosts),
  post
);
const categoryLabel =
  (post.data.subcategory &&
    getSubcategoryLabel(post.data.category, post.data.subcategory)) ||
  CATEGORIES[post.data.category].label;
```

- [ ] **Step 6: 블록을 렌더한다**

같은 파일의 본문에서, `<EditPost class="sm:hidden" ... />`(Task 2에서 `<BackToTopButton />`을 지운 자리)와 태그 `<ul>` 사이에 넣는다.

```astro
    <EditPost class="sm:hidden" {hideEditPost} {post} />

    <OtherPosts posts={nearbyCategoryPosts} label={categoryLabel} />

    <ul class="mt-4 mb-8 flex flex-wrap gap-2 sm:my-8">
```

- [ ] **Step 7: 전체 검증**

Run: `corepack pnpm verify`
Expected: 빌드 성공 후 `tests/`의 모든 테스트 통과 (`routes.test.ts` 포함)

Run: `corepack pnpm lint`
Expected: 오류 없음

- [ ] **Step 8: 시리즈 컴포넌트를 안 건드렸는지 확인**

Run: `git status --short src/components/series/`
Expected: 아무것도 안 나옴. 나오면 Global Constraints 위반이므로 되돌린다.

- [ ] **Step 9: 눈으로 확인**

Run: `corepack pnpm dev`
확인할 것:
- 소분류가 있는 글(예: `deep-dive/rendering`)에서 "'Rendering' 카테고리의 다른 글" 상자가 태그 바로 위에 뜬다
- 그 목록에 **같은 소분류 글만** 있다 (Architecture·Memory 글이 섞이면 안 된다)
- 소분류가 없는 글(예: `troubleshooting`)에서는 제목이 대분류 라벨이고 그 대분류 글이 뜬다
- 연재에 속한 글에서 **같은 연재의 다른 편이 이 상자에 없다** (본문 위 시리즈 상자에만 있다)
- 분류에 글이 하나뿐이면 상자가 아예 안 보인다
- 제목이 긴 글은 한 줄로 잘리고 오른쪽 화살표가 밀리지 않는다
- 라이트·다크 양쪽에서 상자 배경과 글자가 읽힌다

- [ ] **Step 10: 검색 색인이 오염되지 않았는지 확인**

Run: `corepack pnpm build`
그다음 `corepack pnpm preview`로 띄우고 `/search`에서, 어떤 글의 "다른 글" 목록에만 나오고 그 글 본문에는 없는 단어를 검색한다.
Expected: 그 단어를 실제로 담은 글만 결과에 뜬다. 목록에 제목이 실려 있던 글이 함께 뜨면 `data-pagefind-ignore`가 빠진 것이다.

- [ ] **Step 11: 포맷하고 커밋**

```bash
corepack pnpm format
git add src/components/category/OtherPosts.astro src/i18n/ "src/pages/posts/[...slug]/index.astro"
git commit -m "feat(post): 본문 하단에 같은 분류의 다른 글 목록 추가

범위는 소분류 우선, 없으면 대분류. 같은 연재의 다른 편은 빼서
시리즈 UI와 링크가 겹치지 않게 했다. 다른 글 제목이 이 글의 본문으로
색인되지 않도록 검색에서 제외한다."
```

---

## 완료 확인

전부 끝난 뒤 설계 문서의 완료 기준(§6)을 하나씩 확인한다.

- [ ] 글 하단 태그가 칩으로 보이고, hover 시 라이트·다크 모두 먹색으로 바뀐다
- [ ] 태그 목록 페이지(`/tags`)의 태그도 같은 칩으로 보인다
- [ ] 본문 하단에 "맨 위로" 버튼이 없고, 우하단 플로팅 버튼은 그대로 동작한다
- [ ] 소분류가 있는 글에서 같은 소분류 글만 최대 5개 뜬다
- [ ] 소분류가 없는 글에서 같은 대분류 글이 최대 5개 뜬다
- [ ] 카테고리에 글이 하나뿐이면 블록이 아예 렌더되지 않는다
- [ ] 시리즈 글에서 이 블록에 같은 연재의 다른 편이 뜨지 않는다
- [ ] `SeriesBox.astro`·`SeriesNav.astro`는 이번 diff에 등장하지 않는다 (`git diff main --stat`으로 확인)
- [ ] `corepack pnpm verify`와 `corepack pnpm lint`가 통과한다
