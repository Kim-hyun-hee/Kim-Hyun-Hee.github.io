# 글 하단 재구성 설계 — 태그 칩과 "카테고리의 다른 글"

작성일: 2026-08-07
선행 문서: `2026-08-06-blog-redesign-design.md`

## 1. 배경

리디자인의 큰 골격(사이드바, 목차, 카테고리 트리, 팔레트)은 끝났고 글 본문
**아래쪽**만 손대지 않은 채 남아 있다. 지금 이 영역은 업스트림 AstroPaper
기본형 그대로라 위쪽과 톤이 맞지 않는다.

두 가지를 고친다.

1. 태그가 점선 밑줄 링크로 나열돼 있다. 기존에 쓰던 블로그는 이 자리를 칩
   목록으로 처리했고, 그 쪽이 본문과 시각적으로 분리돼 읽기 편하다.
2. 글을 다 읽은 독자가 같은 주제의 다른 글로 넘어갈 통로가 시리즈와 이전/다음
   글밖에 없다. 시리즈에 안 묶인 글은 사실상 막다른 길이다.

덤으로, 본문 하단의 "맨 위로" 버튼이 우하단 플로팅 버튼과 기능이 겹친다.

## 2. 범위

**한다**

- 태그 칩 재디자인 (`Tag.astro`, 호출부 2곳)
- 본문 하단 "맨 위로" 버튼 제거
- "같은 카테고리의 다른 글" 블록 신설

**하지 않는다**

- 이전/다음 글을 화면 좌우 하단에 띄우는 플로팅 카드. 우하단 플로팅 버튼과
  자리가 겹치고, 본문을 읽는 내내 화면을 가린다. 보류한다.
- 본문 맨 아래 인라인 이전/다음 글(`AdjacentPostNav.astro`). 그대로 둔다.
- 글 하단 저자 프로필. 실명 노출 방침이 아직 안 정해졌다(별도 과제).

## 3. 최종 배치

`src/pages/posts/[...slug]/index.astro`의 `</article>` 이후:

```
────── hr ──────
EditPost              (모바일만)
카테고리의 다른 글      ← 신설. 기존 "맨 위로" 버튼이 있던 자리
태그 칩 목록           ← 재디자인
공유 링크
────── hr ──────
시리즈 이전/다음       (시리즈 글일 때만)
이전 글 / 다음 글      (변경 없음)
```

"카테고리의 다른 글"이 태그보다 위에 오는 이유: 다음 행동을 유도하는 블록이
메타데이터(태그)보다 먼저 눈에 들어와야 한다.

## 4. 태그 칩

### 4.1 색

기존 블로그의 칩은 hover 시 **라이트·다크 양쪽 모두** 어두운 먹색으로 바뀐다.
다크에서 밝게 반전되는 게 아니라 같은 방향으로 더 진해진다. 지금 팔레트의
`--foreground`/`--background`는 테마에 따라 뒤집히므로 이 동작을 표현할 수
없다.

`theme.css`에 테마 공통 토큰 두 개를 추가한다. 레이아웃 폭 토큰과 같은 방식으로
`:root` 한 곳에만 정의하고 `[data-theme="dark"]`에서 덮지 않는다.

```css
/* 태그 칩 hover — 라이트·다크 공통. 테마별 블록에서 덮지 않는다. */
:root {
  --tag-hover: #353638;
  --tag-hover-foreground: #f4f4f6;
}
```

`@theme inline`에 `--color-tag-hover`, `--color-tag-hover-foreground`를 등록해
`bg-tag-hover` / `text-tag-hover-foreground` 유틸리티로 쓴다.

두 값 모두 무채색이라 "UI에 유채색을 쓰지 않는다"는 기존 원칙과 충돌하지 않는다.

칩의 나머지 색은 기존 토큰으로 그대로 떨어진다:

| | 라이트 | 다크 | 사용 토큰 |
|---|---|---|---|
| 배경 | `#f1f3f7` | `#292a2d` | `bg-muted` |
| 글자 | `#66666e` | `#f4f4f6` | `text-muted-foreground dark:text-foreground` |
| hover 배경 | `#353638` | `#353638` | `bg-tag-hover` |
| hover 글자 | `#f4f4f6` | `#f4f4f6` | `text-tag-hover-foreground` |

### 4.2 `src/components/Tag.astro`

