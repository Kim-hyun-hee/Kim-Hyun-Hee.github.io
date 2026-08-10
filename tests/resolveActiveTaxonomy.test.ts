import { describe, it, expect } from "vitest";
import {
  resolveActiveTaxonomy,
  type TaxonomyLocation,
} from "@/utils/resolveActiveTaxonomy";

const posts: TaxonomyLocation[] = [
  {
    url: "/posts/unity-render-pipeline/01-what-srp-replaces/",
    category: "deep-dive",
    subcategory: "rendering",
  },
  { url: "/posts/digitaltwin/05-culling/" },
];

describe("resolveActiveTaxonomy — 분류 페이지", () => {
  it("대분류 페이지는 page 종류로 대분류를 돌려준다", () => {
    expect(
      resolveActiveTaxonomy(["categories", "deep-dive"], "/categories/deep-dive/", posts)
    ).toEqual({ category: "deep-dive", subcategory: undefined, kind: "page" });
  });

  it("소분류 페이지는 소분류까지 돌려준다", () => {
    expect(
      resolveActiveTaxonomy(
        ["categories", "deep-dive", "rendering"],
        "/categories/deep-dive/rendering/",
        posts
      )
    ).toEqual({ category: "deep-dive", subcategory: "rendering", kind: "page" });
  });

  it("정의에 없는 대분류 slug면 null", () => {
    expect(
      resolveActiveTaxonomy(["categories", "nope"], "/categories/nope/", posts)
    ).toBeNull();
  });
});

describe("resolveActiveTaxonomy — 글 페이지", () => {
  it("글 페이지는 section 종류로 그 글의 분류를 돌려준다", () => {
    expect(
      resolveActiveTaxonomy(
        ["posts", "unity-render-pipeline", "01-what-srp-replaces"],
        "/posts/unity-render-pipeline/01-what-srp-replaces/",
        posts
      )
    ).toEqual({
      category: "deep-dive",
      subcategory: "rendering",
      kind: "section",
    });
  });

  it("소분류가 없는 글은 대분류만 돌려준다", () => {
    expect(
      resolveActiveTaxonomy(
        ["posts", "digitaltwin", "05-culling"],
        "/posts/digitaltwin/05-culling/",
        posts
      )
    ).toBeNull();
  });

  it("끝 슬래시가 달라도 같은 글로 본다", () => {
    expect(
      resolveActiveTaxonomy(
        ["posts", "digitaltwin", "05-culling"],
        "/posts/digitaltwin/05-culling",
        posts
      )
    ).toBeNull();
  });

  it("목록에 없는 글 경로면 null", () => {
    expect(
      resolveActiveTaxonomy(["posts", "ghost"], "/posts/ghost/", posts)
    ).toBeNull();
  });

  it("글 목록 페이지(/posts/)면 null", () => {
    expect(resolveActiveTaxonomy(["posts"], "/posts/", posts)).toBeNull();
  });
});

describe("resolveActiveTaxonomy — 그 밖의 페이지", () => {
  it("태그 페이지면 null", () => {
    expect(resolveActiveTaxonomy(["tags"], "/tags/", posts)).toBeNull();
  });

  it("홈이면 null", () => {
    expect(resolveActiveTaxonomy([], "/", posts)).toBeNull();
  });
});
