# 글 간 이동 구조 재설계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 본문 끝 같은 자리에 "다음에 읽을 것" 상자를 하나만 두고, 글 페이지에서도 사이드바가 현재 위치를 잃지 않게 한다.

**Architecture:** 하단 상자 두 종류(시리즈·카테고리)가 공통 껍데기 컴포넌트를 공유한다. 껍데기가 배경·제목 줄·검색 색인 제외를 책임지고, 내용물은 목록만 그린다. 사이드바는 "지금 어디 있는가"를 판정하는 순수 함수를 따로 두고(테스트 가능), `Sidebar.astro`가 그 함수를 호출해 `SidebarNav`에 값을 내려준다 — `SidebarNav`는 받아서 그리기만 한다.

**Tech Stack:** Astro 5, Tailwind CSS v4, TypeScript, Vitest

**설계 문서:** `docs/superpowers/specs/2026-08-07-post-navigation-design.md`

## Global Constraints

- **패키지 매니저는 pnpm이고 PATH에 없다.** 모든 명령은 `corepack pnpm ...` 으로 실행한다. `npm install`을 절대 돌리지 않는다.
- **`corepack pnpm format`을 저장소 전체에 돌리지 않는다.** 기존 드리프트 때문에 무관한 파일 90여 개가 재포맷된다. 건드린 파일만 경로로 지정해 `corepack pnpm exec prettier --write <경로>` 를 쓴다.
- **`git add -A` / `git add .` 를 쓰지 않는다.** 경로로 명시해 스테이징하고, 커밋 전에 `git status --short`로 의도한 파일만 올라갔는지 확인한다.
- **커밋 메시지와 코드 주석에 특정 고유명사를 쓰지 않는다.** 목록은 저장소 루트의 로컬 작업 메모 파일에 있다.
- **커밋 메시지와 코드 주석은 한국어로 쓴다.**
- **UI에 유채색을 쓰지 않는다.** 새로 쓰는 색은 기존 토큰(`--muted`, `--border`, `--foreground`, `--muted-foreground`)에서 가져온다.
- **`src/series.ts` / `src/categories.ts` / `content.config.ts` 를 고치면 dev 서버를 재시작해야 값이 반영된다.** 이 계획에서는 세 파일 모두 건드리지 않지만, 화면이 이상하면 재시작을 먼저 의심한다.
- 전체 검증은 `corepack pnpm build` 후 `corepack pnpm test` 를 따로 돌린다. `corepack pnpm verify` 스크립트는 내부에서 맨 `pnpm`을 호출해 실패한다.
- `tests/routes.test.ts` 는 빌드된 `dist/` 가 있어야 돈다. 테스트 전에 빌드한다.

---

### Task 1: 하단 상자 껍데기와 카테고리 상자 이동

**Files:**
- Create: `src/components/related/RelatedBox.astro`
- Create: `src/components/related/CategoryPosts.astro`
- Delete: `src/components/category/OtherPosts.astro` (폴더째 비므로 `src/components/category/` 도 사라진다)
- Modify: `src/pages/posts/[...slug]/index.astro`

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces:
  - `RelatedBox.astro` — Props `{ title: string }`, 이름 있는 슬롯 `title-aside`(제목 줄 우측), 기본 슬롯(내용)
  - `CategoryPosts.astro` — Props `{ posts: CollectionEntry<"posts">[]; label: string }`. `posts`가 비면 아무것도 렌더하지 않는다

이 태스크는 **겉모습을 바꾸지 않는다.** 렌더 결과가 지금과 같아야 한다. 껍데기만 분리하는 리팩터링이다.

- [ ] **Step 1: 껍데기 컴포넌트를 만든다**

`src/components/related/RelatedBox.astro`:

```astro
---
/**
 * 본문 끝 "다음에 읽을 것" 상자의 공통 껍데기.
 * 배경·모서리·제목 줄과 검색 색인 제외를 여기서 책임진다. 내용물
 * (SeriesPosts / CategoryPosts)은 목록만 그린다.
 */
type Props = {
  /** 상자 제목. 예: "이 시리즈의 글" */
  title: string;
};

const { title } = Astro.props;
---

<aside
  data-pagefind-ignore
  class="bg-muted text-muted-foreground dark:text-foreground mt-4 mb-2 rounded-md p-5"
>
  <div
    class="border-border mb-4 flex items-center justify-between gap-2 border-b pb-2 text-sm font-bold"
  >
    <span class="truncate">{title}</span>
    <slot name="title-aside" />
  </div>
  <slot />
</aside>
```

`data-pagefind-ignore`가 껍데기에 있는 이유: 두 상자 모두 **다른 글 제목**을 담는다. 글 페이지의 `<main>`에 `data-pagefind-body`가 붙어 있어서, 이게 없으면 남의 글 제목이 이 글의 본문으로 검색 색인에 들어간다.

- [ ] **Step 2: 카테고리 상자를 새 위치에 만든다**

`src/components/related/CategoryPosts.astro`:

```astro
---
import type { CollectionEntry } from "astro:content";
import IconMenuDeep from "@/assets/icons/IconMenuDeep.svg";
import IconArrowRight from "@/assets/icons/IconArrowRight.svg";
import RelatedBox from "./RelatedBox.astro";
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
    <RelatedBox title={tplStr(t.category.otherPosts, { label })}>
      <IconMenuDeep
        slot="title-aside"
        class="size-4 shrink-0"
        aria-hidden="true"
      />
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
    </RelatedBox>
  )
}
```

