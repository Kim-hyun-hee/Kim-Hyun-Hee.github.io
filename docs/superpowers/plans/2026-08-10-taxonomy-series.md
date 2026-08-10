# Taxonomy and Series Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Project category with a general-purpose Series model, migrate all existing project posts without changing their URLs, and present series as smooth editorial accordions with numbered entries.

**Architecture:** A post may belong to a category, a series, both, or neither. Series identity and ordering live only in `series` and `seriesOrder`; navigation derives groups from content rather than a hard-coded Project category. Native `<details>` elements retain accessibility while a small Web Animations helper supplies reversible motion.

**Tech Stack:** Astro 7, TypeScript 6, Vitest 4, Tailwind CSS 4, Web Animations API

## Global Constraints

- All commit subjects use `type(scope): 한글 설명`.
- Preserve every existing post slug and URL.
- Do not modify the untracked `.claude/` directory.
- Do not add a JavaScript animation dependency.
- Use `Series` in navigation and `시리즈` in Korean page copy.
- Keep the deprecated `/categories/project/` URL as a permanent redirect.

---

### Task 1: Decouple series from category

**Files:**
- Modify: `src/content.config.ts`
- Modify: `src/taxonomySchema.ts`
- Modify: `src/series.ts`
- Modify: `src/utils/getPostsByCategory.ts`
- Modify: `src/utils/getSeriesPosts.ts`
- Test: `tests/getSeriesPosts.test.ts`
- Test: `tests/series.test.ts`

**Interfaces:**
- `category?: string` is optional frontmatter.
- A series post is valid when `series` and `seriesOrder` are present together.
- `getSeriesPosts(posts, seriesName)` returns posts sorted by `seriesOrder`.

- [ ] **Step 1: Make category-less series posts fail the current tests**

Update the fixtures so a valid series entry has no category:

```ts
const post = {
  id: "series-entry",
  data: { series: "Building this blog", seriesOrder: 1 },
};
```

Add assertions that this entry is accepted and ordered, and replace the old `project`-category assertions in `tests/series.test.ts` with schema invariants for paired `series`/`seriesOrder` values.

- [ ] **Step 2: Confirm the focused tests fail**

Run: `pnpm vitest run tests/getSeriesPosts.test.ts tests/series.test.ts`

Expected: FAIL because category is required and the series helper is coupled to Project.

- [ ] **Step 3: Relax and validate the schema**

In the blog collection schema, change category to optional and retain the paired series refinement:

```ts
category: z.enum(CATEGORY_IDS).optional(),
series: z.string().optional(),
seriesOrder: z.number().int().positive().optional(),
```

Remove the Project/Series coupling from `src/taxonomySchema.ts`. Run category/subcategory validation only when `data.category` exists, and report a schema error if `subcategory` exists without a category. Remove `getSeriesByCategory` and the hard-coded `category: "project"` requirement from `src/series.ts`. Make `TaxonomyPost.data.category` optional in `getPostsByCategory.ts`; its filters continue comparing explicit category values safely.

- [ ] **Step 4: Verify taxonomy unit tests**

