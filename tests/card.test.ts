import { experimental_AstroContainer as AstroContainer } from "astro/container";
import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import Card from "@/components/Card.astro";

const post = (
  overrides: Partial<CollectionEntry<"posts">["data"]> = {}
) =>
  ({
    id: "controlled-post",
    collection: "posts",
    filePath: "src/content/posts/controlled-post.md",
    data: {
      title: "Controlled post",
      description: "Controlled description.",
      pubDatetime: new Date("2026-06-29T00:00:00.000Z"),
      category: "deep-dive",
      subcategory: "architecture",
      tags: ["astro"],
      draft: false,
      ...overrides,
    },
  }) as CollectionEntry<"posts">;

const renderCard = async (
  entry = post(),
  variant: "h2" | "h3" | "h4" = "h2"
) => {
  const container = await AstroContainer.create();
  return container.renderToString(Card, {
    props: { ...entry, variant },
  });
};

describe("Card", () => {
  it("links the whole thumbnail-first row and renders full compact metadata", async () => {
    const html = await renderCard();
    const row = html.match(
      /<li\b[^>]*data-post-row[^>]*>([\s\S]*?)<\/li>/
    )?.[1];

    expect(row).toBeDefined();
    expect(row!.match(/<a\b/g)).toHaveLength(1);
    expect(row).toMatch(
      /<a\b[^>]*data-post-link[^>]*>[\s\S]*data-post-thumbnail[\s\S]*<h2\b[\s\S]*data-post-meta[\s\S]*<time/
    );
    expect(row).toContain("2026.06.29");
    expect(row).toContain("Deep Dive &gt; Architecture");
    expect(row).toContain("Controlled description.");
    expect(row).toContain("data-default-post-thumbnail");
    expect(row).toContain("font-semibold");
    expect(row).not.toContain("font-bold");
    expect(row).not.toContain("hover:underline");
    expect(row).not.toMatch(/min read|minute|분 읽기/i);
  });

  it("uses a supplied image instead of the default thumbnail", async () => {
    const html = await renderCard(post({ ogImage: "/images/post.png" }));

    expect(html).toMatch(
      /<img\b(?=[^>]*data-post-thumbnail)(?=[^>]*data-post-image)(?=[^>]*src="\/images\/post\.png")(?=[^>]*alt="")/
    );
    expect(html).not.toContain("data-default-post-thumbnail");
  });

  it("falls back to the category label and omits absent taxonomy markup", async () => {
    expect(await renderCard(post({ subcategory: undefined }))).toContain(
      "Deep Dive"
    );
    expect(
      await renderCard(post({ category: undefined, subcategory: undefined }))
    ).not.toContain("data-post-taxonomy");
  });

  it("preserves every supported heading level", async () => {
    for (const heading of ["h2", "h3", "h4"] as const) {
      expect(await renderCard(post(), heading)).toMatch(
        new RegExp(`<${heading}\\b`)
      );
    }
  });
});