- [ ] **Step 3: 옛 파일을 지운다**

```bash
git rm "src/components/category/OtherPosts.astro"
```

- [ ] **Step 4: 글 페이지의 import와 사용처를 고친다**

`src/pages/posts/[...slug]/index.astro`에서 이 줄을

```astro
import OtherPosts from "@/components/category/OtherPosts.astro";
```

이렇게 바꾼다.

```astro
import CategoryPosts from "@/components/related/CategoryPosts.astro";
```

그리고 본문의 이 줄을

```astro
    <OtherPosts posts={nearbyCategoryPosts} label={categoryLabel} />
```

이렇게 바꾼다.

```astro
    <CategoryPosts posts={nearbyCategoryPosts} label={categoryLabel} />
```

파일 상단 `[CUSTOM]` 주석 블록에도 `OtherPosts`가 이름으로 등장한다. `CategoryPosts`로 고친다. 이 주석은 업스트림 병합 안내라서 실제 이름과 어긋나면 안 된다.

- [ ] **Step 5: 남은 참조가 없는지 확인**

Run: `git grep -n "OtherPosts" -- src/`
Expected: 아무것도 안 나옴. `src/content/posts/` 안의 글 본문에서 나오면 그건 예시 텍스트이니 그대로 둔다.

Run: `git grep -n "components/category" -- src/`
Expected: 아무것도 안 나옴

- [ ] **Step 6: 렌더 결과가 그대로인지 확인**

Run: `corepack pnpm build`
Expected: 0 errors

Run: `grep -c 'data-pagefind-ignore' dist/posts/unity-render-pipeline/01-what-srp-replaces/index.html`
Expected: `2` — 카테고리 상자와 `AdjacentPostNav` 둘 다 이 속성을 갖는다. `AdjacentPostNav`는 Task 2에서 사라진다

Run: `sed -n '/카테고리의 다른 글/,/<\/aside>/p' dist/posts/unity-render-pipeline/01-what-srp-replaces/index.html | grep -o '<span class="truncate">[^<]*</span>' | sed 's/<[^>]*>//g'`
Expected: 제목 줄 `'Rendering' 카테고리의 다른 글` 과 글 제목 2개가 나온다 — 이동 전과 같다

- [ ] **Step 7: 포맷하고 커밋**

```bash
corepack pnpm exec prettier --write src/components/related/RelatedBox.astro src/components/related/CategoryPosts.astro "src/pages/posts/[...slug]/index.astro"
git status --short
git add src/components/related "src/pages/posts/[...slug]/index.astro"
git commit -m "refactor(related): 하단 상자 껍데기를 분리하고 카테고리 상자를 옮김

시리즈 상자도 같은 껍데기를 쓰게 되므로 배경·제목 줄·검색 색인 제외를
RelatedBox 한 곳으로 모았다. 렌더 결과는 그대로다."
```

---

### Task 2: 이전 글 / 다음 글 제거

**Files:**
- Delete: `src/pages/posts/[...slug]/_components/AdjacentPostNav.astro`
- Modify: `src/pages/posts/[...slug]/index.astro`

**Interfaces:**
- Consumes: 없음
- Produces: 없음. `getStaticPaths`가 더 이상 `prevPost`/`nextPost` props를 넘기지 않는다

시간순 이웃은 주제 관계를 드러내지 못한다. 같은 자리에서 같은 질문에 더 잘 답하는 "카테고리의 다른 글"이 이미 있다.

- [ ] **Step 1: import를 지운다**

`src/pages/posts/[...slug]/index.astro`에서 이 줄을 삭제한다.

```astro
import AdjacentPostNav from "./_components/AdjacentPostNav.astro";
```

- [ ] **Step 2: 사용처를 지운다**

파일 맨 아래쪽, `</main>` 직전의 이 줄을 삭제한다.

```astro
    <AdjacentPostNav {prevPost} {nextPost} />
```

- [ ] **Step 3: 죽은 props 계산을 걷어낸다**

`getStaticPaths`가 앞뒤 글을 계산해 넘기고 있는데 이제 쓰는 곳이 없다. 현재 모습:

```ts
export async function getStaticPaths() {
  const posts = await getCollection("posts");
  const sortedPosts = getSortedPosts(posts);

  return sortedPosts.map((post, index) => ({
    params: { slug: getPostSlug(post.id, post.filePath) },
    props: {
      post,
      // sortedPosts is newest-first, so "older" (prev) is a higher index
      // and "newer" (next) is a lower index.
      prevPost:
        index < sortedPosts.length - 1
          ? {
              id: sortedPosts[index + 1].id,
              title: sortedPosts[index + 1].data.title,
              filePath: sortedPosts[index + 1].filePath,
            }
          : null,
      nextPost:
        index > 0
          ? {
              id: sortedPosts[index - 1].id,
              title: sortedPosts[index - 1].data.title,
              filePath: sortedPosts[index - 1].filePath,
            }
          : null,
    },
  }));
}

type AdjacentPost = {
  id: string;
  title: string;
  filePath: string | undefined;
} | null;

type Props = {
  post: CollectionEntry<"posts">;
  prevPost: AdjacentPost;
  nextPost: AdjacentPost;
};

const { post, prevPost, nextPost } = Astro.props;
```

