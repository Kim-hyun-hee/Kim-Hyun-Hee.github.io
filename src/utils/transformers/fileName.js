/**
 * Adds the macOS frame header to every Shiki code block and, when supplied,
 * exposes its `file="..."` meta value before the code for screen readers.
 */
/** @param {{ style?: string; hideDot?: boolean }} options */
export const transformerFileName = (options = {}) => {
  void options;

  return {
    pre(node) {
      const hasFrameHeader = node.children.some(child => {
        const classNames =
          child.properties?.class ?? child.properties?.className;

        return Array.isArray(classNames)
          ? classNames.includes("code-frame-header")
          : classNames?.split(" ").includes("code-frame-header");
      });

      if (hasFrameHeader) return;

      const raw = this.options.meta?.__raw?.split(" ") ?? [];
      const metaMap = new Map();

      for (const item of raw) {
        const [key, value] = item.split("=");
        if (!key || !value) continue;
        metaMap.set(key, value.replace(/["'`]/g, ""));
      }

      const file = metaMap.get("file");
      const header = {
        type: "element",
        tagName: "span",
        properties: {
          class: ["code-frame-header"],
        },
        children: ["red", "yellow", "green"].map(color => ({
          type: "element",
          tagName: "span",
          properties: {
            class: ["code-frame-light", `code-frame-light-${color}`],
            ariaHidden: "true",
          },
          children: [],
        })),
      };

      if (file) {
        header.children.push({
          type: "element",
          tagName: "span",
          properties: { class: ["code-frame-title"] },
          children: [{ type: "text", value: file }],
        });
      }

      node.children.unshift(header);
    },
  };
};
