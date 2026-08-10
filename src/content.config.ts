import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import config from "@/config";
// [CUSTOM] 업스트림에 없는 import. 분류 필드와 교차 검증은 전부
// src/taxonomySchema.ts 에 있습니다.
import { taxonomyFields, validateTaxonomy } from "@/taxonomySchema";

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
        // [CUSTOM] category / subcategory / series / seriesOrder 네 필드.
        ...taxonomyFields,
        ogImage: image().or(z.string()).optional(),
        description: z.string(),
        canonicalURL: z.string().optional(),
        timezone: z.string().optional(),
      })
      // [CUSTOM] 필드 간 교차 검증. 규칙 본문은 taxonomySchema.ts 참고.
      .superRefine(validateTaxonomy),
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

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string().min(1),
    summary: z.string().min(1),
    period: z.string().min(1),
    role: z.string().min(1),
    stack: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    repository: z.url().optional(),
    website: z.url().optional(),
    order: z.number().int().nonnegative(),
  }),
});

export const collections = { posts, pages, projects };
