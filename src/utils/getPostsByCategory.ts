import { getSubcategoryIds, type CategoryId } from "@/categories";

/**
 * 분류 유틸이 요구하는 최소 형태.
 * `CollectionEntry<"posts">`가 구조적으로 이를 만족하므로 별도 변환이 필요 없고,
 * Astro 런타임 없이 단위 테스트할 수 있다.
 */
export type TaxonomyPost = {
  data: {
    category?: CategoryId;
    subcategory?: string;
    series?: string;
    seriesOrder?: number;
  };
};

export function filterByCategory<T extends TaxonomyPost>(
  posts: T[],
  category: CategoryId
): T[] {
  return posts.filter(p => p.data.category === category);
}

export function filterBySubcategory<T extends TaxonomyPost>(
  posts: T[],
  category: CategoryId,
  subcategory: string
): T[] {
  return posts.filter(
    p => p.data.category === category && p.data.subcategory === subcategory
  );
}

/**
 * 소분류별로 글을 묶는다. 그룹 순서는 `categories.ts`의 정의 순서를 따르며,
 * 글이 하나도 없는 소분류도 빈 배열로 포함한다 (내비게이션이 목록을
 * 일관되게 그릴 수 있도록).
 */
export function groupBySubcategory<T extends TaxonomyPost>(
  posts: T[],
  category: CategoryId
): { id: string; posts: T[] }[] {
  return getSubcategoryIds(category).map(id => ({
    id,
    posts: filterBySubcategory(posts, category, id),
  }));
}
