/**
 * 카테고리 단일 소스.
 * 사이드바 내비게이션, 라우팅, 콘텐츠 스키마 검증이 모두 이 파일에서 파생된다.
 * 카테고리를 추가하거나 이름을 바꿀 때는 이 파일만 고친다.
 *
 * `subcategories: null`은 "소분류를 갖지 않는 대분류"를 뜻하며 빈 객체와 구분된다.
 */
export const CATEGORIES = {
  "deep-dive": {
    label: "Deep Dive",
    description: "렌더링·아키텍처·메모리를 파고든 기록",
    subcategories: {
      rendering: "Rendering",
      architecture: "Architecture",
      memory: "Memory",
    },
  },
  troubleshooting: {
    label: "Troubleshooting",
    description: "짧고 실전적인 이슈 기록",
    subcategories: null,
  },
  study: {
    label: "Study",
    description: "기초를 다시 훑는 기록",
    subcategories: {
      cs: "CS 기초",
      language: "Language",
      tools: "Tools & Framework",
    },
  },
  etc: {
    label: "Etc",
    description: "잡담·회고·커리어",
    subcategories: null,
  },
} as const;

export type CategoryId = keyof typeof CATEGORIES;

export const CATEGORY_IDS = Object.keys(CATEGORIES) as [
  CategoryId,
  ...CategoryId[],
];

export function hasSubcategories(id: CategoryId): boolean {
  return CATEGORIES[id].subcategories !== null;
}

export function getSubcategoryIds(id: CategoryId): string[] {
  const subs = CATEGORIES[id].subcategories;
  return subs === null ? [] : Object.keys(subs);
}

export function getSubcategoryLabel(
  id: CategoryId,
  sub: string
): string | undefined {
  const subs = CATEGORIES[id].subcategories;
  if (subs === null) return undefined;
  return (subs as Record<string, string>)[sub];
}

export function isValidSubcategory(id: CategoryId, sub: string): boolean {
  return getSubcategoryLabel(id, sub) !== undefined;
}
