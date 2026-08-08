import { describe, it, expect } from "vitest";
import { CATEGORY_IDS, hasSubcategories } from "@/categories";
import { getSeriesByCategory } from "@/series";
import { listsPostsDirectly } from "@/utils/listsPostsDirectly";

describe("listsPostsDirectly", () => {
  it("소분류를 가진 대분류는 글을 직접 나열하지 않는다", () => {
    expect(listsPostsDirectly("deep-dive")).toBe(false);
    expect(listsPostsDirectly("study")).toBe(false);
  });

  it("소분류도 시리즈도 없는 대분류는 글을 직접 나열한다", () => {
    expect(listsPostsDirectly("troubleshooting")).toBe(true);
  });

  it("시리즈를 가진 대분류는 글을 직접 나열하지 않는다", () => {
    const withSeries = CATEGORY_IDS.filter(
      id => !hasSubcategories(id) && getSeriesByCategory(id).length > 0
    );

    for (const id of withSeries) {
      expect(listsPostsDirectly(id)).toBe(false);
    }
  });
});

// 라우트 두 파일이 이 판정을 서로 반대로 쓴다. 합집합이 전체가 아니면 어떤
// 대분류가 페이지를 못 갖고, 교집합이 있으면 경로가 겹쳐 빌드가 멈춘다.
describe("대분류 배정", () => {
  it("모든 대분류가 정확히 한 라우트에 배정된다", () => {
    const direct = CATEGORY_IDS.filter(listsPostsDirectly);
    const indirect = CATEGORY_IDS.filter(id => !listsPostsDirectly(id));

    expect([...direct, ...indirect].sort()).toEqual([...CATEGORY_IDS].sort());
    expect(direct.filter(id => indirect.includes(id))).toEqual([]);
  });

  it("양쪽 모두 비어 있지 않다", () => {
    expect(CATEGORY_IDS.filter(listsPostsDirectly).length).toBeGreaterThan(0);
    expect(
      CATEGORY_IDS.filter(id => !listsPostsDirectly(id)).length
    ).toBeGreaterThan(0);
  });
});
