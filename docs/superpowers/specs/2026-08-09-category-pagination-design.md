# 대분류 페이지 페이지네이션

작성일: 2026-08-09

## 1. 배경

`src/pages/categories/[category]/index.astro` 한 파일이 세 가지 화면을 그린다.

| 대분류 | 보여주는 것 | 조건 |
|---|---|---|
| `deep-dive`, `study` | 소분류별 3개씩 + "더 보기" | `groups.length > 0` |
| `project` | 시리즈 목록 | `groups.length === 0 && series.length > 0` |
| `troubleshooting`, `etc` | **글 전체** | `groups.length === 0 && series.length === 0` |

`project`는 소분류가 없지만 `series.ts`에 시리즈 둘이 걸려 있어 시리즈 목록을
그린다. 페이지네이션이 필요한 것은 `troubleshooting`과 `etc` 둘뿐이다.

세 번째가 문제다. 글을 전부 한 화면에 쏟는다. 파일 이름이 `index.astro`라
페이지 번호를 받을 자리가 없어 페이지네이션을 붙일 수 없다.

소분류 페이지(`[subcategory]/[...page].astro`)에는 이미 페이지네이션이 있다.
없는 것은 대분류 페이지뿐이다.

## 2. 파일을 나눈다

```
src/pages/categories/[category]/
  index.astro         소분류 섹션 / 시리즈 목록   (페이지네이션 없음)
  [...page].astro     글 전체 목록 + 페이지네이션   ← 새로 만든다
  [subcategory]/
    [...page].astro   소분류별 목록              (이미 있다. 손대지 않는다)
```

각 파일이 한 화면만 그린다. 한 파일 안에서 조건 셋으로 갈라지지 않는다.

**적은 변경보다 깔끔한 구조를 택했다.** 페이지네이션이 필요한 모드는 아래 일곱
줄이 전부다.

```astro
{ groups.length === 0 && series.length === 0 && (
    <ul>{posts.map(post => <Card {...post} />)}</ul>
) }
```

나머지 마흔 줄(소분류 섹션)과 스무 줄(시리즈 목록)은 페이지네이션과 무관하다.
쪼개도 겹치는 것은 `Layout`/`Header`/`Main`/`Footer` 껍데기 여섯 줄뿐이고, 그
껍데기는 이 저장소의 모든 페이지가 이미 똑같이 반복하는 형태다.

## 3. 주소가 겹치지 않게 한다

두 파일이 같은 경로를 만들면 Astro가 빌드에서 멈춘다. 각 파일의
`getStaticPaths`가 **자기가 맡을 대분류만** 생성한다.

| 파일 | 맡는 대분류 |
|---|---|
| `index.astro` | 소분류가 있거나 시리즈가 있는 것 |
| `[...page].astro` | 둘 다 없는 것 |

대분류 하나는 정확히 한 파일이 담당한다.

## 4. 판정을 한 곳에 둔다

"이 대분류는 어느 쪽인가"를 두 파일이 각자 판단하면, 나중에 한쪽만 고쳤을 때
어떤 대분류가 페이지를 아예 못 갖거나 두 개 갖는다. 빌드가 멈추거나 링크가 조용히
404가 되는 종류의 사고다.

순수 함수 하나로 뺀다.

```ts
// src/utils/listsPostsDirectly.ts
export function listsPostsDirectly(category: CategoryId): boolean {
  return (
    !hasSubcategories(category) && getSeriesByCategory(category).length === 0
  );
}
```

두 파일이 이 함수를 서로 반대로 쓴다. `index.astro`는 `!listsPostsDirectly`,
`[...page].astro`는 `listsPostsDirectly`.

**`src/categories.ts`에 넣지 않는 이유.** 이 판정은 `@/series`의
`getSeriesByCategory`를 부른다. `series.ts`는 `SERIES`의 `category` 필드 때문에
이미 `categories.ts`를 참조하므로, `categories.ts`가 `series.ts`를 부르면 순환
참조가 된다. 두 모듈을 모두 아는 자리는 `utils`다.

### 4.1 기존 조건과 같은 뜻인지

지금 `index.astro`는 `groups.length > 0`으로 판단한다. `groupBySubcategory`는
`getSubcategoryIds(category).map(...)`이라 **글이 없어도 소분류 수만큼 항목을
돌려준다**(그래서 화면에 "—"가 그려진다). 따라서
`groups.length > 0` ⟺ `hasSubcategories(category)`이고, 판정을 바꾸는 것이 아니라
같은 뜻을 이름으로 드러내는 것이다.

## 5. 새 파일의 모양

`[subcategory]/[...page].astro`의 패턴을 그대로 따른다.

```ts
export async function getStaticPaths({ paginate }: GetStaticPathsOptions) {
  const posts = getSortedPosts(await getCollection("posts"));

  return CATEGORY_IDS.filter(listsPostsDirectly).flatMap(category =>
    paginate(filterByCategory(posts, category), {
      params: { category },
      pageSize: config.posts.perPage,
    })
  );
}
```

화면은 `Main`에 `pageTitle`과 `pageDesc`를 넘긴다. 대분류 페이지이므로 설명을
유지한다. 그 아래 `<Pagination {page} />`, `<Footer noMarginTop={page.lastPage > 1} />`
도 소분류 라우트와 같다.

## 6. index.astro에서 걷어내는 것

- 세 번째 분기(`groups.length === 0 && series.length === 0`) 블록
- `getStaticPaths`가 `CATEGORY_IDS` 전체 대신 `!listsPostsDirectly`인 것만 생성
- 쓰이지 않게 되는 `posts` 변수와 `filterByCategory` import — `groups` 계산에
  여전히 필요하므로 실제로 지워지는지는 구현하며 확인한다

## 7. 검증

**테스트.** 모든 대분류가 정확히 한 파일에 배정되는지 — 빠짐도 겹침도 없는지.
`listsPostsDirectly`와 그 부정의 합집합이 `CATEGORY_IDS` 전체이고 교집합이
비어야 한다.

**빌드.** 0 errors. 경로가 겹치면 여기서 멈춘다.

**실물.**

1. `troubleshooting`·`etc`에 페이지네이션이 뜨는지
2. `deep-dive`·`study`가 지금 모습 그대로인지 (소분류 섹션 3개씩 + "더 보기")
3. `project`가 시리즈 목록 그대로인지
4. 소분류 페이지가 영향받지 않았는지

지금 더미 글이 `deep-dive`에만 있어 `troubleshooting`·`etc`는 글이 부족해
페이지네이션이 안 보일 수 있다. 필요하면 그쪽에 더미를 넣어 확인한다.

## 8. 범위 밖

- **소분류 라우트** — 이미 동작한다. 손대지 않는다
- **2페이지 이후 트레일링 슬래시 404** — `/categories/…/2`는 되고 `/2/`는 안 되는
  건. 버튼 이동은 정상이라 별건으로 둔다
- **`perPage` 값** — 이번 작업 전에 8로 올렸다
