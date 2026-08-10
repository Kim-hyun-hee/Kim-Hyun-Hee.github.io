import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";
import PostHeader from "../src/pages/posts/[...slug]/_components/PostHeader.astro";

vi.mock("@/config", () => ({
  default: {
    site: {
      lang: "ko",
      title: "Astro Paper",
      role: "Developer",
      timezone: "Asia/Seoul",
    },
  },
}));

const post = (category?: "project") => ({
  id: "building-this-blog/01-why-rebuild",
  data: {
    title: "Why rebuild this blog",
    pubDatetime: new Date("2026-08-10T00:00:00.000Z"),
    description: "A category-less series post.",
    tags: ["astro"],
    series: "building-this-blog",
    seriesOrder: 1,
    ...(category ? { category } : {}),
  },
});

const renderHeader = async (category?: "project") => {
  const container = await AstroContainer.create();

  return container.renderToString(PostHeader, {
    props: { post: post(category), seriesPosition: { current: 1, total: 7 } },
  });
};

describe("PostHeader category trail", () => {
  it("starts category-less series metadata with its date", async () => {
    const html = await renderHeader();
    const metadata = html.slice(0, html.indexOf("<h1"));

    expect(metadata).toMatch(/<div[^>]*>\s*<div[^>]*>\s*<time/);
    expect(metadata).not.toContain("·");
  });

  it("keeps the category separator before the date for categorized posts", async () => {
    const html = await renderHeader("project");

    expect(html).toContain("·");
    expect(html.indexOf("·")).toBeLessThan(html.indexOf("<time"));
  });
});
