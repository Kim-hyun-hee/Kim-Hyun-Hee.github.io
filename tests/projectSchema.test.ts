import { projectSchema } from "@/content.config";
import { describe, expect, it } from "vitest";

const validProject = {
  title: "Test project",
  summary: "Test summary",
  period: "2026",
  role: "Developer",
  stack: ["Astro"],
  featured: false,
  order: 1,
};

describe("projects content schema", () => {
  it.each(["http://example.com", "https://example.com/path"])(
    "accepts the HTTP(S) project URL %s",
    url => {
      expect(
        projectSchema.safeParse({
          ...validProject,
          repository: url,
          website: url,
        }).success
      ).toBe(true);
    }
  );

  it.each([
    "not a URL",
    "ftp://example.com/project",
    "mailto:owner@example.com",
    "javascript:alert(1)",
  ])("rejects the non-HTTP(S) project URL %s", url => {
    expect(
      projectSchema.safeParse({
        ...validProject,
        repository: url,
        website: url,
      }).success
    ).toBe(false);
  });
});
