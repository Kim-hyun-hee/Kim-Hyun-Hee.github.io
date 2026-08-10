import { hasSubcategories, type CategoryId } from "@/categories";

/**
 * 대분류 페이지가 글을 직접 나열하는가, 아니면 소분류·시리즈로 안내하는가.
 *
 * `categories/[category]/` 아래 두 라우트가 이 판정을 서로 반대로 쓴다.
 * `index.astro`는 안내하는 쪽을, `[...page].astro`는 나열하는 쪽을 맡는다.
 * 두 곳이 각자 판단하면 어떤 대분류가 페이지를 못 갖거나 경로가 겹친다.
 *
 * `categories.ts`가 아니라 여기 있는 이유는 순환 참조다. `series.ts`는 이미
 * `categories.ts`를 참조한다.
 */
export function listsPostsDirectly(category: CategoryId): boolean {
  return !hasSubcategories(category);
}