이걸 통째로 아래로 교체한다.

```ts
export async function getStaticPaths() {
  const posts = await getCollection("posts");

  return getSortedPosts(posts).map(post => ({
    params: { slug: getPostSlug(post.id, post.filePath) },
    props: { post },
  }));
}

type Props = {
  post: CollectionEntry<"posts">;
};

const { post } = Astro.props;
```

- [ ] **Step 4: 컴포넌트 파일을 지운다**

```bash
git rm "src/pages/posts/[...slug]/_components/AdjacentPostNav.astro"
```

- [ ] **Step 5: 남은 참조가 없는지 확인**

Run: `git grep -n "AdjacentPostNav\|prevPost" -- src/`
Expected: 아무것도 안 나옴

Run: `git grep -n "previousPost\|nextPost" -- src/`
Expected: `src/i18n/types.ts`, `src/i18n/lang/ko.ts`, `src/i18n/lang/en.ts` 의 `post.previousPost` / `post.nextPost` 키만 나온다. **지우지 않는다** — 이번 범위 밖이고 되살릴 수도 있다. 그 밖의 파일에서 나오면 지우다 만 것이다

- [ ] **Step 6: 타입 검사와 빌드**

Run: `corepack pnpm exec astro check`
Expected: 0 errors — 안 쓰는 props를 지웠으므로 타입 오류가 없어야 한다

Run: `corepack pnpm build`
Expected: 0 errors

Run: `grep -c "이전 글\|다음 글" dist/posts/digitaltwin/05-culling/index.html`
Expected: `0`

- [ ] **Step 7: 포맷하고 커밋**

```bash
corepack pnpm exec prettier --write "src/pages/posts/[...slug]/index.astro"
git status --short
git add "src/pages/posts/[...slug]/index.astro"
git commit -m "refactor(post): 시간순 이전 글 / 다음 글 제거

날짜가 이웃이라는 것 말고는 두 글 사이에 관계가 없어서 이동할 이유를
주지 못했다. 같은 자리의 카테고리 상자가 주제로 묶인 이웃을 보여준다.
쓰이지 않게 된 getStaticPaths의 앞뒤 글 계산도 함께 걷어냈다."
```

---

### Task 3: 시리즈 UI를 상단 배지와 하단 상자로 분리

**Files:**
- Create: `src/components/series/SeriesBadge.astro`
- Create: `src/components/related/SeriesPosts.astro`
- Delete: `src/components/series/SeriesBox.astro`
- Delete: `src/components/series/SeriesNav.astro`
- Modify: `src/i18n/types.ts`
- Modify: `src/i18n/lang/ko.ts`
- Modify: `src/i18n/lang/en.ts`
- Modify: `src/pages/posts/[...slug]/index.astro`

**Interfaces:**
- Consumes: `RelatedBox.astro` (Task 1) — Props `{ title: string }`, 슬롯 `title-aside`와 기본 슬롯
- Produces:
  - `SeriesBadge.astro` — Props `{ seriesId: SeriesId; current: number | null; total: number }`
  - `SeriesPosts.astro` — Props `{ seriesId: SeriesId; posts: CollectionEntry<"posts">[]; currentOrder: number }`

기존 `SeriesBox`가 위치 표시와 목록을 겸해서 둘 다 어중간했다. 접힌 목록은 클릭 전엔 안 보이고, 본문 위에 있어서 다 읽고 나면 화면 밖이다. 역할대로 쪼갠다.

`getSeriesPosition(posts, seriesId, order)`는 이미 있는 유틸이고 `{ current, total, prev, next }`를 돌려준다. 현재 편이 목록에 없으면 `current`는 `null`, `prev`/`next`는 둘 다 `null`이다.

- [ ] **Step 1: i18n 타입을 고친다**

`src/i18n/types.ts`의 `series` 블록에서 `part`를 지우고 `badge`를 넣는다. 결과:

```ts
  series: {
    title: string;
    desc: string;
    badge: string;
    ongoing: string;
    completed: string;
    prevPart: string;
    nextPart: string;
    inThisSeries: string;
    empty: string;
  };
```

- [ ] **Step 2: 두 언어 문자열을 고친다**

`src/i18n/lang/ko.ts`의 `series` 블록에서 이 줄을

```ts
    part: "{{total}}편 중 {{current}}편",
```

이렇게 바꾼다.

```ts
    badge: "{{current}}/{{total}}편",
```

`src/i18n/lang/en.ts`의 `series` 블록에서 이 줄을

```ts
    part: "Part {{current}} of {{total}}",
```

이렇게 바꾼다.

```ts
    badge: "Part {{current}} of {{total}}",
```

- [ ] **Step 3: 상단 배지 컴포넌트를 만든다**

`src/components/series/SeriesBadge.astro`:

