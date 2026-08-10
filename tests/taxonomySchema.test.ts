import { z } from "astro/zod";
import { describe, expect, it } from "vitest";
import { taxonomyFields, validateTaxonomy } from "@/taxonomySchema";

const schema = z.object(taxonomyFields).superRefine(validateTaxonomy);

describe("taxonomy schema", () => {
  it.each([
    ["neither", {}],
    ["category only", { category: "etc" }],
    [
      "series only",
      { series: "building-this-blog", seriesOrder: 1 },
    ],
    [
      "category and series",
      { category: "etc", series: "building-this-blog", seriesOrder: 1 },
    ],
  ])("accepts %s", (_, input) => {
    expect(schema.safeParse(input).success).toBe(true);
  });

  it("requires seriesOrder when series is supplied", () => {
    const result = schema.safeParse({ series: "building-this-blog" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.path[0] === "seriesOrder")).toBe(
        true
      );
    }
  });

  it("requires series when seriesOrder is supplied", () => {
    const result = schema.safeParse({ seriesOrder: 1 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.path[0] === "seriesOrder")).toBe(
        true
      );
    }
  });

  it("reports subcategory without a category on subcategory", () => {
    const result = schema.safeParse({ subcategory: "rendering" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.path[0] === "subcategory")).toBe(
        true
      );
    }
  });

  it("accepts a valid category and subcategory pair", () => {
    expect(
      schema.safeParse({ category: "deep-dive", subcategory: "rendering" })
        .success
    ).toBe(true);
  });

  it("rejects a subcategory outside its category", () => {
    expect(
      schema.safeParse({ category: "deep-dive", subcategory: "cs" }).success
    ).toBe(false);
  });
});
