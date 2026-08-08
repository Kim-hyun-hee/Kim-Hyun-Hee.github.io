import { CATEGORIES, getSubcategoryLabel, type CategoryId } from "@/categories";

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