```astro
---
import { getRelativeLocaleUrl } from "astro:i18n";
import { SERIES, type SeriesId } from "@/series";
import { useTranslations, tplStr } from "@/i18n";
import config from "@/config";

/**
 * 본문 위 한 줄짜리 연재 위치 표시. 목록도 접기도 없다.
 * 검색으로 중간 편에 들어온 사람이 이 글이 연재의 일부라는 것을
 * 다 읽기 전에 알 수 있게 하는 것이 전부다. 목록과 이동은 하단
 * SeriesPosts가 맡는다.
 */
type Props = {
  seriesId: SeriesId;
  /** 현재 편 번호. 예약 발행 등으로 목록에 없으면 null. */
  current: number | null;
  total: number;
};

const { seriesId, current, total } = Astro.props;
const locale = Astro.currentLocale ?? config.site.lang;
const t = useTranslations(locale);
---

<p class="text-muted-foreground mt-1 text-sm">
  <a
    href={getRelativeLocaleUrl(locale, `series/${seriesId}`)}
    class="underline-offset-4 hover:underline"
  >
    {SERIES[seriesId].label}
  </a>
  {
    current !== null && (
      <Fragment>
        <span aria-hidden="true"> · </span>
        {tplStr(t.series.badge, { current, total })}
      </Fragment>
    )
  }
</p>
```

- [ ] **Step 4: 하단 시리즈 상자를 만든다**

`src/components/related/SeriesPosts.astro`:

```astro
---
import type { CollectionEntry } from "astro:content";
import IconArrowLeft from "@/assets/icons/IconArrowLeft.svg";
import IconArrowRight from "@/assets/icons/IconArrowRight.svg";
import RelatedBox from "./RelatedBox.astro";
import type { SeriesId } from "@/series";
import { getPostUrl } from "@/utils/getPostPaths";
import { getSeriesPosition } from "@/utils/getSeriesPosts";
import { useTranslations, tplStr } from "@/i18n";
import config from "@/config";

type Props = {
  seriesId: SeriesId;
  /** 편 순서로 정렬되고 중복 검증까지 끝난 시리즈 전체 글. */
  posts: CollectionEntry<"posts">[];
  currentOrder: number;
};

const { seriesId, posts, currentOrder } = Astro.props;
const locale = Astro.currentLocale ?? config.site.lang;
const t = useTranslations(locale);

// current가 null이면(현재 글이 목록에 없으면) prev/next도 둘 다 null이 되어
// 아래 이동 줄이 통째로 사라진다. total은 그 경우에도 옳은 값이라 그대로 쓴다.
const { total, prev, next } = getSeriesPosition(posts, seriesId, currentOrder);
---

{
  posts.length > 0 && (
    <RelatedBox title={t.series.inThisSeries}>
      <span slot="title-aside" class="shrink-0 font-normal">
        {tplStr(t.category.seriesCount, { count: total })}
      </span>

      <ol class="flex flex-col gap-y-2">
        {posts.map(p => (
          <li class="flex items-baseline gap-2 text-sm">
            <span class="w-4 shrink-0 text-end tabular-nums opacity-60">
              {p.data.seriesOrder}
            </span>
            {p.data.seriesOrder === currentOrder ? (
              <span class="text-foreground font-bold">{p.data.title}</span>
            ) : (
              <a
                href={getPostUrl(p.id, p.filePath, locale)}
                class="underline-offset-4 hover:underline"
              >
                {p.data.title}
              </a>
            )}
          </li>
        ))}
      </ol>

      {(prev || next) && (
        <div class="border-border mt-4 flex items-center justify-between gap-3 border-t border-dashed pt-3 text-sm">
          {prev ? (
            <a
              href={getPostUrl(prev.id, prev.filePath, locale)}
              class="flex items-center gap-1 underline-offset-4 hover:underline"
            >
              <IconArrowLeft class="size-4 shrink-0 rtl:rotate-180" />
              <span>{t.series.prevPart}</span>
            </a>
          ) : (
            <span />
          )}
          {next && (
            <a
              href={getPostUrl(next.id, next.filePath, locale)}
              class="flex items-center gap-1 underline-offset-4 hover:underline"
            >
              <span>{t.series.nextPart}</span>
              <IconArrowRight class="size-4 shrink-0 rtl:rotate-180" />
            </a>
          )}
        </div>
      )}
    </RelatedBox>
  )
}
```

`prev`가 없을 때 빈 `<span />`을 두는 이유: `justify-between`에서 `next`를 오른쪽 끝에 붙이기 위해서다. `AdjacentPostNav`가 쓰던 것과 같은 방식이다.

- [ ] **Step 5: 옛 시리즈 컴포넌트를 지운다**

```bash
git rm src/components/series/SeriesBox.astro src/components/series/SeriesNav.astro
```

- [ ] **Step 6: 글 페이지 import를 고친다**

`src/pages/posts/[...slug]/index.astro`에서 이 두 줄을

```astro
import SeriesBox from "@/components/series/SeriesBox.astro";
import SeriesNav from "@/components/series/SeriesNav.astro";
```

이렇게 바꾼다.

```astro
import SeriesBadge from "@/components/series/SeriesBadge.astro";
import SeriesPosts from "@/components/related/SeriesPosts.astro";
```

- [ ] **Step 7: 상단 배지를 렌더한다**

날짜/수정 링크가 들어 있는 `<div class="my-2 flex items-center gap-2">...</div>` 블록 **바로 아래**에 넣는다.

```astro
    {
      seriesId && seriesPosition && (
        <SeriesBadge
          seriesId={seriesId}
          current={seriesPosition.current}
          total={seriesPosition.total}
        />
      )
    }
```

