import { z } from "astro/zod";
import {
  CATEGORY_IDS,
  getSubcategoryIds,
  hasSubcategories,
  isValidSubcategory,
} from "@/categories";
import { SERIES_IDS } from "@/series";

export const taxonomyFields = {
  category: z.enum(CATEGORY_IDS).optional(),
  subcategory: z.string().optional(),
  series: z.enum(SERIES_IDS).optional(),
  seriesOrder: z.number().int().positive().optional(),
};

type TaxonomyInput = {
  category?: (typeof CATEGORY_IDS)[number];
  subcategory?: string;
  series?: (typeof SERIES_IDS)[number];
  seriesOrder?: number;
};

export function validateTaxonomy(
  data: TaxonomyInput,
  ctx: z.RefinementCtx
): void {
  if (!data.category && data.subcategory) {
    ctx.addIssue({
      code: "custom",
      path: ["subcategory"],
      message: "subcategory requires category.",
    });
  }

  if (data.category) {
    const needsSub = hasSubcategories(data.category);

    if (needsSub && !data.subcategory) {
      ctx.addIssue({
        code: "custom",
        path: ["subcategory"],
        message: `"${data.category}" requires subcategory. Available: ${getSubcategoryIds(
          data.category
        ).join(", ")}`,
      });
    }

    if (
      needsSub &&
      data.subcategory &&
      !isValidSubcategory(data.category, data.subcategory)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["subcategory"],
        message: `"${data.subcategory}" is not a subcategory of "${data.category}". Available: ${getSubcategoryIds(
          data.category
        ).join(", ")}`,
      });
    }

    if (!needsSub && data.subcategory) {
      ctx.addIssue({
        code: "custom",
        path: ["subcategory"],
        message: `"${data.category}" does not have subcategories.`,
      });
    }
  }

  if (Boolean(data.series) !== Boolean(data.seriesOrder)) {
    ctx.addIssue({
      code: "custom",
      path: ["seriesOrder"],
      message: "series and seriesOrder must be specified together.",
    });
  }
}
