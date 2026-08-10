import { hasSubcategories, type CategoryId } from "@/categories";

/**
 * 대분류 페이지가 글을 직접 나열하는가, 아니면 소분류로 안내하는가.
 *
 * `categories/[category]/` 아래 두 라우트가 이 판정을 서로 반대로 쓴다.
 * 소분류가 있는 대분류는 `index.astro`가 안내하고, 없는 대분류는
 * `[...page].astro`가 페이지네이션 목록을 그린다.
 * 두 곳이 각자 판단하면 어떤 대분류가 페이지를 못 갖거나 경로가 겹친다.
 */
export function listsPostsDirectly(category: CategoryId): boolean {
  return !hasSubcategories(category);
}
