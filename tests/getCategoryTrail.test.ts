import { describe, it, expect } from "vitest";
import { getCategoryTrail } from "@/utils/getCategoryTrail";

describe("getCategoryTrail", () => {
  it("소분류가 있으면 대분류와 소분류를 순서대로 담는다", () => {
    expect(getCategoryTrail("deep-dive", "rendering")).toEqual([
      { label: "Deep Dive", path: "categories/deep-dive" },
      { label: "Rendering", path: "categories/deep-dive/rendering" },
    ]);
  });

  it("소분류를 갖지 않는 대분류는 대분류만 담는다", () => {
    expect(getCategoryTrail("etc")).toEqual([
      { label: "Etc", path: "categories/etc" },
    ]);
  });

  it("소분류 값이 유효하지 않으면 대분류만 담는다", () => {
    expect(getCategoryTrail("deep-dive", "없는소분류")).toEqual([
      { label: "Deep Dive", path: "categories/deep-dive" },
    ]);
  });
});
