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

export function getSeriesPosition<T extends TaxonomyPost>(
  posts: T[],
  seriesId: string,
  order: number
): { current: number; total: number; prev: T | null; next: T | null } {
  const ordered = getSeriesPosts(posts, seriesId);
  const index = ordered.findIndex(p => p.data.seriesOrder === order);

  return {
    current: index + 1,
    total: ordered.length,
    prev: index > 0 ? ordered[index - 1] : null,
    next: index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null,
  };
}
