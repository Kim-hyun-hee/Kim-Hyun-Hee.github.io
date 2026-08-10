import { describe, it, expect } from "vitest";
import {
  CATEGORY_IDS,
  hasSubcategories,
  getSubcategoryIds,
  getSubcategoryLabel,
  isValidSubcategory,
} from "@/categories";

describe("CATEGORY_IDS", () => {
  it("정의된 대분류를 순서대로 담는다", () => {
    expect(CATEGORY_IDS).toEqual([
      "deep-dive",
      "troubleshooting",
      "study",
      "etc",
    ]);
  });
});

describe("hasSubcategories", () => {
  it("소분류를 가진 대분류에 true를 반환한다", () => {
    expect(hasSubcategories("deep-dive")).toBe(true);
    expect(hasSubcategories("study")).toBe(true);
  });

  it("소분류가 없는 대분류에 false를 반환한다", () => {
    expect(hasSubcategories("troubleshooting")).toBe(false);
    expect(hasSubcategories("etc")).toBe(false);
  });
});

describe("getSubcategoryIds", () => {
  it("소분류 id 배열을 정의 순서대로 반환한다", () => {
    expect(getSubcategoryIds("deep-dive")).toEqual([
      "rendering",
      "architecture",
      "memory",
    ]);
  });

  it("소분류가 없으면 빈 배열을 반환한다", () => {
    expect(getSubcategoryIds("etc")).toEqual([]);
  });
});

describe("getSubcategoryLabel", () => {
  it("표시용 라벨을 반환한다", () => {
    expect(getSubcategoryLabel("study", "cs")).toBe("CS 기초");
  });

  it("없는 소분류에 undefined를 반환한다", () => {
    expect(getSubcategoryLabel("study", "nope")).toBeUndefined();
  });
});

describe("isValidSubcategory", () => {
  it("해당 대분류에 속한 소분류면 true", () => {
    expect(isValidSubcategory("deep-dive", "rendering")).toBe(true);
  });

  it("다른 대분류의 소분류면 false", () => {
    expect(isValidSubcategory("deep-dive", "cs")).toBe(false);
  });

  it("소분류를 갖지 않는 대분류면 항상 false", () => {
    expect(isValidSubcategory("etc", "rendering")).toBe(false);
  });
});