Run: `pnpm vitest run tests/getSeriesPosts.test.ts tests/series.test.ts tests/categories.test.ts tests/resolveActiveTaxonomy.test.ts`

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts src/taxonomySchema.ts src/series.ts src/utils/getPostsByCategory.ts src/utils/getSeriesPosts.ts tests/getSeriesPosts.test.ts tests/series.test.ts
git commit -m "refactor(taxonomy): 카테고리와 시리즈의 결합을 푼다"
```

### Task 2: Migrate existing Project posts

**Files:**
- Modify: `src/content/posts/_ko/building-this-blog/*.md`
- Modify: `src/content/posts/_ko/digitaltwin/*.md`

**Interfaces:**
- Existing `series` and `seriesOrder` values remain unchanged.
- Existing filenames and directories remain unchanged.

- [ ] **Step 1: Establish the migration count**

Run: `rg -l "^category: project$" src/content/posts/_ko`

Expected: 17 files across `building-this-blog` and `digitaltwin`.

- [ ] **Step 2: Remove only the Project category line**

Delete `category: project` from all 17 files. Do not edit titles, dates, slugs, series names, or ordering.

- [ ] **Step 3: Verify the migrated corpus**

Run: `rg -n "^category: project$" src/content/posts/_ko`

Expected: no matches.

Run: `pnpm astro check && pnpm vitest run tests/getSeriesPosts.test.ts tests/series.test.ts`

Expected: all content validates and tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/content/posts/_ko/building-this-blog src/content/posts/_ko/digitaltwin
git commit -m "feat(series): 기존 프로젝트 글을 시리즈로 옮긴다"
```

### Task 3: Replace Project navigation and preserve the old URL

**Files:**
- Modify: `src/components/layout/Sidebar.astro`
- Modify: `src/i18n/lang/ko.ts`
- Modify: `src/i18n/lang/en.ts`
- Modify: `src/i18n/types.ts`
- Create: `src/pages/categories/project.astro`
- Test: `tests/routes.test.ts`
- Test: `tests/categories.test.ts`

**Interfaces:**
- Sidebar target: `/series/`.
- Legacy target: `/categories/project/` builds a static redirect document to `/series/`.

- [ ] **Step 1: Add route and navigation assertions**

Assert the built shell contains `/series/` and the visible label `Series`, contains no Project navigation item, and the legacy category output contains `/series/` as its redirect target.

- [ ] **Step 2: Confirm the assertions fail**

Run: `pnpm build && pnpm vitest run tests/routes.test.ts tests/categories.test.ts`

Expected: FAIL because the sidebar and legacy route still use Project semantics.

- [ ] **Step 3: Update navigation copy and route**

Use `Series` as the sidebar label in both languages. Remove the Project category from category definitions. Create the static compatibility route:

```astro
---
return Astro.redirect("/series/", 301);
---
```

- [ ] **Step 4: Verify routes**

Run: `pnpm build && pnpm vitest run tests/routes.test.ts tests/categories.test.ts`

Expected: all pass and `dist/categories/project/index.html` exists as the redirect output.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Sidebar.astro src/i18n/lang/ko.ts src/i18n/lang/en.ts src/i18n/types.ts src/categories.ts src/pages/categories/project.astro tests/routes.test.ts tests/categories.test.ts
git commit -m "feat(categories): 프로젝트 분류를 시리즈로 전환한다"
```

### Task 4: Build the accessible animated series accordion

**Files:**
- Create: `src/scripts/seriesAccordion.ts`
- Modify: `src/pages/series/index.astro`
- Modify: `src/pages/series/[slug].astro`
- Modify: `src/components/home/HomeSeries.astro`
- Modify: `src/components/related/SeriesPosts.astro`
- Modify: `src/components/series/SeriesBadge.astro`
- Test: `tests/routes.test.ts`

**Interfaces:**
- Markup uses native `<details data-series-accordion>` and `<summary>`.
- Entry numbers render as zero-padded `01`, `02`, and so on.
- Open animation: 240 ms; close animation: 210 ms.
- `prefers-reduced-motion: reduce` skips animation.

- [ ] **Step 1: Add built-markup assertions**

Assert the Series page contains `data-series-accordion`, native `details`/`summary`, and the first numbered entry `01`. Assert the chevron has no filled background class.

- [ ] **Step 2: Confirm the route assertion fails**

Run: `pnpm build && pnpm vitest run tests/routes.test.ts -t "시리즈"`

Expected: FAIL because the current list is not the approved accordion.

- [ ] **Step 3: Implement reversible native-details animation**

Export `initSeriesAccordions(): () => void`. For each accordion, intercept summary clicks, cancel an active animation before starting the reverse direction, animate the content block height and opacity, and set `details.open = false` only after the close animation finishes. Register all listeners through one `AbortController` and return cleanup.

Use:

```ts
const duration = opening ? 240 : 210;
const easing = "cubic-bezier(0.2, 0, 0, 1)";
```

When reduced motion matches, toggle `open` synchronously.

- [ ] **Step 4: Apply the editorial series presentation**

Render the series title and metadata in the summary. Render posts beneath it with accent-colored zero-padded numbers. Rotate and recolor the chevron on open, but keep its background transparent in both states. Reuse the same series-entry visual language in the home and related-series components.

- [ ] **Step 5: Verify behavior and accessibility**

Run: `pnpm lint && pnpm astro check && pnpm test && pnpm build`

Expected: all pass.

Manually click an accordion repeatedly while it is moving. Confirm it reverses without jumping, closes softly, remains keyboard-operable, and does not animate under reduced-motion emulation.

- [ ] **Step 6: Commit**

```bash
git add src/scripts/seriesAccordion.ts src/pages/series src/components/home/HomeSeries.astro src/components/related/SeriesPosts.astro src/components/series/SeriesBadge.astro tests/routes.test.ts
git commit -m "feat(series): 번호가 있는 아코디언 목록을 만든다"
```

### Task 5: Series gate

**Files:** none

- [ ] **Step 1: Run the complete series gate**

Run: `pnpm format:check && pnpm lint && pnpm test && pnpm build`

Expected: all commands exit 0; existing post URLs still build; `/categories/project/` redirects to `/series/`.
