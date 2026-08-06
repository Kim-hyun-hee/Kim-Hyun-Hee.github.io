import { describe, it, expect } from "vitest";
import {
  filterByCategory,
  filterBySubcategory,
  groupBySubcategory,
  type TaxonomyPost,
} from "@/utils/getPostsByCategory";

const post = (
  id: string,
  category: TaxonomyPost["data"]["category"],
  subcategory?: string
) => ({ id, data: { category, subcategory } });

const posts = [
  post("a", "deep-dive", "rendering"),
  post("b", "deep-dive", "memory"),
  post("c", "deep-dive", "rendering"),
  post("d", "etc"),
];

describe("filterByCategory", () => {
  it("해당 대분류의 글만 남긴다", () => {
    expect(filterByCategory(posts, "deep-dive").map(p => p.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("일치하는 글이 없으면 빈 배열", () => {
    expect(filterByCategory(posts, "study")).toEqual([]);
  });
});

describe("filterBySubcategory", () => {
  it("대분류와 소분류가 모두 일치하는 글만 남긴다", () => {
    expect(
      filterBySubcategory(posts, "deep-dive", "rendering").map(p => p.id)
    ).toEqual(["a", "c"]);
  });
});

describe("groupBySubcategory", () => {
  it("정의 순서대로 소분류 그룹을 반환한다", () => {
    const groups = groupBySubcategory(posts, "deep-dive");
    expect(groups.map(g => g.id)).toEqual([
      "rendering",
      "architecture",
      "memory",
    ]);
  });

  it("글이 없는 소분류도 빈 배열로 포함한다", () => {
    const groups = groupBySubcategory(posts, "deep-dive");
    expect(groups.find(g => g.id === "architecture")?.posts).toEqual([]);
  });

  it("소분류가 없는 대분류에는 빈 배열을 반환한다", () => {
    expect(groupBySubcategory(posts, "etc")).toEqual([]);
  });
});