- [ ] **Step 8: 본문 위 옛 상자를 걷어낸다**

`<article ...>` 안의 이 블록을 삭제한다. `<Content />`만 남는다.

```astro
      {
        seriesId && seriesOrder && (
          <SeriesBox
            seriesId={seriesId}
            posts={seriesPosts}
            currentOrder={seriesOrder}
          />
        )
      }
```

- [ ] **Step 9: 하단 상자를 하나로 합친다**

지금 이 줄이 있다.

```astro
    <CategoryPosts posts={nearbyCategoryPosts} label={categoryLabel} />
```

이렇게 바꾼다 — 시리즈 글이면 시리즈 상자, 아니면 카테고리 상자. 둘이 같이 나오지 않는다.

```astro
    {
      seriesId && seriesOrder ? (
        <SeriesPosts
          seriesId={seriesId}
          posts={seriesPosts}
          currentOrder={seriesOrder}
        />
      ) : (
        <CategoryPosts posts={nearbyCategoryPosts} label={categoryLabel} />
      )
    }
```

- [ ] **Step 10: 본문 아래 남은 잔해를 걷어낸다**

`<ShareLinks />` 아래에 이런 블록이 남아 있다. **통째로 삭제한다** — 두 번째 `hr`과 `SeriesNav` 블록 둘 다.

```astro
    <hr class="my-8 border-dashed" />

    {
      seriesPosition && (
        <SeriesNav prev={seriesPosition.prev} next={seriesPosition.next} />
      )
    }
```

`</main>` 바로 앞이 `<ShareLinks />`가 되어야 한다.

- [ ] **Step 11: `[CUSTOM]` 병합 안내 주석을 현재 상태에 맞춘다**

파일 상단 주석이 `SeriesBox`, `SeriesNav`를 이름으로 들고 있다. 지금 실제로 있는 것으로 고친다 — 커스텀 import는 `SeriesBadge`, `SeriesPosts`, `FloatingToc`, `CategoryPosts`, `getNearbyCategoryPosts`, `CATEGORIES`/`getSubcategoryLabel`이고, 렌더 지점은 `<FloatingToc>`, `<SeriesBadge>`, 하단 상자 분기다. 삭제한 업스트림 요소가 이제 둘(`<BackToTopButton />`, `<AdjacentPostNav />`)이라는 것도 함께 적는다. 병합할 사람이 이 주석만 보고 되살리면 안 되는 것을 알 수 있어야 한다.

- [ ] **Step 12: 남은 참조가 없는지 확인**

Run: `git grep -n "SeriesBox\|SeriesNav\|series\.part" -- src/ ':!src/content'`
Expected: 아무것도 안 나옴. `src/content/` 안의 글 본문에 `SeriesBox`가 예시 코드로 등장하는데 그건 블로그 글 텍스트이니 **그대로 둔다**

Run: `corepack pnpm exec astro check`
Expected: 0 errors — `series.part`를 지웠으므로 남은 사용처가 있으면 여기서 잡힌다

- [ ] **Step 13: 빌드하고 결과를 확인한다**

Run: `corepack pnpm build`
Expected: 0 errors

Run: `sed -n '/이 시리즈의 글/,/<\/aside>/p' dist/posts/building-this-blog/03-sidebar-shell/index.html | grep -oE '(이 시리즈의 글|[0-9]+편|이전 편|다음 편)'`
Expected: `이 시리즈의 글`, `7편`, `이전 편`, `다음 편` 이 모두 나온다

Run: `grep -c "카테고리의 다른 글" dist/posts/building-this-blog/03-sidebar-shell/index.html`
Expected: `0` — 시리즈 글에는 카테고리 상자가 없다

Run: `grep -c "카테고리의 다른 글" dist/posts/unity-render-pipeline/01-what-srp-replaces/index.html`
Expected: `1` — 낱개 글에는 카테고리 상자가 그대로 있다

Run: `grep -o '[0-9]/[0-9]편' dist/posts/building-this-blog/03-sidebar-shell/index.html | head -1`
Expected: `3/7편`

- [ ] **Step 14: 전체 테스트**

Run: `corepack pnpm test`
Expected: 전부 통과

Run: `corepack pnpm lint`
Expected: 출력 없음

- [ ] **Step 15: 포맷하고 커밋**

```bash
corepack pnpm exec prettier --write src/components/series/SeriesBadge.astro src/components/related/SeriesPosts.astro src/i18n/types.ts src/i18n/lang/ko.ts src/i18n/lang/en.ts "src/pages/posts/[...slug]/index.astro"
git status --short
git add src/components/series src/components/related src/i18n "src/pages/posts/[...slug]/index.astro"
git commit -m "feat(series): 시리즈 UI를 상단 배지와 하단 상자로 분리

옛 상자는 본문 위에서 목록을 접어두고 있어서, 클릭 전엔 위치 표시로도
부족하고 다 읽고 나면 화면 밖이라 이동 수단으로도 부족했다.

위치 표시는 본문 위 한 줄 배지로, 목록과 이전/다음 편은 본문 아래 상자로
나눴다. 이전/다음 편은 목록과 같은 상자에 둔다 — 둘 다 연재 내부 이동이라
떨어뜨리면 사이에 태그·공유가 끼어 관계가 끊긴다.

시리즈 글에는 카테고리 상자를 렌더하지 않는다. 본문 끝 상자는 항상 하나다."
```

