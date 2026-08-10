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

  if (!category) return [];

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
