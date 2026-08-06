import { describe, it, expect } from "vitest";
import { SERIES, SERIES_IDS, getSeriesByCategory } from "@/series";

describe("SERIES_IDS", () => {
  it("정의된 시리즈 id를 담는다", () => {
    expect(SERIES_IDS).toContain("dod-digitaltwin-unity");
  });

  it("모든 id가 SERIES의 키와 일치한다", () => {
    expect(SERIES_IDS.every(id => id in SERIES)).toBe(true);
  });
});

describe("SERIES 정의", () => {
  it("모든 시리즈가 project 대분류에 속한다", () => {
    for (const id of SERIES_IDS) {
      expect(SERIES[id].category).toBe("project");
    }
  });

  it("status는 ongoing 또는 completed다", () => {
    for (const id of SERIES_IDS) {
      expect(["ongoing", "completed"]).toContain(SERIES[id].status);
    }
  });
});

describe("getSeriesByCategory", () => {
  it("해당 대분류의 시리즈를 반환한다", () => {
    const result = getSeriesByCategory("project");
    expect(result.map(s => s.id)).toContain("dod-digitaltwin-unity");
    expect(result[0]).toHaveProperty("label");
    expect(result[0]).toHaveProperty("status");
  });

  it("시리즈가 없는 대분류에는 빈 배열을 반환한다", () => {
    expect(getSeriesByCategory("etc")).toEqual([]);
  });
});
