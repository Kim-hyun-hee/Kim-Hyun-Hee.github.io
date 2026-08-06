import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import config from "@/config";
import {
  CATEGORY_IDS,
  hasSubcategories,
  isValidSubcategory,
} from "@/categories";
import { SERIES_IDS } from "@/series";

export const BLOG_PATH = "src/content/posts";

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z
      .object({
        author: z.string().default(config.site.author),
        pubDatetime: z.date(),
        modDatetime: z.date().optional().nullable(),
        title: z.string(),
        featured: z.boolean().optional(),
        draft: z.boolean().optional(),
        tags: z.array(z.string()).default(["others"]),
        category: z.enum(CATEGORY_IDS),
        subcategory: z.string().optional(),
        series: z.enum(SERIES_IDS).optional(),
        seriesOrder: z.number().int().positive().optional(),
        ogImage: image().or(z.string()).optional(),
        description: z.string(),
        canonicalURL: z.string().optional(),
        hideEditPost: z.boolean().optional(),
        timezone: z.string().optional(),
      })
      .superRefine((data, ctx) => {
        const needsSub = hasSubcategories(data.category);

        if (needsSub && !data.subcategory) {
          ctx.addIssue({
            code: "custom",
            path: ["subcategory"],
            message: `"${data.category}"에는 subcategory가 필요합니다.`,
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
            message: `"${data.subcategory}"는 "${data.category}"의 subcategory가 아닙니다.`,
          });
        }

        if (!needsSub && data.subcategory) {
          ctx.addIssue({
            code: "custom",
            path: ["subcategory"],
            message: `"${data.category}"는 subcategory를 갖지 않습니다.`,
          });
        }

        if (Boolean(data.series) !== Boolean(data.seriesOrder)) {
          ctx.addIssue({
            code: "custom",
            path: ["seriesOrder"],
            message: "series와 seriesOrder는 함께 지정해야 합니다.",
          });
        }
      }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
    canonicalURL: z.string().optional(),
  }),
});

export const collections = { posts, pages };
