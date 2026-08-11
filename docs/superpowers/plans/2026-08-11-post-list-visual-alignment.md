# Post List Visual Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match every shared post-list row to the approved `A · Full-width rules` design with `YYYY.MM.DD` dates, taxonomy-only metadata, compact typography, and the original ruled hover treatment.

**Architecture:** Keep `Card.astro` as the single shared row and add only a compact display option to `Datetime.astro`, whose default post-header format remains unchanged. Derive the optional display label directly from the existing taxonomy registry; do not add reading-time logic, schema fields, or a new component abstraction.

**Tech Stack:** Astro 7, TypeScript 6, Tailwind CSS 4, Day.js, Vitest 4

## Global Constraints

- Preserve Series, About projects, Pagination, All posts, Archives hierarchy, Markdown, Callouts, and code-block designs.
- Preserve semantic list items, title links, heading variants, ISO `<time datetime>`, routing, ordering, and focus-visible behavior.
- Visible list date is exactly `YYYY.MM.DD`; post-header date keeps its existing format.
- Show no reading time.
- Show at most one taxonomy label: subcategory label first, otherwise category label, otherwise no metadata row.
- Use the existing `CATEGORIES` and `getSubcategoryLabel` registry APIs; do not duplicate labels or add frontmatter.
- Keep the implementation within `Card.astro`, `Datetime.astro`, and focused tests unless a failing verification proves another file is required.
- All commit subjects use `type(scope): 한글 설명`.
- Do not modify the untracked `.claude/` directory.

---

### Task 1: Restore the approved shared post-row details

**Files:**
- Modify: `src/components/Card.astro`
- Modify: `src/components/Datetime.astro`
- Create: `tests/card.test.ts`
- Modify: `tests/routes.test.ts`

**Interfaces:**
- `Datetime.astro` accepts `format?: "long" | "compact"`; default is `"long"` and `"compact"` renders `YYYY.MM.DD`.
- `Card.astro` passes `format="compact"` and derives `taxonomyLabel?: string` from `data.category` and `data.subcategory`.
- `Card.astro` remains compatible with `variant?: "h2" | "h3" | "h4"` and `CollectionEntry<"posts">`.

- [ ] **Step 1: Add controlled component tests for date and taxonomy behavior**

Create `tests/card.test.ts` with an AstroContainer fixture:

```ts
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import Card from "@/components/Card.astro";

const post = (
  overrides: Partial<CollectionEntry<"posts">["data"]> = {}
) =>
  ({
    id: "controlled-post",
    collection: "posts",
    filePath: "src/content/posts/controlled-post.md",
    data: {
      title: "Controlled post",
      description: "Controlled description.",
      pubDatetime: new Date("2026-06-29T00:00:00.000Z"),
      category: "deep-dive",
      subcategory: "architecture",
      tags: ["astro"],
      draft: false,
      ...overrides,
    },
  }) as CollectionEntry<"posts">;

const renderCard = async (entry = post()) => {
  const container = await AstroContainer.create();
  return container.renderToString(Card, { props: entry });
};
```

Add tests that assert:

```ts
expect(await renderCard()).toMatch(
  /<time\b[^>]*datetime="[^"]+"[^>]*>\s*2026\.06\.29\s*<\/time>/
);
expect(await renderCard()).toContain("Architecture");
expect(await renderCard(post({ subcategory: undefined }))).toContain(
  "Deep Dive"
);
expect(
  await renderCard(
    post({ category: undefined, subcategory: undefined })
  )
).not.toContain("data-post-taxonomy");
```

Also assert the rendered row contains exactly one date, title, optional taxonomy, and description in that order; contains no `min read`, `minute`, or `분`; and exposes the approved visual hooks/classes for the accent top rule, neutral bottom rule, 15 px padding, 78 px date column, 13 px gap, and left-to-right token gradient.

- [ ] **Step 2: Run the focused tests and observe RED**

Run:

```powershell
npm.cmd exec -- vitest run tests/card.test.ts
```

Expected: FAIL because `Datetime` has no compact format, `Card` emits no taxonomy metadata, and current row classes use 20 px padding and a 120 px date column.

- [ ] **Step 3: Add the compact Datetime format without changing its default**

Update the props and display selection in `src/components/Datetime.astro`:

```ts
type Props = {
  class?: string;
  pubDatetime: string | Date;
  timezone?: string;
  format?: "long" | "compact";
};

const {
  pubDatetime,
  class: className = "",
  timezone: postTimezone,
  format = "long",
} = Astro.props;

const date =
  format === "compact"
    ? datetime.format("YYYY.MM.DD")
    : datetime.format("YYYY년 M월 D일");
```

