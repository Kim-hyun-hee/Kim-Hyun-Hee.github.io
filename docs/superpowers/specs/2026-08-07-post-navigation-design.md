# 글 간 이동 구조 재설계

작성일: 2026-08-07
선행 문서: `2026-08-07-post-footer-design.md`

## 1. 배경

글 하단에 "다음에 뭘 읽지"에 답하는 블록이 세 개 있다.

| 블록 | 답 |
|---|---|
| 카테고리의 다른 글 | 같은 분류의 이웃 |
| 시리즈 이전/다음 편 | 연재 안의 앞뒤 |
| 이전 글 / 다음 글 | 블로그 전체에서 시간순 앞뒤 |

셋 다 같은 질문에 서로 다른 답을 내놓는다. 선택지가 셋이면 독자는 아무것도
고르지 않는다. "심플하고 직관적"이라는 목표와 정면으로 부딪힌다.

그리고 개별적으로도 문제가 있다.

**시간순 이웃은 관계가 아니다.** 3월에 쓴 렌더링 글의 다음 글이 4월에 쓴
회고라면 이동할 이유가 없다. "글 사이 관계성이 보여야 한다"는 목표를 유일하게
거스르는 블록이다.

**시리즈 상자가 어중간하다.** 본문 위에 있으면서 목록을 접어두고 있다.
클릭 전에는 아무것도 안 보이니 위치 표시로도 부족하고, 글을 다 읽고 나면
화면 위로 사라져 있으니 이동 수단으로도 부족하다.

**사이드바가 글 페이지에서 위치를 잃는다.** 분류를 눌러 들어가 글을 열면
아코디언이 닫히고 강조도 사라진다. 지금 어디 있는지 알 수 없다.

## 2. 목표

이 블로그 UI의 목표를 그대로 옮긴다 — 심플하고, 직관적이고, 시인성이 좋을 것.
글 사이 관계가 보이고, 이동이 편하고, 지금 위치를 알기 쉬울 것.

## 3. 원칙

**본문 끝 같은 자리에 "다음에 읽을 것" 상자를 하나만 둔다.** 글 성격에 따라
내용만 갈린다.

- 시리즈 글 → 이 시리즈의 글
- 낱개 글 → 같은 분류의 다른 글

두 상자는 같은 껍데기(배경·모서리·제목 줄)를 쓴다. 독자는 "본문 끝 회색 상자가
다음에 읽을 것"이라는 규칙 하나만 익히면 된다.

## 4. 화면

```
시리즈 글                                낱개 글
──────────────────────────────          ──────────────────────────
이 블로그를 만든 기록 · 3/7편              (없음)

        [ 본 문 ]                             [ 본 문 ]

┌────────────────────────────┐          ┌────────────────────────────┐
│ 이 시리즈의 글         7편 │          │ 'Rendering' 카테고리의     │
│ ──────────────────────────│          │  다른 글              ☰   │
│   1  블로그를 새로 짓기로… │          │ ──────────────────────────│
│   2  카테고리와 시리즈를…  │          │  SRP는 무엇을 대신하는가 → │
│ ▸ 3  좌측 고정 사이드바    │          │  SRP Batcher가 빠른 이유 → │
│   4  목차: 인라인에서…     │          └────────────────────────────┘
│   5  색을 쓰지 않는…       │
│   6  원본 테마와 계속…     │
│   7  글 하단 재구성        │
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │
│  ← 2편            4편 →   │
└────────────────────────────┘

태그 / 공유                              태그 / 공유
```

### 4.1 상단 한 줄 (시리즈 글만)

`이 블로그를 만든 기록 · 3/7편`. 연재명은 시리즈 페이지로 가는 링크,
편수는 위치 표시. 접히지 않고 목록도 없다.

이걸 남기는 이유는 하나다 — 검색으로 5편에 처음 들어온 사람이 이 글이 연재
중간이라는 걸 **다 읽기 전에** 알아야 한다. 그게 "지금 어디 있는지"의 일부다.

### 4.2 하단 시리즈 상자

**전체 편을 다 보여준다.** 10편이면 10줄이다. 연재 지도가 통째로 보이는 쪽이
관계성을 가장 잘 드러내고, 목록 자체가 위치 표시 역할까지 겸한다.

- 각 줄은 `편 번호 + 제목`
- 현재 편은 굵게 + 앞에 표식, 링크가 아니다
- 목록 아래 점선 구분, 그 아래 양끝에 `← n편` / `n편 →`

이전/다음 편이 상자 **안**에 있는 이유: 목록과 이전/다음은 둘 다 연재 내부
이동이라 같은 축이다. 떼어 놓으면 사이에 태그·공유가 끼어 관계가 끊긴다.
현재 편이 강조된 목록에서 바로 위아래 줄이 곧 이전/다음 편이므로, 버튼이
목록과 같은 상자에 있어야 그 대응이 눈에 보인다.