---

### Task 4: 사이드바가 글 페이지에서 현재 위치를 유지

**Files:**
- Create: `src/utils/resolveActiveTaxonomy.ts`
- Test: `tests/resolveActiveTaxonomy.test.ts`
- Modify: `src/components/layout/Sidebar.astro`
- Modify: `src/components/layout/SidebarNav.astro`

**Interfaces:**
- Consumes: 없음
- Produces:
  ```ts
  export type ActiveTaxonomy = {
    category: CategoryId;
    subcategory?: string;
    /** "page" = 사이드바의 그 항목이 지금 보는 페이지. "section" = 지금 속한 섹션. */
    kind: "page" | "section";
  } | null;

  export type TaxonomyLocation = {
    url: string;
    category: CategoryId;
    subcategory?: string;
  };

  export function resolveActiveTaxonomy(
    segments: string[],
    currentPath: string,
    posts: TaxonomyLocation[]
  ): ActiveTaxonomy;
  ```

**문제:** `SidebarNav.astro`가 `Astro.url.pathname`만 보고 현재 위치를 판단한다. `/categories/...`일 때만 알고, `/posts/...`면 `undefined`가 되어 아코디언이 닫히고 강조가 사라진다.

**해결:** 판정을 순수 함수로 빼고(테스트 가능), `Sidebar.astro`가 호출해 `SidebarNav`에 내려준다. `Sidebar`는 카운트 계산 때문에 이미 전체 글을 불러오고 있으므로 추가 조회가 없다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`tests/resolveActiveTaxonomy.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  resolveActiveTaxonomy,
  type TaxonomyLocation,
} from "@/utils/resolveActiveTaxonomy";

const posts: TaxonomyLocation[] = [
  {
    url: "/posts/unity-render-pipeline/01-what-srp-replaces/",
    category: "deep-dive",
    subcategory: "rendering",
  },
  { url: "/posts/digitaltwin/05-culling/", category: "project" },
];

describe("resolveActiveTaxonomy — 분류 페이지", () => {
  it("대분류 페이지는 page 종류로 대분류를 돌려준다", () => {
    expect(
      resolveActiveTaxonomy(["categories", "deep-dive"], "/categories/deep-dive/", posts)
    ).toEqual({ category: "deep-dive", subcategory: undefined, kind: "page" });
  });

  it("소분류 페이지는 소분류까지 돌려준다", () => {
    expect(
      resolveActiveTaxonomy(
        ["categories", "deep-dive", "rendering"],
        "/categories/deep-dive/rendering/",
        posts
      )
    ).toEqual({ category: "deep-dive", subcategory: "rendering", kind: "page" });
  });

  it("정의에 없는 대분류 slug면 null", () => {
    expect(
      resolveActiveTaxonomy(["categories", "nope"], "/categories/nope/", posts)
    ).toBeNull();
  });
});

describe("resolveActiveTaxonomy — 글 페이지", () => {
  it("글 페이지는 section 종류로 그 글의 분류를 돌려준다", () => {
    expect(
      resolveActiveTaxonomy(
        ["posts", "unity-render-pipeline", "01-what-srp-replaces"],
        "/posts/unity-render-pipeline/01-what-srp-replaces/",
        posts
      )
    ).toEqual({
      category: "deep-dive",
      subcategory: "rendering",
      kind: "section",
    });
  });

  it("소분류가 없는 글은 대분류만 돌려준다", () => {
    expect(
      resolveActiveTaxonomy(
        ["posts", "digitaltwin", "05-culling"],
        "/posts/digitaltwin/05-culling/",
        posts
      )
    ).toEqual({ category: "project", subcategory: undefined, kind: "section" });
  });

  it("끝 슬래시가 달라도 같은 글로 본다", () => {
    expect(
      resolveActiveTaxonomy(
        ["posts", "digitaltwin", "05-culling"],
        "/posts/digitaltwin/05-culling",
        posts
      )
    ).toEqual({ category: "project", subcategory: undefined, kind: "section" });
  });

  it("목록에 없는 글 경로면 null", () => {
    expect(
      resolveActiveTaxonomy(["posts", "ghost"], "/posts/ghost/", posts)
    ).toBeNull();
  });

  it("글 목록 페이지(/posts/)면 null", () => {
    expect(resolveActiveTaxonomy(["posts"], "/posts/", posts)).toBeNull();
  });
});

describe("resolveActiveTaxonomy — 그 밖의 페이지", () => {
  it("태그 페이지면 null", () => {
    expect(resolveActiveTaxonomy(["tags"], "/tags/", posts)).toBeNull();
  });

  it("홈이면 null", () => {
    expect(resolveActiveTaxonomy([], "/", posts)).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `corepack pnpm exec vitest run tests/resolveActiveTaxonomy.test.ts`
Expected: FAIL — `@/utils/resolveActiveTaxonomy` 를 찾을 수 없다는 import 오류

- [ ] **Step 3: 유틸을 구현한다**

`src/utils/resolveActiveTaxonomy.ts`:

```ts
import { CATEGORY_IDS, type CategoryId } from "@/categories";