Do not change the ISO `datetime` attribute or the post-header caller.

- [ ] **Step 4: Derive one taxonomy label in Card**

Import the existing registry in `src/components/Card.astro`:

```ts
import { CATEGORIES, getSubcategoryLabel } from "@/categories";
```

Derive the label without a helper file:

```ts
const taxonomyLabel = data.category
  ? (data.subcategory &&
      getSubcategoryLabel(data.category, data.subcategory)) ||
    CATEGORIES[data.category].label
  : undefined;
```

Render it between the title and description only when defined:

```astro
{taxonomyLabel && (
  <p data-post-taxonomy class="text-accent mt-0.5 text-[11px] font-bold leading-[1.45]">
    {taxonomyLabel}
  </p>
)}
```

- [ ] **Step 5: Apply the approved row recipe**

Use these values in `Card.astro`:

```astro
<li
  data-post-row
  class:list={[
    "grid border-b border-b-border py-[15px]",
    "first:border-t first:border-t-accent",
    "hover:bg-[linear-gradient(90deg,var(--accent-muted),transparent)]",
    "sm:grid-cols-[4.875rem_minmax(0,1fr)] sm:gap-[13px]",
  ]}
>
  <Datetime {...props} format="compact" class="mb-1 sm:mb-0" />
```

Apply the selected typography while retaining the title link and focus rules:

```astro
class="text-foreground decoration-accent inline-block text-base font-[750] leading-[1.35] underline-offset-4 hover:underline focus-visible:no-underline focus-visible:underline-offset-0"
```

Use the existing `Datetime` muted foreground plus Card-scoped compact classes, and style the description as:

```astro
<p class="text-foreground/80 mt-1 text-[13px] leading-[1.55]">{description}</p>
```

Do not add a row-wide link, card surface, shadow, reading time, or JavaScript.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run:

```powershell
npm.cmd exec -- vitest run tests/card.test.ts tests/routes.test.ts -t "post row|ruled post rows"
```

Expected: PASS. Confirm the existing post-header date test/output remains the long Korean format.

- [ ] **Step 7: Build and verify every shared consumer**

Run:

```powershell
npm.cmd run build
npm.cmd exec -- vitest run tests/routes.test.ts -t "ruled post rows|Archives"
```

In `tests/routes.test.ts`, dynamically select non-empty built outputs for home, posts, a tag, a direct category, a subcategory, and Archives. Assert every `data-post-row` has:

1. `<time>` with visible `\d{4}\.\d{2}\.\d{2}` before the heading;
2. zero reading-time text;
3. at most one `data-post-taxonomy` before the description;
4. a valid post link and the existing heading level for that consumer.

Expected: all selected outputs pass without hard-coded category or post titles.

- [ ] **Step 8: Run the full gate**

Run:

```powershell
npm.cmd run format:check
npm.cmd run lint
npm.cmd test
npm.cmd run astro -- check
npm.cmd run build
git diff --check
```

Expected: all commands exit 0. The known static `/categories/project/` Pagefind redirect warning may remain; no new warnings are accepted.

- [ ] **Step 9: Commit**

```powershell
git add src/components/Card.astro src/components/Datetime.astro tests/card.test.ts tests/routes.test.ts
git commit -m "style(lists): 글 목록을 원본 편집형 시안에 맞춘다"
```

---

### Task 2: Visual and architectural gate

**Files:** none

**Interfaces:**
- Consumes the shared `Card.astro` and `Datetime.astro` contracts from Task 1.
- Produces no new runtime interface.

- [ ] **Step 1: Audit generated HTML and CSS**

After a clean production build, count shared list rows and verify there is exactly one compact date and no reading-time copy per row. Inspect generated CSS for the `YYYY.MM.DD` row recipe, accent top rule, neutral bottom rule, 15 px padding, 78 px/13 px desktop grid, and theme-token gradient.

- [ ] **Step 2: Compare at desktop and 320 px**

Compare home, posts, direct-category, subcategory, tag, and Archives pages against the approved visual screen. Confirm date alignment, title/meta/description hierarchy, gradient hover, and mobile stacking. If browser automation is unavailable, record the limitation and use generated HTML/CSS plus viewport-width calculations.

- [ ] **Step 3: Run the complete verification gate once more**

Run:

```powershell
npm.cmd run format:check
npm.cmd run lint
npm.cmd test
npm.cmd run astro -- check
npm.cmd run build
git diff --check
git status --short
```

Expected: all commands pass and the worktree is clean after the Task 1 commit.

