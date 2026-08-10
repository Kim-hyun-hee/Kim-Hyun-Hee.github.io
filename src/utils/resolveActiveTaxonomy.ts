import { CATEGORY_IDS, type CategoryId } from "@/categories";

/** 사이드바가 강조할 위치. */
export type ActiveTaxonomy = {
  category: CategoryId;
  subcategory?: string;
  /**
   * "page"  — 사이드바의 그 항목이 지금 보는 페이지 자체 (분류 페이지)
   * "section" — 지금 속한 섹션일 뿐 (글 페이지). aria-current를 붙이지 않는다.
   */
  kind: "page" | "section";
} | null;

/** 글 하나의 위치 정보. 호출부가 getPostUrl()로 url을 채워 넘긴다. */
export type TaxonomyLocation = {
  url: string;
  category?: CategoryId;
  subcategory?: string;
};

const stripTrailingSlash = (path: string) => path.replace(/\/+$/, "");

function isCategoryId(value: string | undefined): value is CategoryId {
  return (
    value !== undefined && (CATEGORY_IDS as readonly string[]).includes(value)
  );
}

/**
 * "지금 어디 있는가"를 한 곳에서 판정한다.
 *
 * 분류 페이지는 경로에서 바로 읽는다. 글 페이지는 경로만으로는 분류를 알 수
 * 없으므로 글 목록과 대조한다 — 글 URL이 분류를 담지 않기 때문이다.
 */
export function resolveActiveTaxonomy(
  segments: string[],
  currentPath: string,
  posts: TaxonomyLocation[]
): ActiveTaxonomy {
  if (segments[0] === "categories") {
    const category = segments[1];
    if (!isCategoryId(category)) return null;
    return { category, subcategory: segments[2], kind: "page" };
  }

  if (segments[0] === "posts") {
    const target = stripTrailingSlash(currentPath);
    const post = posts.find(p => stripTrailingSlash(p.url) === target);
    if (!post?.category) return null;
    return {
      category: post.category,
      subcategory: post.subcategory,
      kind: "section",
    };
  }

  return null;
}
