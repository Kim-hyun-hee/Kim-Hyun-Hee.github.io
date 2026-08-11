type RehypeNode = {
  type: string;
  name?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: RehypeNode[];
};

const wrapTables = (parent: RehypeNode, insideResponsiveTable = false) => {
  const children = parent.children;
  if (!children) return;

  const isResponsiveTable =
    insideResponsiveTable ||
    (parent.type === "mdxJsxFlowElement" && parent.name === "ResponsiveTable");

  children.forEach((child, index) => {
    if (
      !isResponsiveTable &&
      child.type === "element" &&
      child.tagName === "table"
    ) {
      children[index] = {
        type: "element",
        tagName: "div",
        properties: { "data-markdown-table": "" },
        children: [child],
      };
      return;
    }

    wrapTables(child, isResponsiveTable);
  });
};

const rehypeWrapTables = () => (tree: unknown) => {
  wrapTables(tree as RehypeNode);
};

export default rehypeWrapTables;