### 4.3 하단 카테고리 상자

기존 동작 그대로다 (`2026-08-07-post-footer-design.md` §5). 소분류 우선 범위,
현재 글 앞뒤로 최대 4개, 같은 연재 제외.

**시리즈 글에서는 렌더하지 않는다.** 마지막 편을 읽고 나면 이 상자에 "다음"이
없어지지만, 그때 탈출구는 사이드바와 시리즈 목록이다. 조건을 하나 더 만들어
마지막 편에서만 카테고리 상자를 되살리는 것은 하지 않는다 — 규칙이 둘이 되면
"본문 끝 상자 하나"라는 원칙이 깨진다.

## 5. 컴포넌트 구성

`SeriesBox`가 위치 표시와 목록 두 가지를 겸해서 둘 다 어중간했다. 역할대로
쪼갠다.

| 파일 | 처리 |
|---|---|
| `components/series/SeriesBox.astro` | 삭제 — 아래 둘로 분리 |
| `components/series/SeriesBadge.astro` | 신규 — 본문 위 한 줄 |
| `components/related/RelatedBox.astro` | 신규 — 하단 상자 껍데기 |
| `components/related/SeriesPosts.astro` | 신규 — 시리즈 목록 + 이전/다음 편 |
| `components/related/CategoryPosts.astro` | `category/OtherPosts.astro`에서 이동 |
| `components/series/SeriesNav.astro` | 삭제 — `SeriesPosts`에 흡수 |
| `pages/posts/[...slug]/_components/AdjacentPostNav.astro` | 삭제 |
| `components/category/` | 빈 폴더가 되므로 삭제 |

`related/`에 하단 상자 셋(껍데기 + 내용물 둘)이 모인다. 껍데기를 공유하므로
상자 디자인을 바꿀 때 고칠 곳이 한 군데다.

### 5.1 `RelatedBox.astro`

Props: `title`(문자열), `titleAside`(선택 슬롯 — 우측 아이콘이나 편수),
기본 슬롯(내용).

껍데기는 지금 `OtherPosts.astro`가 쓰는 것을 그대로 옮긴다:
`bg-muted text-muted-foreground dark:text-foreground mt-4 mb-2 rounded-md p-5`,
제목 줄은 `border-b border-border pb-2 mb-4 text-sm font-bold`.

`data-pagefind-ignore`를 여기에 단다. 두 상자 모두 다른 글 제목을 담으므로
껍데기가 책임지는 게 맞다 — 내용물마다 잊지 않고 붙일 필요가 없어진다.

### 5.2 `SeriesPosts.astro`

Props: `posts`(편 순서로 정렬된 목록), `seriesId`, `currentOrder`.

`RelatedBox`를 쓰고, `titleAside`에 총 편수를 넣는다. 목록과 이전/다음 편을
그린다. 이전/다음은 `getSeriesPosition()`이 이미 계산해 주므로 그대로 쓴다.

현재 편이 목록에 없으면(`getSeriesPosition`의 `current`가 `null`) 이전/다음이
자동으로 생략된다 — `getSeriesPosition`이 그 경우 `prev`/`next`를 항상 `null`로
돌려주기 때문이다. 총 편수는 그 경우에도 옳은 값이므로 그대로 보여준다.
위치를 감추는 쪽은 상단 배지가 맡는다(§5.3).

### 5.3 `SeriesBadge.astro`

Props: `seriesId`, `current`(number | null), `total`.

한 줄짜리 `<p>`. 연재명은 `/series/{id}`로 링크, 그 뒤에 `·`와 `n/m편`.
`current`가 `null`이면 편 위치를 생략하고 연재명만 보여준다.

크기는 `text-sm`, 색은 `text-muted-foreground`. 본문 제목 위 메타 정보
(날짜 줄)와 같은 위계로 둔다.

### 5.4 `CategoryPosts.astro`

`OtherPosts.astro`를 옮기고 `RelatedBox`를 쓰도록 고친다. 목록 항목 렌더링과
빈 배열 처리는 그대로다.

## 6. 사이드바 현재 위치

### 6.1 문제

`SidebarNav.astro`가 `Astro.url.pathname`만 보고 현재 위치를 판단한다.

```ts
activeCategory = segments[0] === "categories" ? segments[1] : undefined;
```

`/categories/...`일 때만 안다. `/posts/...`면 `undefined`가 되어 아코디언이
닫히고 강조가 사라진다.

### 6.2 해결

**"지금 어디 있는가"를 정하는 곳을 `Sidebar.astro` 한 곳으로 모은다.**
`SidebarNav`는 받은 값을 그리기만 한다.