/** 사이드바가 강조할 위치. */
export type ActiveTaxonomy = {
  category: CategoryId;
  subcategory?: string;
  /**
   * "page"  — 사이드바의 그 항목이 지금 보는 페이지 자체 (분류 페이지)
   * "section" — 지금 속한 섹션일 뿐 (글 페이지). aria-current를 붙이지 않는다.
   */
  kind: "page" | "section";
} | null;

/** 글 하나의 위치 정보. 호출부가 getPostUrl()로 url을 채워 넘긴다. */
export type TaxonomyLocation = {
  url: string;
  category: CategoryId;
  subcategory?: string;
};

const stripTrailingSlash = (path: string) => path.replace(/\/+$/, "");

function isCategoryId(value: string | undefined): value is CategoryId {
  return value !== undefined && (CATEGORY_IDS as readonly string[]).includes(value);
}

/**
 * "지금 어디 있는가"를 한 곳에서 판정한다.
 *
 * 분류 페이지는 경로에서 바로 읽는다. 글 페이지는 경로만으로는 분류를 알 수
 * 없으므로 글 목록과 대조한다 — 글 URL이 분류를 담지 않기 때문이다.
 */
export function resolveActiveTaxonomy(
  segments: string[],
  currentPath: string,
  posts: TaxonomyLocation[]
): ActiveTaxonomy {
  if (segments[0] === "categories") {
    const category = segments[1];
    if (!isCategoryId(category)) return null;
    return { category, subcategory: segments[2], kind: "page" };
  }

  if (segments[0] === "posts") {
    const target = stripTrailingSlash(currentPath);
    const post = posts.find(p => stripTrailingSlash(p.url) === target);
    if (!post) return null;
    return {
      category: post.category,
      subcategory: post.subcategory,
      kind: "section",
    };
  }

  return null;
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

Run: `corepack pnpm exec vitest run tests/resolveActiveTaxonomy.test.ts`
Expected: PASS — 10개 통과

- [ ] **Step 5: `SidebarNav`를 props를 받도록 바꾼다**

`src/components/layout/SidebarNav.astro`의 frontmatter에서 `getPathSegments` import와 `segments`/`activeCategory`/`activeSubcategory` 계산 세 줄을 걷어내고 props로 받는다. 바꾼 뒤 frontmatter:

```astro
---
import { getRelativeLocaleUrl } from "astro:i18n";
import {
  CATEGORIES,
  CATEGORY_IDS,
  getSubcategoryIds,
  getSubcategoryLabel,
  hasSubcategories,
  type CategoryId,
} from "@/categories";
import type { CategoryCounts } from "@/utils/getCategoryCounts";
import { useTranslations } from "@/i18n";
import config from "@/config";

type Props = {
  counts: CategoryCounts;
  /** 지금 위치. Sidebar가 resolveActiveTaxonomy()로 판정해 넘긴다. */
  activeCategory?: CategoryId;
  activeSubcategory?: string;
  /** "page"일 때만 aria-current를 붙인다. */
  activeKind: "page" | "section";
  /** "분류 전체보기"를 강조할지. Sidebar가 판정해 넘긴다. */
  postsActive: boolean;
};

const {
  counts,
  activeCategory,
  activeSubcategory,
  activeKind,
  postsActive,
} = Astro.props;

const locale = Astro.currentLocale ?? config.site.lang;
const t = useTranslations(locale);

// 글 페이지에서는 사이드바의 강조 항목이 "지금 보는 페이지"가 아니라
// "지금 속한 섹션"이다. 화면 강조는 같게 하되 스크린 리더에는 알리지 않는다.
const ariaCurrent = activeKind === "page" ? "page" : undefined;

const postsHref = getRelativeLocaleUrl(locale, "posts");
---
```

`postsActive`도 props로 받는 이유: 이 값은 경로 판정이라 `SidebarNav` 안에서 계산하면 "위치 판정은 `Sidebar` 한 곳에서"라는 이 태스크의 목적이 반쯤 무너진다.

- [ ] **Step 6: `SidebarNav` 본문에서 `aria-current`를 새 변수로 바꾼다**

세 군데에 `aria-current`가 있다. 각각 이렇게 바꾼다.

"분류 전체보기" 링크:

```astro
    aria-current={postsActive ? "page" : undefined}
```

소분류 없는 대분류 링크와 소분류가 있는 대분류 링크 — 두 곳 모두:

```astro
                aria-current={catActive ? ariaCurrent : undefined}
```

소분류 링크:

```astro
                          aria-current={subActive ? ariaCurrent : undefined}
```

`catActive`와 `subActive`의 계산식(`activeCategory === id && !activeSubcategory` 등)과 `is-active` 클래스, `open` 계산은 **그대로 둔다.** props로 값이 들어오는 것만 달라졌다.

- [ ] **Step 7: `Sidebar`가 위치를 판정해 내려준다**

`src/components/layout/Sidebar.astro`의 frontmatter에 import를 추가한다.

```astro
import { getPostUrl } from "@/utils/getPostPaths";
import { resolveActiveTaxonomy } from "@/utils/resolveActiveTaxonomy";
```

그리고 `const counts = getCategoryCounts(allPosts);` 아래에 판정을 넣는다.

```astro
const segments = getPathSegments(Astro.url.pathname, locale);

// 글 페이지는 URL만으로 분류를 알 수 없어 글 목록과 대조한다.
// allPosts는 위에서 카운트 계산용으로 이미 불러온 것이라 추가 조회가 없다.
const active = resolveActiveTaxonomy(
  segments,
  Astro.url.pathname,
  allPosts.map(p => ({
    url: getPostUrl(p.id, p.filePath, locale),
    category: p.data.category,
    subcategory: p.data.subcategory,
  }))
);

// "분류 전체보기"는 글 목록 페이지에서만 강조한다. 개별 글에서는 그 글의
// 분류가 강조되므로 둘이 함께 켜지면 안 된다.
const postsActive = segments[0] === "posts" && active === null;
```

기존 `const activeSegment = getPathSegments(Astro.url.pathname, locale)[0];` 줄은
`const activeSegment = segments[0];` 로 바꾼다. 같은 함수를 두 번 부르지 않는다.
`activeSegment`는 유틸 링크(태그·아카이브 등) 강조에 계속 쓰이므로 **지우지 않는다.**

- [ ] **Step 8: `SidebarNav` 호출에 props를 넘긴다**

`Sidebar.astro` 본문의 이 줄을

```astro
    <SidebarNav counts={counts} />
```

이렇게 바꾼다.

```astro
    <SidebarNav
      counts={counts}
      activeCategory={active?.category}
      activeSubcategory={active?.subcategory}
      activeKind={active?.kind ?? "page"}
      postsActive={postsActive}
    />
```

`active`가 `null`이면 강조할 항목 자체가 없으므로 `activeKind` 값은 쓰이지 않는다. 기본값으로 `"page"`를 준다.

- [ ] **Step 9: 타입 검사와 테스트**

Run: `corepack pnpm exec astro check`
Expected: 0 errors

Run: `corepack pnpm build`
Expected: 0 errors

Run: `corepack pnpm test`
Expected: 전부 통과

Run: `corepack pnpm lint`
Expected: 출력 없음

- [ ] **Step 10: 빌드 결과에서 동작을 확인한다**

Run: `grep -o 'class="[^"]*cat-row[^"]*"' dist/posts/unity-render-pipeline/01-what-srp-replaces/index.html | head -6`
Expected: `deep-dive` 줄에 해당하는 항목이 나온다

Run: `grep -c 'class="[^"]*open[^"]*"' dist/posts/unity-render-pipeline/01-what-srp-replaces/index.html`
Expected: `1` 이상 — 글 페이지에서 아코디언이 펼쳐진 채로 렌더된다

Run: `grep -o 'sub-link is-active' dist/posts/unity-render-pipeline/01-what-srp-replaces/index.html`
Expected: 한 건 나온다 — Rendering 소분류가 강조된다

Run: `sed -n 's/.*\(sub-link is-active[^>]*\).*/\1/p' dist/posts/unity-render-pipeline/01-what-srp-replaces/index.html`
Expected: 그 요소에 `aria-current`가 **없다**

Run: `grep -o 'sub-link is-active[^>]*aria-current="page"' dist/categories/deep-dive/rendering/index.html`
Expected: 한 건 나온다 — 분류 페이지에서는 `aria-current="page"`가 그대로 붙는다

- [ ] **Step 11: 포맷하고 커밋**

```bash
corepack pnpm exec prettier --write src/utils/resolveActiveTaxonomy.ts tests/resolveActiveTaxonomy.test.ts src/components/layout/Sidebar.astro src/components/layout/SidebarNav.astro
git status --short
git add src/utils/resolveActiveTaxonomy.ts tests/resolveActiveTaxonomy.test.ts src/components/layout/Sidebar.astro src/components/layout/SidebarNav.astro
git commit -m "feat(sidebar): 글 페이지에서도 현재 분류를 펼치고 강조

SidebarNav가 URL 경로만 보고 위치를 판단해서, /posts/ 아래에서는 활성
분류를 알 수 없어 아코디언이 닫히고 강조가 사라졌다.

판정을 순수 함수로 빼고 Sidebar가 호출해 내려주도록 바꿨다. 글 페이지는
URL에 분류가 없으므로 이미 불러와 둔 글 목록과 대조해 알아낸다.

글 페이지의 강조에는 aria-current를 붙이지 않는다. 그 항목은 지금 보는
페이지가 아니라 지금 속한 섹션이다."
```

---

## 완료 확인

설계 문서 §10을 하나씩 확인한다.

- [ ] 시리즈 글 상단에 연재명과 편 위치가 한 줄로 보인다
- [ ] 시리즈 글 하단 상자에 전체 편이 나오고, 현재 편이 굵게 표시되며 링크가 아니다
- [ ] 그 상자 안 아래쪽에 이전/다음 편이 양끝으로 놓인다
- [ ] 시리즈 글에 카테고리 상자가 나오지 않는다
- [ ] 낱개 글 하단에는 카테고리 상자만 나온다
- [ ] 어느 글에도 "이전 글 / 다음 글"이 나오지 않는다
- [ ] 글 페이지에서 사이드바의 해당 대분류가 펼쳐져 있고 잎 항목이 강조된다
- [ ] 글 페이지 사이드바의 강조 항목에 `aria-current`가 없다
- [ ] 분류 페이지에서는 기존 강조·`aria-current` 동작이 그대로다
- [ ] 두 하단 상자가 같은 껍데기를 쓰고 `data-pagefind-ignore`가 붙는다
- [ ] `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`가 통과한다
