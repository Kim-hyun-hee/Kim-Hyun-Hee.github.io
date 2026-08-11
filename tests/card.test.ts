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

const renderCard = async (entry = post()) => {
  const container = await AstroContainer.create();
  return container.renderToString(Card, { props: entry });
};

describe("Card", () => {
  it("renders one compact date, title, most-specific taxonomy, and description in order", async () => {
    const html = await renderCard();

    expect(html).toMatch(
      /<time\b[^>]*datetime="[^"]+"[^>]*>\s*2026\.06\.29\s*<\/time>/
    );
    expect(html.match(/<time\b/g)).toHaveLength(1);
    expect(html.match(/Controlled post/g)).toHaveLength(1);
    expect(html.match(/data-post-taxonomy/g)).toHaveLength(1);
    expect(html).toContain("Architecture");
    expect(html).not.toContain("Deep Dive");
    expect(html.match(/Controlled description\./g)).toHaveLength(1);

    const date = html.indexOf("<time");
    const title = html.indexOf("Controlled post");
    const taxonomy = html.indexOf("data-post-taxonomy");
    const description = html.indexOf("Controlled description.");

    expect(date).toBeGreaterThanOrEqual(0);
    expect(title).toBeGreaterThan(date);
    expect(taxonomy).toBeGreaterThan(title);
    expect(description).toBeGreaterThan(taxonomy);
    expect(html).not.toMatch(/min read|minute|분 읽기/i);
  });

  it("falls back to the category label and omits absent taxonomy markup", async () => {
    expect(await renderCard(post({ subcategory: undefined }))).toContain(
      "Deep Dive"
    );
    expect(
      await renderCard(post({ category: undefined, subcategory: undefined }))
    ).not.toContain("data-post-taxonomy");
  });

  it("exposes the approved full-width ruled row recipe", async () => {
    const html = await renderCard();

    expect(html).toContain("border-b-border");
    expect(html).toContain("first:border-t-accent");
    expect(html).toContain("py-[15px]");
    expect(html).toContain("sm:grid-cols-[4.875rem_minmax(0,1fr)]");
    expect(html).toContain("sm:gap-[13px]");
    expect(html).toContain(
      "hover:bg-[linear-gradient(90deg,var(--accent-muted),transparent)]"
    );
  });

  it("uses the approved compact editorial typography hierarchy", async () => {
    const html = await renderCard();
    const dateWrapper = html.match(/<div\b([^>]*)>\s*<time\b/)?.[1];
    const date = html.match(/<time\b([^>]*)>/)?.[1];
    const title = html.match(/<a\b([^>]*)>\s*<h2>/)?.[1];
    const taxonomy = html.match(/<p\b([^>]*data-post-taxonomy[^>]*)>/)?.[1];
    const description = html.match(
      /<p\b([^>]*)>Controlled description\.<\/p>/
    )?.[1];

    expect(dateWrapper).toContain("sm:mt-0.5");
    expect(date).toContain("text-[11px]");
    expect(date).toContain("leading-[1.45]");
    expect(date).toContain("font-medium");
    expect(title).toContain("text-base");
    expect(title).toContain("leading-[1.35]");
    expect(title).toContain("font-[750]");
    expect(taxonomy).toContain("text-[11px]");
    expect(taxonomy).toContain("leading-[1.45]");
    expect(taxonomy).toContain("font-bold");
    expect(description).toContain("text-[13px]");
    expect(description).toContain("leading-[1.55]");
  });
});
