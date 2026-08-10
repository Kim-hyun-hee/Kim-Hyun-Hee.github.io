import { describe, expect, it } from "vitest";
import { CATEGORY_IDS } from "@/categories";
import { listsPostsDirectly } from "@/utils/listsPostsDirectly";

describe("listsPostsDirectly", () => {
  it("does not list categories with subcategories directly", () => {
    expect(listsPostsDirectly("deep-dive")).toBe(false);
    expect(listsPostsDirectly("study")).toBe(false);
  });

  it("lists categories without subcategories directly, including Project", () => {
    expect(listsPostsDirectly("project")).toBe(true);
    expect(listsPostsDirectly("troubleshooting")).toBe(true);
  });
});

describe("category routing", () => {
  it("assigns every category to exactly one route", () => {
    const direct = CATEGORY_IDS.filter(listsPostsDirectly);
    const indirect = CATEGORY_IDS.filter(id => !listsPostsDirectly(id));

    expect([...direct, ...indirect].sort()).toEqual([...CATEGORY_IDS].sort());
    expect(direct.filter(id => indirect.includes(id))).toEqual([]);
  });
});
