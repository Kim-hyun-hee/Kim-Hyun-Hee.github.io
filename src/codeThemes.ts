type RawTheme = {
  name: string;
  type: "light" | "dark";
  colors: Record<string, string>;
  settings: Array<{
    scope?: string | string[];
    settings: { background?: string; foreground?: string };
  }>;
};

export const horizonLight: RawTheme = {
  name: "horizon-b-light",
  type: "light",
  colors: {
    "editor.background": "#fafafa",
    "editor.foreground": "#36373d",
  },
  settings: [
    { settings: { background: "#fafafa", foreground: "#36373d" } },
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#767277" },
    },
    {
      scope: ["entity.name.tag", "meta.tag", "punctuation.definition.tag"],
      settings: { foreground: "#666369" },
    },
    {
      scope: ["variable", "variable.language"],
      settings: { foreground: "#c72f4c" },
    },
    {
      scope: ["entity.other.attribute-name", "constant.numeric"],
      settings: { foreground: "#b65345" },
    },
    {
      scope: [
        "entity.name.class",
        "entity.name.type.class",
        "entity.name.type",
      ],
      settings: { foreground: "#986039" },
    },
    { scope: "string", settings: { foreground: "#a94d32" } },
    {
      scope: ["support.class", "support.constant", "string.regexp"],
      settings: { foreground: "#147985" },
    },
    {
      scope: ["entity.name.function", "support.function"],
      settings: { foreground: "#3f75a9" },
    },
    {
      scope: ["keyword", "storage.type", "storage.modifier"],
      settings: { foreground: "#8249a0" },
    },
    {
      scope: [
        "meta.preprocessor",
        "meta.directive",
        "keyword.control.directive",
      ],
      settings: { foreground: "#a65b39" },
    },
    {
      scope: ["punctuation", "keyword.operator"],
      settings: { foreground: "#36373d" },
    },
  ],
};

export const horizonDark: RawTheme = {
  name: "horizon-b-dark",
  type: "dark",
  colors: {
    "editor.background": "#1f1f20",
    "editor.foreground": "#cbced0",
  },
  settings: [
    { settings: { background: "#1f1f20", foreground: "#cbced0" } },
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#6f6f70" },
    },
    {
      scope: ["entity.name.tag", "meta.tag", "punctuation.definition.tag"],
      settings: { foreground: "#9da0a2" },
    },
    {
      scope: ["variable", "variable.language"],
      settings: { foreground: "#e93c58" },
    },
    {
      scope: ["entity.other.attribute-name", "constant.numeric"],
      settings: { foreground: "#e58d7d" },
    },
    {
      scope: [
        "entity.name.class",
        "entity.name.type.class",
        "entity.name.type",
      ],
      settings: { foreground: "#efb993" },
    },
    { scope: "string", settings: { foreground: "#efaf8e" } },
    {
      scope: ["support.class", "support.constant", "string.regexp"],
      settings: { foreground: "#24a8b4" },
    },
    {
      scope: ["entity.name.function", "support.function"],
      settings: { foreground: "#8fb4dd" },
    },
    {
      scope: ["keyword", "storage.type", "storage.modifier"],
      settings: { foreground: "#b072d1" },
    },
    {
      scope: [
        "meta.preprocessor",
        "meta.directive",
        "keyword.control.directive",
      ],
      settings: { foreground: "#e4a382" },
    },
    {
      scope: ["punctuation", "keyword.operator"],
      settings: { foreground: "#cbced0" },
    },
  ],
};