`Sidebar.astro`는 카운트 계산 때문에 이미 전체 글을 불러오고 있다
(`getSortedPosts(await getCollection("posts"))`). 이걸 재사용한다.

1. 경로가 `categories/...`면 지금처럼 경로에서 분류를 읽는다
2. 경로가 `posts/...`면 현재 `pathname`을 각 글의 `getPostUrl()` 결과와
   대조해 그 글을 찾고, 그 글의 `category`/`subcategory`를 쓴다
3. 둘 다 아니면 활성 분류 없음

비교 전에 양쪽 끝 슬래시를 정규화한다. `getPostUrl`이 base와 locale을 이미
붙여 주므로 같은 형태끼리 비교된다.

서버에서 렌더되므로 깜빡임이 없고, `Header`나 글 페이지에 props를 넘길 필요가
없다.

### 6.3 `SidebarNav.astro` 인터페이스

```ts
type Props = {
  counts: CategoryCounts;
  activeCategory?: CategoryId;
  activeSubcategory?: string;
  /** 활성 항목이 "지금 보는 페이지"인지 "지금 속한 섹션"인지 */
  activeKind: "page" | "section";
};
```

`getPathSegments` 호출과 `activeCategory`/`activeSubcategory` 계산을 이 파일에서
걷어낸다.

### 6.4 강조 규칙

- 활성 대분류의 아코디언은 펼쳐진 채로 렌더된다 (`li.open`)
- 잎 항목(소분류가 있으면 소분류, 없으면 대분류)에 `is-active`를 붙인다
- **`aria-current="page"`는 `activeKind === "page"`일 때만 붙인다.**
  글 페이지에서 사이드바의 그 항목은 지금 보는 페이지가 아니라 지금 속한
  섹션이다. 화면 강조는 같게 하되 스크린 리더에 잘못 알리지 않는다

## 7. 글 페이지 정리

`AdjacentPostNav`가 사라지면 `pages/posts/[...slug]/index.astro`의
`getStaticPaths`에서 앞뒤 글을 계산하던 블록과 `prevPost`/`nextPost` props가
쓰이지 않는다. 함께 걷어낸다.

렌더 순서:

```
h1 제목
날짜 · 수정 링크 메타 줄
SeriesBadge        (시리즈 글만. 메타 줄 아래, 본문 위 별도 한 줄)
article
hr
EditPost (모바일)
SeriesPosts 또는 CategoryPosts
태그
ShareLinks
```

본문 아래 두 번째 `hr`과 그 뒤 블록들은 사라진다.

## 8. i18n

`src/i18n/types.ts`의 `series`에 다음을 추가하고 두 언어를 채운다.

- `inThisSeries` — 이미 있다. 하단 상자 제목으로 계속 쓴다
- `prevPart` / `nextPart` — 이미 있다. 상자 안 이전/다음 편에 쓴다
- `badge` — 신규. ko `"{{current}}/{{total}}편"`, en `"Part {{current}} of {{total}}"`

`series.part`(`"{{total}}편 중 {{current}}편"`)는 `SeriesBox`가 쓰던 문구다.
하단 상자에서는 편수만 필요하므로 `category.seriesCount`(`"{{count}}편"`)를
재사용하고, `series.part`는 쓰는 곳이 없어지면 지운다.

## 9. 범위 밖

- 시리즈 아코디언 형태의 대안 디자인. 전체 목록을 항상 펼치기로 했으므로
  접기/펼치기 자체가 없어진다
- 시리즈 목록 페이지(`/series/`)와 개별 시리즈 페이지의 디자인
- `#9b` 이전/다음 글 플로팅 카드. 이 설계로 인라인 이전/다음 글이 사라지므로
  되살릴지 여부는 별도로 판단한다

## 10. 완료 기준

- 시리즈 글 상단에 연재명과 편 위치가 한 줄로 보인다
- 시리즈 글 하단 상자에 전체 편이 나오고, 현재 편이 굵게 표시되며 링크가 아니다
- 그 상자 안 아래쪽에 이전/다음 편이 양끝으로 놓인다
- 시리즈 글에 카테고리 상자가 나오지 않는다
- 낱개 글 하단에는 카테고리 상자만 나온다
- 어느 글에도 "이전 글 / 다음 글"이 나오지 않는다
- 글 페이지에서 사이드바의 해당 대분류가 펼쳐져 있고 잎 항목이 강조된다
- 글 페이지 사이드바의 강조 항목에 `aria-current`가 없다
- 분류 페이지에서는 기존 강조·`aria-current` 동작이 그대로다
- 두 하단 상자가 같은 껍데기를 쓰고 `data-pagefind-ignore`가 붙는다
- `pnpm build`, `pnpm test`, `pnpm lint`가 통과한다
