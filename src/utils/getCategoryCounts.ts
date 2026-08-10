import { CATEGORY_IDS, getSubcategoryIds, type CategoryId } from "@/categories";
import { filterByCategory, filterBySubcategory } from "./getPostsByCategory";
import type { TaxonomyPost } from "./getPostsByCategory";

export type CategoryCounts = {
  /** 공개된 전체 글 수 (분류 전체보기 배지) */
  total: number;
  /** 대분류별 글 수 */
  byCategory: Record<CategoryId, number>;
  /** 소분류별 글 수. 키는 `${category}/${subcategory}` */
  bySubcategory: Record<string, number>;
};

/**
 * 사이드바 배지에 쓸 카테고리/소분류 글 수를 한 번에 집계한다.
 * 입력은 이미 `postFilter`를 통과한 글 목록이어야 한다(초안·예약 글 제외).
 */
export function getCategoryCounts<T extends TaxonomyPost>(
  posts: T[]
): CategoryCounts {
  const byCategory = {} as Record<CategoryId, number>;
  const bySubcategory: Record<string, number> = {};

  for (const id of CATEGORY_IDS) {
    byCategory[id] = filterByCategory(posts, id).length;
    for (const sub of getSubcategoryIds(id)) {
      bySubcategory[`${id}/${sub}`] = filterBySubcategory(
        posts,
        id,
        sub
      ).length;
    }
  }

  return { total: posts.length, byCategory, bySubcategory };
}
