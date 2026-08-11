import { experimental_AstroContainer as AstroContainer } from "astro/container";
import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import FeaturedProject from "@/components/about/FeaturedProject.astro";
import ProjectRow from "@/components/about/ProjectRow.astro";

const project = (
  overrides: Partial<CollectionEntry<"projects">["data"]> = {}
) =>
  ({
    id: "test-project",
    collection: "projects",
    data: {
      title: "Controlled Project",
      summary: "A controlled project summary.",
      period: "2025–2026",
      role: "Architecture and implementation",
      stack: ["Astro", "TypeScript", "CSS"],
      featured: true,
      order: 7,
      ...overrides,
    },
  }) as CollectionEntry<"projects">;

const render = async (
  Component: typeof FeaturedProject | typeof ProjectRow,
  entry = project()
) => {
  const container = await AstroContainer.create();

  return container.renderToString(Component, { props: { project: entry } });
};

const expectProjectContent = (html: string) => {
  for (const value of [
    "Controlled Project",
    "A controlled project summary.",
    "2025–2026",
    "Architecture and implementation",
    "Astro",
    "TypeScript",
    "CSS",
  ]) {
    expect(html).toContain(value);
  }
};

describe.each([
  ["featured project", FeaturedProject],
  ["compact project row", ProjectRow],
] as const)("%s", (_, Component) => {
  it("renders every project field from the collection entry", async () => {
    const html = await render(Component);

    expectProjectContent(html);
    expect(html).toMatch(/<h3\b[^>]*>Controlled Project<\/h3>/);
  });

  it("renders safe generic actions only for supplied optional URLs", async () => {
    const html = await render(
      Component,
      project({
        repository: "https://code.example.com/team/project",
        website: "https://project.example.com",
      })
    );
    const links = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];

    expect(links.map(([, , label]) => label.trim())).toEqual([
      "Repository",
      "Website",
    ]);
    for (const [, attributes] of links) {
      expect(attributes).toContain('target="_blank"');
      expect(attributes).toContain('rel="noopener noreferrer"');
    }
    expect(links[0][1]).toContain(
      'aria-label="Controlled Project 저장소 보기"'
    );
    expect(links[1][1]).toContain(
      'aria-label="Controlled Project 웹사이트 보기"'
    );
  });

  it("omits project actions when optional URLs are absent", async () => {
    expect(await render(Component)).not.toMatch(/<a\b/);
  });
});
