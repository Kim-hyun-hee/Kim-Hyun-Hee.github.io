import { describe, it, expect } from "vitest";
import { getNearbyCategoryPosts } from "@/utils/getNearbyCategoryPosts";
import type { TaxonomyPost } from "@/utils/getPostsByCategory";

const post = (
  id: string,
  category: TaxonomyPost["data"]["category"],
  subcategory?: string,
  series?: string
) => ({ id, data: { category, subcategory, series } });

// 최신순으로 늘어놓은 목록. rendering 8개 + 다른 소분류/대분류.
const rendering = [
  post("r1", "deep-dive", "rendering"),
  post("r2", "deep-dive", "rendering"),
  post("r3", "deep-dive", "rendering"),
  post("r4", "deep-dive", "rendering"),
  post("r5", "deep-dive", "rendering"),
  post("r6", "deep-dive", "rendering"),
  post("r7", "deep-dive", "rendering"),
  post("r8", "deep-dive", "rendering"),
];
const all = [
  ...rendering,
  post("m1", "deep-dive", "memory"),
  post("e1", "etc"),
  post("e2", "etc"),
  post("e3", "etc"),
];
const ids = (posts: { id: string }[]) => posts.map(p => p.id);

describe("getNearbyCategoryPosts — 창 잡기", () => {
  it("가운데 글은 앞뒤를 섞어 5개를 준다", () => {
    expect(ids(getNearbyCategoryPosts(all, rendering[3]))).toEqual([
      "r1",
      "r2",
      "r3",
      "r5",
      "r6",
    ]);
  });

  it("맨 앞(최신) 글은 뒤쪽으로만 채워 5개를 준다", () => {
    expect(ids(getNearbyCategoryPosts(all, rendering[0]))).toEqual([
      "r2",
      "r3",
      "r4",
      "r5",
      "r6",
    ]);
  });

  it("맨 뒤(가장 오래된) 글은 앞쪽으로만 채워 5개를 준다", () => {
    expect(ids(getNearbyCategoryPosts(all, rendering[7]))).toEqual([
      "r3",
      "r4",
      "r5",
      "r6",
      "r7",
    ]);
  });

  it("limit 인자를 존중한다", () => {
    expect(ids(getNearbyCategoryPosts(all, rendering[3], 2))).toEqual([
      "r3",
      "r5",
    ]);
  });
});

describe("getNearbyCategoryPosts — 범위", () => {
  it("소분류가 있으면 같은 대분류의 다른 소분류를 섞지 않는다", () => {
    expect(ids(getNearbyCategoryPosts(all, rendering[3]))).not.toContain("m1");
  });

  it("소분류가 없으면 대분류 기준으로 모은다", () => {
    const current = all.find(p => p.id === "e2")!;
    expect(ids(getNearbyCategoryPosts(all, current))).toEqual(["e1", "e3"]);
  });

  it("글이 limit보다 적으면 있는 만큼만 주고 현재 글은 뺀다", () => {
    const current = all.find(p => p.id === "e1")!;
    expect(ids(getNearbyCategoryPosts(all, current))).toEqual(["e2", "e3"]);
  });

  it("범위 안에 현재 글뿐이면 빈 배열", () => {
    const solo = post("solo", "troubleshooting");
    expect(getNearbyCategoryPosts([...all, solo], solo)).toEqual([]);
  });

  it("현재 글이 목록에 없으면 빈 배열", () => {
    const ghost = post("ghost", "deep-dive", "rendering");
    expect(getNearbyCategoryPosts(all, ghost)).toEqual([]);
  });
});

describe("getNearbyCategoryPosts — 시리즈", () => {
  // 시리즈 UI가 이미 같은 편들을 보여주므로 같은 연재는 뺀다.
  const seriesList = [
    post("s1", "troubleshooting", undefined, "alpha"),
    post("s2", "troubleshooting", undefined, "alpha"),
    post("s3", "troubleshooting", undefined, "alpha"),
    post("p1", "troubleshooting"),
    post("p2", "troubleshooting"),
  ];

  it("같은 연재의 다른 편을 빼고 연재 밖 글로만 채운다", () => {
    expect(ids(getNearbyCategoryPosts(seriesList, seriesList[1]))).toEqual([
      "p1",
      "p2",
    ]);
  });

  it("다른 연재의 글은 남긴다", () => {
    const withBeta = [
      ...seriesList,
      post("b1", "troubleshooting", undefined, "beta"),
    ];
    expect(ids(getNearbyCategoryPosts(withBeta, withBeta[1]))).toContain("b1");
  });

  it("범위 안이 전부 같은 연재이면 빈 배열", () => {
    const onlySeries = seriesList.slice(0, 3);
    expect(getNearbyCategoryPosts(onlySeries, onlySeries[1])).toEqual([]);
  });
});
