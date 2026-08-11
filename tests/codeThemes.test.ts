import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { horizonDark, horizonLight } from "../src/codeThemes";

type Theme = {
  settings: Array<{
    scope?: string | string[];
    settings: { foreground?: string };
  }>;
};

const foregroundFor = (theme: Theme, scope: string) =>
  theme.settings.find(setting =>
    (Array.isArray(setting.scope) ? setting.scope : [setting.scope]).includes(
      scope
    )
  )?.settings.foreground;

describe("Horizon B Shiki themes", () => {
  it("assigns every approved syntax role to its light and dark palette", () => {
    const roles = [
      ["comment", "#767277", "#6f6f70"],
      ["entity.name.tag", "#666369", "#9da0a2"],
      ["variable", "#c72f4c", "#e93c58"],
      ["entity.other.attribute-name", "#b65345", "#e58d7d"],
      ["constant.numeric", "#b65345", "#e58d7d"],
      ["entity.name.class", "#986039", "#efb993"],
      ["string", "#a94d32", "#efaf8e"],
      ["support.class", "#147985", "#24a8b4"],
      ["string.regexp", "#147985", "#24a8b4"],
      ["entity.name.function", "#3f75a9", "#8fb4dd"],
      ["support.function", "#3f75a9", "#8fb4dd"],
      ["keyword", "#8249a0", "#b072d1"],
      ["storage.type", "#8249a0", "#b072d1"],
      ["meta", "#a65b39", "#e4a382"],
    ] as const;

    expect(horizonLight.name).toBe("horizon-b-light");
    expect(horizonDark.name).toBe("horizon-b-dark");
    expect(horizonLight.colors).toMatchObject({
      "editor.background": "#fbfafb",
      "editor.foreground": "#36373d",
    });
    expect(horizonDark.colors).toMatchObject({
      "editor.background": "#1c1e26",
      "editor.foreground": "#cbced0",
    });

    for (const [scope, light, dark] of roles) {
      expect(foregroundFor(horizonLight, scope)).toBe(light);
      expect(foregroundFor(horizonDark, scope)).toBe(dark);
    }
  });

  it("emits the Horizon backgrounds, foregrounds, and function colors in built code", () => {
    const html = readFileSync(
      join(
        "dist",
        "posts",
        "adding-new-posts-in-astropaper-theme",
        "index.html"
      ),
      "utf-8"
    ).toLowerCase();

    for (const color of [
      "--shiki-light:#36373d",
      "--shiki-dark:#cbced0",
      "--shiki-light-bg:#fbfafb",
      "--shiki-dark-bg:#1c1e26",
      "--shiki-light:#3f75a9",
      "--shiki-dark:#8fb4dd",
    ]) {
      expect(html).toContain(color);
    }
  });
});
