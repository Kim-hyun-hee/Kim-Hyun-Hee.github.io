import { describe, expect, it } from "vitest";
import { getNearbyCategoryPosts } from "@/utils/getNearbyCategoryPosts";

describe("getNearbyCategoryPosts", () => {
  it("does not relate category-less series posts", () => {
    const current = {
      id: "series-only",
      data: { series: "building-this-blog", seriesOrder: 1 },
    };
    const categoryless = { id: "other", data: {} };

    expect(getNearbyCategoryPosts([current, categoryless], current)).toEqual([]);
  });
});
