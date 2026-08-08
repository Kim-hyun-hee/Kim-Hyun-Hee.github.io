# 글 헤더 재구성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 글 페이지 헤더를 "분류·날짜 → 제목 → 글쓴이" 순서로 재구성하고, 날짜 형식을 사이트 전체에서 한글로 통일한다.

**Architecture:** 헤더 마크업을 `_components/PostHeader.astro` 한 곳으로 모아 566줄짜리 `index.astro`에서 덜어낸다. 분류 경로 계산은 순수 함수 `getCategoryTrail`로 빼서 단위 테스트한다. 날짜는 기존 `Datetime.astro`를 고쳐 재사용한다.

**Tech Stack:** Astro 7, Tailwind CSS v4 (`@apply`), vitest, dayjs, `astro:assets`

## Global Constraints

- 패키지 매니저는 `corepack pnpm`. `pnpm`은 PATH에 없다. `npm`은 금지(`package-lock.json`이 생긴다)
- `corepack pnpm format`을 저장소 전체에 돌리지 않는다. 건드린 파일만 `corepack pnpm exec prettier --write <경로>`
- 포인트 색은 표시(선·테두리·밑줄)에만 쓴다. 본문 크기 텍스트에는 쓰지 않는다. 링크는 글씨 `--link` + 밑줄만 포인트 색
- 커밋 메시지와 코드 주석에 원본 스킨 이름·제작자명·플랫폼명을 쓰지 않는다
- 주석은 주변 코드처럼 최소로 쓴다
- 검증 기준: `corepack pnpm build` 0 errors / `corepack pnpm test` 전부 통과 / `corepack pnpm lint` clean

---

### Task 1: 분류 경로 순수 함수

**Files:**
- Create: `src/utils/getCategoryTrail.ts`
- Test: `tests/getCategoryTrail.test.ts`

**Interfaces:**
- Consumes: `CATEGORIES`, `getSubcategoryLabel`, `CategoryId` (모두 `@/categories`에 이미 있다)
- Produces: `getCategoryTrail(category: CategoryId, subcategory?: string): TrailItem[]`, `type TrailItem = { label: string; path: string }`. Task 3의 `PostHeader.astro`가 이것을 쓴다. `path`는 `getRelativeLocaleUrl`에 넘길 상대 경로이며 앞에 슬래시가 없다

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/getCategoryTrail.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getCategoryTrail } from "@/utils/getCategoryTrail";

