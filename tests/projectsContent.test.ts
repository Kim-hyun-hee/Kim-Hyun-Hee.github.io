import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectsDirectory = fileURLToPath(
  new URL("../src/content/projects/", import.meta.url)
);

const field = (frontmatter: string, name: string) =>
  frontmatter.match(new RegExp(`^${name}:\\s*(.+)$`, "m"))?.[1]?.trim() ?? "";

const readProject = async (filename: string) => {
  const source = await readFile(new URL(filename, `file://${projectsDirectory}/`), "utf8");
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
  const stack = frontmatter
    .match(/^stack:\s*\r?\n((?:\s+- .+\r?\n?)*)/m)?.[1]
    .match(/^\s+-\s+(.+)$/gm) ?? [];

  return {
    filename,
    title: field(frontmatter, "title"),
    summary: field(frontmatter, "summary"),
    period: field(frontmatter, "period"),
    role: field(frontmatter, "role"),
    order: Number(field(frontmatter, "order")),
    featured: field(frontmatter, "featured") === "true",
    stack,
    hasOptionalUrl: /^(repository|website):/m.test(frontmatter),
  };
};

describe("sample project content", () => {
  it("keeps ten complete editable samples in their intended featured order", async () => {
    const filenames = (await readdir(projectsDirectory)).filter(filename =>
      filename.endsWith(".md")
    );
    const projects = await Promise.all(filenames.map(readProject));
    const orders = projects.map(project => project.order).sort((a, b) => a - b);

    expect(projects).toHaveLength(10);
    expect(filenames.sort()).toEqual([
      "01-dod-digital-twin.md",
      "02-astropaper-fork.md",
      "03-ndt-defect-classifier.md",
      "04-agv-route-simulator.md",
      "05-equipment-dashboard.md",
      "06-sensor-data-pipeline.md",
      "07-factory-alert-console.md",
      "08-model-optimizer.md",
      "09-log-analysis-toolkit.md",
      "10-portfolio-data-model.md",
    ]);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(new Set(orders)).toHaveLength(10);
    expect(projects.filter(project => project.featured)).toHaveLength(4);
    expect(
      projects
        .filter(project => project.featured)
        .map(project => project.order)
        .sort((a, b) => a - b)
    ).toEqual([1, 2, 3, 4]);

    for (const project of projects) {
      expect(project.title).not.toBe("");
      expect(project.summary).not.toBe("");
      expect(project.period).not.toBe("");
      expect(project.role).not.toBe("");
      expect(project.stack.length).toBeGreaterThan(0);
      expect(project.hasOptionalUrl).toBe(false);
    }
  });
});
