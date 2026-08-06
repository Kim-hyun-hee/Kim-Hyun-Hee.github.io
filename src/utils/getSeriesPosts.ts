import type { TaxonomyPost } from "./getPostsByCategory";

/**
 * 시리즈에 속한 글을 편 순서로 정렬해 반환한다.
 *
 * 콘텐츠 스키마의 zod 검증은 글 하나씩만 보므로 같은 시리즈에 같은
 * `seriesOrder`가 두 번 등장하는 것을 잡지 못한다. 그 검사를 여기서 하고,
 * 위반 시 예외를 던져 빌드를 세운다.
 */
export function getSeriesPosts<T extends TaxonomyPost>(
  posts: T[],
  seriesId: string
): T[] {
  const inSeries = posts.filter(p => p.data.series === seriesId);

  const seen = new Map<number, number>();
  for (const p of inSeries) {
    const order = p.data.seriesOrder!;
    seen.set(order, (seen.get(order) ?? 0) + 1);
  }

  const duplicates = [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(([order]) => order);

  if (duplicates.length > 0) {
    throw new Error(
      `시리즈 "${seriesId}"에 중복된 seriesOrder가 있습니다: ${duplicates.join(", ")}`
    );
  }

  return inSeries.sort((a, b) => a.data.seriesOrder! - b.data.seriesOrder!);
}

/**
 * 시리즈 내에서 특정 편(`order`)의 위치를 계산한다.
 *
 * 계약: `order`가 `posts`로 넘어온 목록 안에 없으면(예: 예약 발행 등으로
 * `postFilter`가 걸러낸 글을 미리보기로 여는 경우) `current`는 `null`을
 * 반환한다. `0`이나 다른 임의의 값으로 대체하지 않는다 — 호출부가
 * "존재하지 않음"과 "1편"을 값으로 구분할 수 있어야 하고, `null`을
 * 그대로 화면에 찍으면 눈에 띄는 오류가 나지 조용히 "0편"처럼 보이지
 * 않는다. `total`은 이 경우에도 시리즈 전체 편수를 그대로 반환하고,
 * `prev`/`next`는 항상 `null`이다.
 */
export function getSeriesPosition<T extends TaxonomyPost>(
  posts: T[],
  seriesId: string,
  order: number
): {
  current: number | null;
  total: number;
  prev: T | null;
  next: T | null;
} {
  const ordered = getSeriesPosts(posts, seriesId);
  const index = ordered.findIndex(p => p.data.seriesOrder === order);
  const found = index !== -1;

  return {
    current: found ? index + 1 : null,
    total: ordered.length,
    prev: index > 0 ? ordered[index - 1] : null,
    next: found && index < ordered.length - 1 ? ordered[index + 1] : null,
  };
}