describe("getCategoryTrail", () => {
  it("소분류가 있으면 대분류와 소분류를 순서대로 담는다", () => {
    expect(getCategoryTrail("deep-dive", "rendering")).toEqual([
      { label: "Deep Dive", path: "categories/deep-dive" },
      { label: "Rendering", path: "categories/deep-dive/rendering" },
    ]);
  });

  it("소분류를 갖지 않는 대분류는 대분류만 담는다", () => {
    expect(getCategoryTrail("project")).toEqual([
      { label: "Project", path: "categories/project" },
    ]);
  });

  it("소분류 값이 유효하지 않으면 대분류만 담는다", () => {
    expect(getCategoryTrail("deep-dive", "없는소분류")).toEqual([
      { label: "Deep Dive", path: "categories/deep-dive" },
    ]);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `corepack pnpm exec vitest run tests/getCategoryTrail.test.ts`
Expected: FAIL — `Failed to resolve import "@/utils/getCategoryTrail"`

- [ ] **Step 3: 최소 구현**

`src/utils/getCategoryTrail.ts`:

```ts
import {
  CATEGORIES,
  getSubcategoryLabel,
  type CategoryId,
} from "@/categories";

export type TrailItem = { label: string; path: string };

/** 글 헤더 메타 줄이 쓰는 분류 경로. 소분류가 없거나 유효하지 않으면 대분류만 담는다. */
export function getCategoryTrail(
  category: CategoryId,
  subcategory?: string
): TrailItem[] {
  const trail: TrailItem[] = [
    { label: CATEGORIES[category].label, path: `categories/${category}` },
  ];

  const subLabel = subcategory
    ? getSubcategoryLabel(category, subcategory)
    : undefined;

  if (subLabel) {
    trail.push({
      label: subLabel,
      path: `categories/${category}/${subcategory}`,
    });
  }

  return trail;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `corepack pnpm exec vitest run tests/getCategoryTrail.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
corepack pnpm exec prettier --write src/utils/getCategoryTrail.ts tests/getCategoryTrail.test.ts
git add src/utils/getCategoryTrail.ts tests/getCategoryTrail.test.ts
git commit -m "feat(post): 분류 경로를 만드는 순수 함수 추가"
```

---

### Task 2: 날짜 형식 통일과 아이콘 스위치

**Files:**
- Modify: `src/components/Datetime.astro:12-18` (Props), `:36` (형식), `:42-47` (아이콘)

**Interfaces:**
- Produces: `Datetime`에 `icon?: boolean` prop이 생긴다. 기본값 `true`. Task 3이 `icon={false}`로 쓴다
- 기존 호출부(`Card.astro`, `archives/index.astro`, `PostLayout.astro`)는 수정하지 않는다. 기본값이 현재 동작과 같다

- [ ] **Step 1: Props에 `icon` 추가**

`src/components/Datetime.astro`의 `type Props`에 한 줄 넣는다:

```ts
type Props = {
  class?: string;
  size?: "sm" | "lg";
  icon?: boolean;
  pubDatetime: string | Date;
  timezone?: string;
  modDatetime?: string | Date | null;
};
```

구조 분해에도 기본값과 함께 넣는다:

```ts
const {
  pubDatetime,
  modDatetime,
  size = "sm",
  icon = true,
  class: className = "",
  timezone: postTimezone,
} = Astro.props;
```

- [ ] **Step 2: 날짜 형식을 한글로**

36행을 바꾼다:

```ts
const date = datetime.format("YYYY[년] M[월] D[일]");
```

대괄호는 dayjs의 리터럴 escape다. `년`·`월`·`일`이 형식 토큰으로 해석되지 않게 한다.

- [ ] **Step 3: 아이콘을 조건부로**

`<IconCalendar ... />`를 감싼다:

```astro
{
  icon && (
    <IconCalendar
      class:list={[
        "inline-block size-6 min-w-5.5",
        { "scale-90": size === "sm" },
      ]}
    />
  )
}
```

- [ ] **Step 4: 빌드와 테스트 확인**

Run: `corepack pnpm build`
Expected: 0 errors

Run: `corepack pnpm test`
Expected: 전부 통과 (이 변경은 순수 함수 테스트에 영향이 없다)

- [ ] **Step 5: 목록 화면에서 눈으로 확인**

dev 서버가 떠 있지 않으면 `corepack pnpm dev`.

Run: `curl -s http://localhost:4321/posts | grep -o '[0-9]\{4\}년 [0-9]\+월 [0-9]\+일' | head -3`
Expected: `2026년 8월 8일` 형태가 나온다. 영문 `8 Aug, 2026`은 안 나와야 한다

- [ ] **Step 6: 커밋**

```bash
corepack pnpm exec prettier --write src/components/Datetime.astro
git add src/components/Datetime.astro
git commit -m "style(post): 날짜 형식을 한글로 통일하고 아이콘 스위치 추가"
```

---

### Task 3: PostHeader 컴포넌트와 배선

**Files:**
- Create: `src/pages/posts/[...slug]/_components/PostHeader.astro`
- Modify: `src/components/series/SeriesBadge.astro:26` (래퍼)
- Modify: `src/pages/posts/[...slug]/index.astro` (import 정리, 84-87행 계산 제거, 132-161행 마크업 교체)

**Interfaces:**
- Consumes: Task 1의 `getCategoryTrail(category, subcategory): TrailItem[]`, Task 2의 `Datetime`의 `icon` prop
- Produces: `<PostHeader post={CollectionEntry<"posts">} seriesPosition={{ current: number | null; total: number } | null} />`

- [ ] **Step 1: SeriesBadge 래퍼를 인라인으로**

`src/components/series/SeriesBadge.astro`의 26행 여는 태그와 마지막 닫는 태그를 바꾼다.

바꾸기 전:
```astro
<p class="text-muted-foreground mt-1 text-sm">
```
바꾼 뒤:
```astro
<span>
```

파일 끝의 `</p>`도 `</span>`으로 바꾼다.

여백·색·크기는 이제 메타 줄이 정한다. 내부 로직(`SERIES` 조회, `current === null` 분기, `tplStr`)은 손대지 않는다.

- [ ] **Step 2: PostHeader 작성**

`src/pages/posts/[...slug]/_components/PostHeader.astro`:

```astro
---
import type { CollectionEntry } from "astro:content";
import { Image } from "astro:assets";
import { getRelativeLocaleUrl } from "astro:i18n";
import Datetime from "@/components/Datetime.astro";
import SeriesBadge from "@/components/series/SeriesBadge.astro";
import profileImage from "@/assets/images/profile.png";
import { getCategoryTrail } from "@/utils/getCategoryTrail";
import { toTransitionName } from "@/utils/toTransitionName";
import config from "@/config";

type Props = {
  post: CollectionEntry<"posts">;
  seriesPosition: { current: number | null; total: number } | null;
};

const { post, seriesPosition } = Astro.props;
const locale = Astro.currentLocale ?? config.site.lang;

const {
  title,
  pubDatetime,
  modDatetime,
  timezone,
  category,
  subcategory,
  series,
} = post.data;

const trail = getCategoryTrail(category, subcategory);
---

<header>
  <div
    class="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
  >
    {
      trail.map((item, i) => (
        <>
          {i > 0 && <span aria-hidden="true">›</span>}
          <a
            href={getRelativeLocaleUrl(locale, item.path)}
            class="decoration-accent underline-offset-4 hover:underline"
          >
            {item.label}
          </a>
        </>
      ))
    }

    <span aria-hidden="true">·</span>
    <Datetime {pubDatetime} {modDatetime} {timezone} icon={false} />

    {
      series && seriesPosition && (
        <>
          <span aria-hidden="true">·</span>
          <SeriesBadge
            seriesId={series}
            current={seriesPosition.current}
            total={seriesPosition.total}
          />
        </>
      )
    }
  </div>

  <h1
    style={{ viewTransitionName: toTransitionName(post.id) }}
    class="text-foreground mt-2 inline-block text-2xl font-bold sm:text-3xl"
  >
    {title}
  </h1>

  <div class="mt-4 flex items-center gap-3">
    <Image
      src={profileImage}
      alt=""
      width={96}
      height={96}
      class="size-12 rounded-full"
    />
    <div class="text-sm leading-snug">
      <p class="text-foreground font-semibold">{config.site.title}</p>
      <p class="text-muted-foreground">Software Engineer</p>
    </div>
  </div>
</header>
```

메타 줄이 `<p>`가 아니라 `<div>`인 이유: `Datetime`의 루트가 `<div>`라서 `<p>` 안에 넣으면 잘못된 HTML이 된다.

`alt=""`인 이유: 바로 옆에 이름이 텍스트로 있어 대체 텍스트를 넣으면 스크린리더가 같은 정보를 두 번 읽는다.

- [ ] **Step 3: index.astro 배선**

`src/pages/posts/[...slug]/index.astro`에서 다섯 가지를 한다.

(a) import 추가:
```ts
import PostHeader from "./_components/PostHeader.astro";
```

(b) import 삭제 — 이 파일에서 더 이상 안 쓴다:
```ts
import Datetime from "@/components/Datetime.astro";
import SeriesBadge from "@/components/series/SeriesBadge.astro";
import EditPost from "./_components/EditPost.astro";
```

**`CATEGORIES`와 `getSubcategoryLabel` import는 남긴다.** 84-87행의
`categoryLabel`이 계속 필요하다 — 다음 항목을 보라.

(c) **84-87행의 `categoryLabel` 계산은 그대로 둔다.** 헤더 전용이 아니라
186행의 `<CategoryPosts label={categoryLabel} />`가 쓴다. 지우면 본문 아래
"카테고리의 다른 글" 상자의 제목이 깨진다.

(d) 132-161행의 `<h1>`·날짜 `<div>`·`<SeriesBadge>` 블록을 전부 지우고 한
줄로 바꾼다:
```astro
<PostHeader {post} seriesPosition={seriesPosition} />
```

(e) **176행의 두 번째 `<EditPost>`도 지운다.**

```astro
<EditPost class="sm:hidden" {hideEditPost} {post} />
```

본문 아래 `<hr>` 다음에 있는 모바일용 렌더다. 이것까지 지우면
`hideEditPost`를 쓰는 곳이 없어지므로 71행 구조 분해에서도 뺀다.

지운 뒤 확인:

```bash
grep -n "EditPost\|hideEditPost\|Datetime\|SeriesBadge" "src/pages/posts/[...slug]/index.astro"
```

Expected: 14-21행의 `[CUSTOM]` 주석 외에는 아무것도 안 나온다. 그 주석은
업스트림 병합용 안내이므로 `<EditPost>` 삭제 사실을 한 줄 덧붙여 갱신한다.

- [ ] **Step 4: 빌드·테스트·린트**

Run: `corepack pnpm build`
Expected: 0 errors

Run: `corepack pnpm test`
Expected: 전부 통과

Run: `corepack pnpm lint`
Expected: 출력 없음

- [ ] **Step 5: 커밋**

```bash
corepack pnpm exec prettier --write "src/pages/posts/[...slug]/_components/PostHeader.astro" "src/pages/posts/[...slug]/index.astro" src/components/series/SeriesBadge.astro
git add "src/pages/posts/[...slug]/_components/PostHeader.astro" "src/pages/posts/[...slug]/index.astro" src/components/series/SeriesBadge.astro
git commit -m "feat(post): 글 헤더를 분류·날짜·제목·글쓴이 순으로 재구성"
```

---

### Task 4: 실물 검증

**Files:** 없음 (확인만 한다. 문제가 나오면 해당 Task로 돌아간다)

- [ ] **Step 1: dev 서버 재시작**

`content.config.ts`·`categories.ts`를 건드리지 않았더라도 컴포넌트가 새로 생겼으므로 한 번 재시작한다.

```bash
corepack pnpm astro dev stop; corepack pnpm dev
```

PowerShell에서는 `&&`가 아니라 `;`다.

- [ ] **Step 2: 네 경우를 확인**

각 경우에 해당하는 글 URL을 찾아 연다. 한글이 든 경로는 curl에 `--path-as-is`와 퍼센트 인코딩이 필요하므로 브라우저로 보는 편이 낫다.

1. **소분류가 있는 글** — `Deep Dive › Rendering`이 둘 다 나오고 각각 눌러서 해당 분류 목록으로 이동
2. **소분류가 없는 글** (`project`·`troubleshooting`·`etc`) — `›`가 없고 대분류만
3. **시리즈 글** — 메타 줄 끝에 시리즈명과 편수가 붙고 줄이 깨지지 않음
4. **수정된 글** — `수정일:` 접두가 붙음

- [ ] **Step 3: 헤더 외부 확인**

- 글 목록(`/posts`)과 아카이브(`/archives`)의 날짜도 한글인지
- 제목이 먹색인지 (보라면 팔레트 규칙 위반)
- 프로필 사진이 원형인지 (본문 이미지의 `rounded-lg`가 새어 나오지 않았는지)
- 모바일 폭에서 메타 줄이 가로 스크롤을 만들지 않고 줄바꿈하는지

- [ ] **Step 4: 라이트·다크 양쪽**

우하단 테마 토글로 두 테마를 모두 본다. 분류 링크의 밑줄 포인트 색이 다크에서도 보이는지 확인한다.

- [ ] **Step 5: 최종 확인**

```bash
corepack pnpm build && corepack pnpm test && corepack pnpm lint
git status --short
```

Expected: build 0 errors, test 전부 통과, lint 출력 없음, 워킹트리에 커밋 안 된 변경 없음
