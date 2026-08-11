import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
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

const blockFor = (html: string, language: string) =>
  html.match(
    new RegExp(
      `<pre\\b(?=[^>]*data-language="${language}")[\\s\\S]*?<\\/pre>`
    )
  )?.[0] ?? "";

const textForColors = (html: string, light: string, dark: string) =>
  [...html.matchAll(/<span style="([^"]+)">([^<]*)<\/span>/g)]
    .filter(
      ([, style]) =>
        style.includes(`--shiki-light:${light}`) &&
        style.includes(`--shiki-dark:${dark}`)
    )
    .map(([, , text]) => text)
    .join("");

const scopesForColor = (theme: Theme, foreground: string) =>
  theme.settings
    .filter(setting => setting.settings.foreground === foreground)
    .flatMap(setting =>
      Array.isArray(setting.scope) ? setting.scope : [setting.scope]
    );

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
      ["meta.preprocessor", "#a65b39", "#e4a382"],
      ["meta.directive", "#a65b39", "#e4a382"],
      ["keyword.control.directive", "#a65b39", "#e4a382"],
      ["punctuation", "#36373d", "#cbced0"],
      ["keyword.operator", "#36373d", "#cbced0"],
    ] as const;

    expect(horizonLight.name).toBe("horizon-b-light");
    expect(horizonDark.name).toBe("horizon-b-dark");
    expect(horizonLight.colors).toMatchObject({
      "editor.background": "#fafafa",
      "editor.foreground": "#36373d",
    });
    expect(horizonLight.settings[0]?.settings.background).toBe("#fafafa");
    expect(horizonDark.colors).toMatchObject({
      "editor.background": "#1f1f20",
      "editor.foreground": "#cbced0",
    });
    expect(horizonDark.settings[0]?.settings.background).toBe("#1f1f20");

    for (const [scope, light, dark] of roles) {
      expect(foregroundFor(horizonLight, scope)).toBe(light);
      expect(foregroundFor(horizonDark, scope)).toBe(dark);
    }

    expect(foregroundFor(horizonLight, "meta")).toBeUndefined();
    expect(foregroundFor(horizonDark, "meta")).toBeUndefined();
    expect(scopesForColor(horizonLight, "#a65b39")).toEqual([
      "meta.preprocessor",
      "meta.directive",
      "keyword.control.directive",
    ]);
    expect(scopesForColor(horizonDark, "#e4a382")).toEqual([
      "meta.preprocessor",
      "meta.directive",
      "keyword.control.directive",
    ]);
  });

  it("keeps punctuation and prose neutral while coloring real directives", async () => {
    const processor = await createMarkdownProcessor({
      shikiConfig: {
        themes: { light: horizonLight, dark: horizonDark },
        defaultColor: false,
      },
    });
    const { code } = await processor.render(`\
\`\`\`ts
const result = foo(a, b).bar;
\`\`\`

\`\`\`cpp
#include <stdio.h>
\`\`\`

\`\`\`css
@apply max-w-4xl;
\`\`\`

\`\`\`md
Plain prose, with punctuation.
\`\`\``);
    const html = code.toLowerCase();
    const foreground = ["#36373d", "#cbced0"] as const;
    const orange = ["#a65b39", "#e4a382"] as const;

    const typescriptForeground = textForColors(
      blockFor(html, "ts"),
      ...foreground
    );
    for (const punctuation of ["=", "(", ",", ")", "."]) {
      expect(typescriptForeground).toContain(punctuation);
    }

    expect(textForColors(blockFor(html, "cpp"), ...orange)).toContain(
      "include"
    );
    expect(textForColors(blockFor(html, "css"), ...foreground)).toContain(
      "max-w-4xl;"
    );
    expect(textForColors(blockFor(html, "md"), ...foreground)).toContain(
      "plain prose, with punctuation."
    );
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
      "--shiki-light-bg:#fafafa",
      "--shiki-dark-bg:#1f1f20",
      "--shiki-light:#3f75a9",
      "--shiki-dark:#8fb4dd",
    ]) {
      expect(html).toContain(color);
    }
  });
});
