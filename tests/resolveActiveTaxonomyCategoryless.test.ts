import { describe, expect, it } from "vitest";
import {
  resolveActiveTaxonomy,
  type TaxonomyLocation,
} from "@/utils/resolveActiveTaxonomy";

describe("resolveActiveTaxonomy", () => {
  it("does not activate a category for a category-less post", () => {
    const posts = [
      { url: "/posts/building-this-blog/01-why-rebuild/" },
    ] as TaxonomyLocation[];

    expect(
      resolveActiveTaxonomy(
        ["posts", "building-this-blog", "01-why-rebuild"],
        "/posts/building-this-blog/01-why-rebuild/",
        posts
      )
    ).toBeNull();
  });
});