Props(`tag`, `tagName`, `size`)와 링크 대상은 그대로 두고 표현만 바꾼다.

- 제거: `border-b-2 border-dashed`, `hover:border-accent`, `hover:-mt-0.5`,
  `focus-visible:border-none`
- 추가: `rounded-md bg-muted px-4 py-2 transition-colors`
- `size="sm"`(글 하단) → `text-sm`. 기존 블로그 값과 동일하다.
- `size="lg"`(태그 목록 페이지) → `text-base`. 여백은 `sm`과 같게 둔다.
- `focus-visible:`는 hover와 같은 배경·글자색을 준다. 키보드 사용자가 마우스
  사용자와 같은 것을 보게 하고, 칩에서 의미를 잃은 기존 포커스 스타일을 대체한다.
- 아이콘을 `IconHash`(#)에서 `IconTag`로 교체하고 **칩마다** 넣는다. 아이콘과
  라벨 사이 간격 `gap-1.5`, 아이콘 크기 `size-4`.

`src/assets/icons/IconTag.svg`를 새로 추가한다. 기존 아이콘과 같은 Tabler
Icons(MIT)의 `tag`를 쓴다 — 저장소 안 다른 아이콘과 획 두께·박스가 일치한다.

### 4.3 호출부

칩은 밑줄 링크보다 폭이 넓으므로 간격을 줄인다.

- `src/pages/posts/[...slug]/index.astro` — `gap-4` → `gap-2`
- `src/pages/tags/index.astro` — `gap-6` → `gap-2`

### 4.4 "맨 위로" 버튼 제거

우하단 플로팅 버튼(`FloatingControls.astro`)이 같은 일을 한다.

- `index.astro`에서 `BackToTopButton` import와 사용처를 지운다
- `src/pages/posts/[...slug]/_components/BackToTopButton.astro`를 삭제한다
- i18n의 `post.backToTop`은 **남긴다.** `FloatingControls`가 계속 쓴다

이 컴포넌트가 그리던 원형 진행률 표시(conic-gradient)도 같이 사라지지만, 화면
상단의 진행 바(`index.astro`의 인라인 스크립트)가 그대로 남으므로 독자가 잃는
정보는 없다.

## 5. 카테고리의 다른 글

### 5.1 범위 결정

이 블로그는 대분류 + 소분류 2단계다. **소분류가 있으면 소분류 기준, 없으면
대분류 기준**으로 모은다.

- `deep-dive/rendering` 글 → Rendering 글들만
- `troubleshooting` 글 (소분류 없음) → Troubleshooting 글들

블록 제목의 카테고리 이름도 같은 기준을 따른다. 제목이 곧 범위 설명이 되므로
목록 각 항목에 소분류 뱃지를 달 필요가 없다.

### 5.2 `src/utils/getNearbyCategoryPosts.ts` (신규)

```ts
getNearbyCategoryPosts(
  posts: CollectionEntry<"posts">[],
  current: CollectionEntry<"posts">,
  limit = 5
): CollectionEntry<"posts">[]
```

1. `getSortedPosts(posts)`로 초안·예약글을 거르고 최신순 정렬한다. 사이트의
   다른 목록과 같은 정렬 기준(`modDatetime ?? pubDatetime` 내림차순)을 쓴다.
2. `current.data.subcategory`가 있으면 `filterBySubcategory`, 없으면
   `filterByCategory`로 범위를 좁힌다(`getPostsByCategory.ts` 재사용).
3. 좁힌 목록에서 `current`의 위치를 찾아 **현재 글을 가운데 둔 창**을 잡고,
   현재 글을 뺀 최대 `limit`개를 돌려준다. 창이 목록 경계를 넘으면 남는 쪽으로
   밀어 개수를 채운다 — 가장 최근 글이나 가장 오래된 글에서도 목록이 짧아지지
   않는다.
4. 다음 경우 빈 배열을 돌려준다:
   - 범위 안에 현재 글 말고 다른 글이 없을 때
   - `current`가 좁힌 목록에 없을 때. 페이지가 빌드됐다면 보통 목록에도
     들어 있지만, 주변을 정의할 수 없는 상태이므로 억지로 채우지 않고
     방어적으로 비운다.

### 5.3 `tests/getNearbyCategoryPosts.test.ts` (신규)

기존 `tests/getPostsByCategory.test.ts`의 픽스처 방식을 따른다. 덮을 경우:

- 목록 가운데 글 → 앞뒤가 섞여 `limit`개
- 목록 맨 앞(최신) 글 → 뒤쪽으로만 `limit`개
- 목록 맨 뒤(가장 오래된) 글 → 앞쪽으로만 `limit`개
- 범위 안에 글이 `limit`개보다 적을 때 → 있는 만큼만, 현재 글 제외
- 범위 안에 현재 글뿐일 때 → 빈 배열
- 소분류가 있는 글 → 같은 대분류의 **다른** 소분류 글이 섞이지 않음
- 소분류가 없는 글 → 대분류 기준으로 모임
- `current`가 목록에 없을 때 → 빈 배열

### 5.4 `src/components/category/OtherPosts.astro` (신규)

업스트림 파일과 섞이지 않도록 `_components/`가 아니라 `src/components/` 아래
새 폴더에 둔다. `series/`, `toc/`, `layout/`과 같은 방식이다.

Props: `posts`(위 유틸의 결과), `label`(범위 이름).
`posts.length === 0`이면 아무것도 렌더하지 않는다 — 호출부에 조건문을 두지 않고
컴포넌트가 스스로 판단한다.

```
┌─ bg-muted rounded-md p-5 ──────────────────┐
│ 'Rendering' 카테고리의 다른 글         ☰   │  font-bold, text-sm, 아래 border
│ ───────────────────────────────────────────│
│  리플로우와 리페인트                    →  │  text-sm, 한 줄 말줄임
│  페인트 비용                            →  │
│  CSSOM 구성                             →  │
└─────────────────────────────────────────────┘
```

- 컨테이너 `bg-muted rounded-md p-5`, 글자 `text-muted-foreground
  dark:text-foreground` (태그 칩과 같은 조합)
- 제목 줄 `flex items-center justify-between border-b border-border pb-2 mb-4
  text-sm font-bold`, 오른쪽 끝에 `IconMenuDeep`(장식, `aria-hidden`)
- 목록 `flex flex-col gap-y-2`, 각 항목은 링크 전체가 `flex items-center
  justify-between text-sm`이고 오른쪽 끝에 `IconArrowRight`
- 제목이 길면 한 줄로 자른다(`truncate`)
- 링크 주소는 `getPostUrl(post.id, post.filePath, locale)`
- `data-pagefind-ignore` — 검색 인덱스에 다른 글 제목이 섞이지 않게 한다.
  `AdjacentPostNav.astro`가 같은 처리를 하고 있다
- 아이콘은 기존 자산을 재사용하므로 새로 받을 것이 없다

### 5.5 i18n

`src/i18n/types.ts`의 `category`에 `otherPosts: string`을 추가하고 두 언어에
문자열을 넣는다. 기존 `series.part`처럼 `tplStr`로 치환한다.

- ko — `"'{{label}}' 카테고리의 다른 글"`
- en — `"More in '{{label}}'"`

### 5.6 호출부

`src/pages/posts/[...slug]/index.astro`:

- 이미 `getCollection("posts")`를 시리즈 계산에 쓰고 있다. 같은 결과를 변수로
  묶어 재사용하고 컬렉션을 두 번 읽지 않는다.
- 범위 라벨은 `getSubcategoryLabel` / `CATEGORIES[id].label`로 구한다
  (`src/categories.ts`).
- `EditPost`(모바일)와 태그 목록 사이에 렌더한다.

시리즈 글에서도 그대로 보여준다. 시리즈 상자는 본문 위, 이 블록은 본문 아래라
시각적으로 부딪히지 않고, 시리즈와 카테고리는 서로 다른 축이라 담기는 글도 다르다.

## 6. 완료 기준

- 글 하단 태그가 칩으로 보이고, hover 시 라이트·다크 모두 먹색으로 바뀐다
- 태그 목록 페이지(`/tags`)의 태그도 같은 칩으로 보인다
- 본문 하단에 "맨 위로" 버튼이 없고, 우하단 플로팅 버튼은 그대로 동작한다
- 소분류가 있는 글에서 같은 소분류 글만 최대 5개 뜬다
- 소분류가 없는 글에서 같은 대분류 글이 최대 5개 뜬다
- 카테고리에 글이 하나뿐이면 블록이 아예 렌더되지 않는다
- `pnpm test`, `pnpm build`, `pnpm lint`가 모두 통과한다
