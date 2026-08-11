import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join("src", "content", "posts", "_ko", "deep-dive");
const expected = [
  ["rendering", 10],
  ["architecture", 10],
  ["memory", 10],
] as const;

const field = (frontmatter: string, name: string) =>
  frontmatter.match(new RegExp(`^${name}:\\s*(.+)$`, "m"))?.[1]?.trim() ??
  "";

describe("Deep Dive test posts", () => {
  it("keeps ten visible editable fixtures in every subcategory", () => {
    const dates = new Set<string>();
    let total = 0;

    for (const [subcategory, count] of expected) {
      const directory = join(root, subcategory);
      const filenames = existsSync(directory)
        ? readdirSync(directory).filter(filename => filename.endsWith(".md"))
        : [];

      expect(filenames.sort()).toEqual(
        Array.from(
          { length: count },
          (_, index) =>
            `${String(index + 1).padStart(2, "0")}-test-${subcategory}.md`
        )
      );

      for (const filename of filenames) {
        const source = readFileSync(join(directory, filename), "utf8");
        const frontmatter =
          source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
        const body = source.replace(
          /^---\r?\n[\s\S]*?\r?\n---\r?\n?/,
          ""
        );
        const date = field(frontmatter, "pubDatetime");

        expect(field(frontmatter, "title")).toContain("[테스트]");
        expect(field(frontmatter, "description")).not.toBe("");
        expect(field(frontmatter, "category")).toBe("deep-dive");
        expect(field(frontmatter, "subcategory")).toBe(subcategory);
        expect(field(frontmatter, "draft")).toBe("false");
        expect(field(frontmatter, "tags")).toContain("테스트");
        expect(body).toContain("테스트");
        expect(date).not.toBe("");
        expect(dates.has(date), `duplicate pubDatetime: ${date}`).toBe(false);
        expect(frontmatter).not.toMatch(/^(ogImage|series|seriesOrder):/m);

        dates.add(date);
        total += 1;
      }
    }

    expect(total).toBe(30);
    expect(dates).toHaveLength(30);
  });
});
