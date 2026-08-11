# Code, Lists, Series, and Archives Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the code-frame structure and deliver one thumbnail-based post row across general lists and Archives, with dated Series lists and 30 visible Deep Dive test posts.

**Architecture:** Keep Shiki and the existing lifecycle module, but make the code header and language footer normal-flow siblings of the scrollport. Keep `Card.astro` as the single general-list boundary, add one theme-aware fallback thumbnail component, and let Series retain its numbered custom rows. Content fixtures remain ordinary Markdown so the production loader, pagination, and routes exercise them.

**Tech Stack:** Astro 7, TypeScript 6, Tailwind CSS 4, Shiki, Vitest 4, AstroContainer

## Global Constraints

- Use the approved C layout: left 4:3 thumbnail, right title/meta/description.
- General-list metadata is `YYYY.MM.DD · Category > Subcategory`; omit unavailable parts and never show reading time.
- A whole post row is one anchor; title hover underline is removed; hover/focus keep the accent-muted gradient.
- Default thumbnail text is `Dev groot.` with light purple `#8387d3` and dark salmon `#e58d7d` punctuation.
- Code light surface stays `#fafafa`; code dark body becomes `#1f1f20` and header `#272729`.
- Light scrollbar stops are `#3a9da5`, `#a97ac0`, `#dd6577`, `#d39a78`.
- Dark scrollbar stops are `#24a8b4`, `#b072d1`, `#e93c58`, `#efb993`.
- Code language uses `#8387d3` in light mode and `#e58d7d` in dark mode.
- Preserve code copy/focus cleanup, syntax foreground roles, diff/highlight states, no line numbers, Series native details and animation, Pagination, About, and Sidebar structure.
- Add exactly 10 visible test posts to each Deep Dive subcategory without modifying the existing three Rendering posts.
- Use Korean conventional commit subjects and do not modify `.claude/`.

---

### Task 1: Correct the code-frame ownership and surfaces

**Files:**
- Modify: `src/utils/transformers/fileName.js`
- Modify: `src/scripts/postInteractions.ts`
- Modify: `src/codeThemes.ts`
- Modify: `src/styles/typography.css`
- Modify: `tests/postInteractions.test.ts`
- Modify: `tests/codeThemes.test.ts`
- Modify: `tests/routes.test.ts`

**Interfaces:**
- Consumes: Shiki `pre.astro-code[data-language] > .code-frame-header + code`.
- Produces: `.code-frame-header` containing three decorative lights, optional `.code-frame-title`, and one runtime `.copy-code`; direct-child `code` remains the only scrollport.
- Keeps: `initPostInteractions(): () => void`, `horizonLight`, and `horizonDark` export names.

- [ ] **Step 1: Write failing component, lifecycle, theme, and built-output tests**

In `tests/postInteractions.test.ts`, extend the fake selector support for `.code-frame-header`, make `appendCodeBlock()` include a header, and assert the real lifecycle behavior:

```ts
const header = fakeDocument.createElement("span");
header.className = "code-frame-header";
codeBlock.append(header, code);

initPostInteractions();
const copyButton = codeBlock.querySelector(".copy-code")!;
expect(copyButton.parentNode).toBe(header);
expect(copyButton.className).not.toMatch(/absolute|top-/);
expect(codeBlock.parentNode).toBe(article);
```

Keep the existing duplicate-button, clipboard, pending-write, scrollport-label, re-init, and cleanup assertions.

In `tests/codeThemes.test.ts`, change both dark background assertions to `#1f1f20` and keep all foreground role expectations unchanged:

```ts
expect(horizonDark.colors["editor.background"]).toBe("#1f1f20");
expect(horizonDark.settings[0]?.settings.background).toBe("#1f1f20");
```

In the `code blocks` section of `tests/routes.test.ts`, assert the generated CSS/HTML contract:

```ts
expect(css).toMatch(/\.code-frame-header\{(?=[^}]*height:38px)(?=[^}]*position:relative)/);
expect(css).toMatch(/\.astro-code>code\{(?=[^}]*max-height:550px)(?=[^}]*padding:11px 13px 8px)(?=[^}]*overflow:auto)/);
expect(css).not.toMatch(/\.astro-code>code\{[^}]*margin-bottom:/);
expect(css).toMatch(/::-webkit-scrollbar-button\{[^}]*display:none/);
expect(css).toMatch(/::-webkit-scrollbar-track[^}]*background[^}]*transparent/);
expect(css).toMatch(/::-webkit-scrollbar-corner[^}]*background[^}]*transparent/);
expect(css).toMatch(/\.astro-code:after\{(?=[^}]*height:23px)(?=[^}]*color:#8387d3)/);
expect(css).toMatch(/html\[data-theme=dark\] \.astro-code:after\{[^}]*color:#e58d7d/);
```

Retain assertions for one header, three lights, filename/no-filename frames, data-language, axis-specific gradients, line hover, no counters, and runtime assets.

- [ ] **Step 2: Run focused tests and observe RED**

Run, stopping after each non-zero exit:

```powershell
npm.cmd exec -- vitest run tests/postInteractions.test.ts -t "copy|scrollport"
npm.cmd exec -- vitest run tests/codeThemes.test.ts
npm.cmd run build
npm.cmd exec -- vitest run tests/routes.test.ts -t "code blocks"
```

Expected: lifecycle fails because Copy is appended to the `pre` with absolute classes; theme fails on `#1c1e26`; built CSS fails on the overlay header, missing scrollbar-button rule, old spacing, and old language colors.

- [ ] **Step 3: Put the Copy button in the real header**

In `transformerFileName`, remove `--file-name-offset`, file-dependent margin classes, and header-level `ariaHidden`. Always emit the header before `code`; keep each light `ariaHidden: "true"` and append the optional title as the fourth transformer child.

In `setupCodeCopy()`, replace wrapper/offset creation with:

```ts
const header = codeBlock.querySelector<HTMLElement>(".code-frame-header");
if (!header) continue;

copyButton = document.createElement("button");
copyButton.className =
  "copy-code ms-auto shrink-0 rounded border px-2 py-1 text-[10px] leading-none font-medium";
copyButton.innerHTML = copyButtonLabel;
header.appendChild(copyButton);
```

Do not add a new wrapper and do not change the existing event/timer/attribute cleanup logic.

- [ ] **Step 4: Apply the normal-flow frame and final palettes**

Change the two dark backgrounds in `src/codeThemes.ts` to `#1f1f20` only.

In `typography.css`:

```css
.code-frame-header {
  position: relative;
  display: flex;
  align-items: center;
  height: 38px;
  padding-inline: 13px 10px;
  gap: 7px;
}

.astro-code > code {
  display: block;
  max-height: 550px;
  padding: 11px 13px 8px;
  overflow: auto;
}

.astro-code::after {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 23px;
  padding-inline: 10px;
  color: #8387d3;
  content: attr(data-language);
}
```

Set the approved light/dark surfaces and line hovers. Remove absolute title/copy offsets; make `.code-frame-title` a normal flex child with `min-width: 0`, ellipsis, and 11px text. Give `.copy-code` pointer events and theme-appropriate neutral surfaces.

Add 15px scrollbar axes, hidden buttons, transparent track/corner, 4px surface-colored thumb border, 10px radius, the exact light/dark gradient stops, and `scrollbar-color` fallbacks. Keep diff/highlight selectors after the base line-hover rule.

- [ ] **Step 5: Verify GREEN and commit**

Run:

```powershell
npm.cmd exec -- vitest run tests/postInteractions.test.ts
npm.cmd exec -- vitest run tests/codeThemes.test.ts
npm.cmd run build
npm.cmd exec -- vitest run tests/routes.test.ts -t "code blocks"
npm.cmd run format:check
npm.cmd run lint
npm.cmd run astro -- check
```

Expected: all pass; every built code block has one header, three lights, one data-language, one runtime Copy button after page-load, and no line-number markup.

Commit:

```powershell
git add src/utils/transformers/fileName.js src/scripts/postInteractions.ts src/codeThemes.ts src/styles/typography.css tests/postInteractions.test.ts tests/codeThemes.test.ts tests/routes.test.ts
git commit -m "fix(code): 코드 프레임 정렬과 스크롤바를 바로잡는다"
```

---

### Task 2: Replace the general Card with the approved C layout

**Files:**
- Create: `src/components/DefaultPostThumbnail.astro`
- Modify: `src/components/Card.astro`
- Modify: `tests/card.test.ts`
- Modify: `tests/routes.test.ts`

**Interfaces:**
- Consumes: `CollectionEntry<"posts">`, `data.ogImage`, `Datetime format="compact"`, `getPostUrl()`, `CATEGORIES`, and `getSubcategoryLabel()`.
- Produces: one `li[data-post-row]` with one full-row post anchor, `[data-post-thumbnail]`, optional `[data-post-image]`, `[data-post-meta]`, and optional `[data-post-taxonomy]`.
- `DefaultPostThumbnail.astro` renders one decorative inline 4:3 SVG and accepts no props.

- [ ] **Step 1: Replace old Card expectations with failing behavior tests**

In `tests/card.test.ts`, assert the exact public behavior rather than the old class recipe:

```ts
const html = await renderCard();
const row = html.match(/<li\b[^>]*data-post-row[^>]*>([\s\S]*?)<\/li>/)?.[1] ?? "";
expect(row.match(/<a\b/g)).toHaveLength(1);
expect(row).toMatch(/<a\b[^>]*data-post-link[^>]*>[\s\S]*<time/);
expect(row).toContain("Deep Dive &gt; Architecture");
expect(row).toContain("2026.06.29");
expect(row).toContain("data-default-post-thumbnail");
expect(row).not.toContain("hover:underline");
```

Add a controlled string image case:

```ts
const withImage = await renderCard(post({ ogImage: "/images/post.png" }));
expect(withImage).toMatch(/<img\b(?=[^>]*data-post-image)(?=[^>]*src="\/images\/post\.png")(?=[^>]*alt="")/);
expect(withImage).not.toContain("data-default-post-thumbnail");
```

Keep category-only and category-less cases. Change the expected order to thumbnail before title, then title before meta, then description. Assert heading variants `h2`, `h3`, and `h4` remain selectable.

In `tests/routes.test.ts`, require every representative general-list row to contain exactly one post anchor, thumbnail, full compact date, description, and at most one taxonomy; for a known Deep Dive row require both category and subcategory text.

- [ ] **Step 2: Run Card tests and observe RED**

Run:

```powershell
npm.cmd exec -- vitest run tests/card.test.ts
npm.cmd run build
npm.cmd exec -- vitest run tests/routes.test.ts -t "post rows"
```

Expected: FAIL because the existing row uses a date column, a title-only anchor, most-specific taxonomy, no thumbnail, and underline hover.

- [ ] **Step 3: Add the theme-aware default thumbnail**

Create `DefaultPostThumbnail.astro` as a decorative inline SVG:

```astro
<svg
  data-post-thumbnail
  data-default-post-thumbnail
  viewBox="0 0 112 84"
  role="img"
  aria-hidden="true"
  focusable="false"
>
  <rect width="112" height="84" rx="7" class="fill-muted" />
  <text x="56" y="45" text-anchor="middle" class="fill-foreground text-[13px] font-bold">
    Dev groot<tspan class="fill-accent">.</tspan>
  </text>
</svg>
```

Use existing theme tokens so light accent is purple and dark accent is salmon. Do not create bitmap assets or duplicate theme files.

- [ ] **Step 4: Make Card the one full-row link**

Compute taxonomy without dropping the parent:

```ts
const categoryLabel = data.category ? CATEGORIES[data.category].label : undefined;
const subcategoryLabel =
  data.category && data.subcategory
    ? getSubcategoryLabel(data.category, data.subcategory)
    : undefined;
const taxonomyLabel = [categoryLabel, subcategoryLabel].filter(Boolean).join(" > ");
const imageSrc =
  typeof data.ogImage === "string" ? data.ogImage : data.ogImage?.src;
```

Render `li > a[data-post-link]` with a responsive two-column grid. Put an actual decorative `<img data-post-thumbnail data-post-image alt="">` or `DefaultPostThumbnail` in the first column. Put heading, one muted flex meta row (`Datetime`, separator, taxonomy), and description in the second column. Use 112px/4:3 desktop and 82px mobile, `object-cover`, `min-w-0`, and a 320px-safe gap. Apply the gradient to hover and focus-visible on the anchor; remove title underline classes.

- [ ] **Step 5: Verify all Card consumers and commit**

Run:

```powershell
npm.cmd exec -- vitest run tests/card.test.ts
npm.cmd run build
npm.cmd exec -- vitest run tests/routes.test.ts -t "post rows|Archives"
npm.cmd run format:check
npm.cmd run lint
npm.cmd run astro -- check
```

Expected: home, posts, tags, direct category, subcategory, and Archives all use the same non-vacuous row contract; h2–h4 outlines remain valid.

Commit:

```powershell
git add src/components/DefaultPostThumbnail.astro src/components/Card.astro tests/card.test.ts tests/routes.test.ts
git commit -m "feat(lists): 공용 글 목록에 썸네일과 전체 메타를 적용한다"
```

---

### Task 3: Date Series rows and simplify the Archives year header

**Files:**
- Modify: `src/pages/series/index.astro`
- Modify: `src/pages/series/[slug].astro`
- Modify: `src/pages/archives/index.astro`
- Modify: `tests/routes.test.ts`

**Interfaces:**
- Consumes: `Datetime format="compact"`, existing `data-series-accordion`, `data-series-content`, `data-series-chevron`, and `Card variant="h4"`.
- Produces: `[data-series-post-date]` in accordion/detail rows and `[data-archive-year-header]` with a plain accent top rule.
- Keeps: `initSeriesAccordions()` lifecycle and native `details/summary` semantics.

- [ ] **Step 1: Add failing generated-output tests**

In `tests/routes.test.ts`, parse `/series/` and both built `/series/[slug]/` pages. For every non-empty Series post link, require one full compact date:

```ts
expect(row).toMatch(
  /data-series-post-date[\s\S]*?<time\b[^>]*>\s*\d{4}\.\d{2}\.\d{2}\s*<\/time>/
);
```

Require the summary to have the same gradient hover/focus recipe and keep `data-series-chevron` without a background-color state.

For Archives, assert:

```ts
expect(html).toMatch(/data-archive-year-header[^>]*class="[^"]*border-t-2[^"]*border-t-accent/);
expect(html).not.toMatch(/data-archive-year-header[^>]*class="[^"]*bg-/);
```

Keep the dynamic count totals and `h1 → h2 → h3 → h4` outline assertions.

- [ ] **Step 2: Run focused tests and observe RED**

Run:

```powershell
npm.cmd run build
npm.cmd exec -- vitest run tests/routes.test.ts -t "Series|Archives"
```

Expected: FAIL because Series rows have no dates/summary gradient and Archives uses the existing vertical year rail rather than a full-width top-rule header.

- [ ] **Step 3: Add Series dates without replacing numbered rows**

Import `Datetime` in both Series route files. In accordion and detail post anchors, keep the two-digit order and title, then render:

```astro
<Datetime
  data-series-post-date
  pubDatetime={post.data.pubDatetime}
  timezone={post.data.timezone}
  format="compact"
  class="text-muted-foreground mt-1"
/>
```

If Astro component prop forwarding does not preserve the data attribute, wrap it in `<span data-series-post-date>`. Put the date below the title on narrow screens and allow it to sit inline/end-aligned when space permits.

Add the approved summary classes:

```text
hover:bg-[linear-gradient(90deg,var(--accent-muted),transparent)]
focus-visible:bg-[linear-gradient(90deg,var(--accent-muted),transparent)]
```

Do not change `group-open` rotation, arrow background, animation script, or content height handling.

- [ ] **Step 4: Replace the Archives rail with the plain full-width year header**

For each year section, remove the `border-s` rail wrapper and render:

```astro
<header
  data-archive-year-header
  class="border-t-accent flex flex-wrap items-baseline justify-between gap-2 border-t-2 pt-3"
>
  <h2 class="text-xl font-semibold">{year}</h2>
  <p data-post-count class="text-muted-foreground text-sm">
    {tplStr(t.archives.yearPostCount, { count: posts.length })}
  </p>
</header>
```

Keep month sections and `Card variant="h4"`; adjust only vertical spacing needed for the new header.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
npm.cmd run build
npm.cmd exec -- vitest run tests/routes.test.ts -t "Series|Archives|post rows"
npm.cmd exec -- vitest run tests/seriesAccordion.test.ts
npm.cmd run format:check
npm.cmd run lint
npm.cmd run astro -- check
```

Expected: all pass with dates in accordion/detail output, gradient summary hover, unchanged accordion behavior, full-width Archives year headers, and valid outline.

Commit:

```powershell
git add src/pages/series/index.astro src/pages/series/[slug].astro src/pages/archives/index.astro tests/routes.test.ts
git commit -m "feat(series): 시리즈와 아카이브 목록 흐름을 통일한다"
```

---

### Task 4: Add 30 visible Deep Dive test posts

**Files:**
- Create: `tests/deepDiveContent.test.ts`
- Create: `src/content/posts/_ko/deep-dive/rendering/01-test-rendering.md` through `10-test-rendering.md`
- Create: `src/content/posts/_ko/deep-dive/architecture/01-test-architecture.md` through `10-test-architecture.md`
- Create: `src/content/posts/_ko/deep-dive/memory/01-test-memory.md` through `10-test-memory.md`

**Interfaces:**
- Consumes: the existing posts glob loader and taxonomy schema.
- Produces: 30 ordinary visible Markdown entries with no `series`, `seriesOrder`, or `ogImage`.

- [ ] **Step 1: Add a failing corpus contract**

Create `tests/deepDiveContent.test.ts` using `readdirSync(..., { recursive: true, encoding: "utf8" })` and raw frontmatter parsing consistent with `tests/projectsContent.test.ts`. Use the literal expected table:

```ts
const expected = [
  ["rendering", 10],
  ["architecture", 10],
  ["memory", 10],
] as const;
```

For each directory, assert exactly ten filenames matching `/^\d{2}-test-${subcategory}\.md$/`, unique `pubDatetime`, `draft: false`, `category: deep-dive`, matching `subcategory`, test wording in title/body, and absence of `ogImage`, `series`, and `seriesOrder`. Assert all 30 files together.

- [ ] **Step 2: Run the corpus test and observe RED**

Run:

```powershell
npm.cmd exec -- vitest run tests/deepDiveContent.test.ts
```

Expected: FAIL with zero files in each new fixture directory.

- [ ] **Step 3: Add the Markdown fixtures**

Add ten files per subcategory with the following shape, changing the two-digit number, subcategory, Korean title, description, and date deterministically:

```markdown
---
title: "[테스트] Rendering 예시 글 01"
pubDatetime: 2026-08-10T09:00:00+09:00
description: "Rendering 소분류 목록과 페이지네이션을 확인하기 위한 테스트 글입니다."
tags: ["테스트", "deep-dive"]
category: deep-dive
subcategory: rendering
draft: false
---

이 글은 **Rendering 소분류 화면을 확인하기 위한 테스트 콘텐츠**입니다.

목록의 날짜, 분류, 기본 썸네일, 설명과 페이지네이션을 점검할 때 사용합니다.
```

Use dates from 2026-08-10 backwards with no future date and no duplicates across all 30 posts. Architecture and Memory copy must name their own subcategory.

- [ ] **Step 4: Verify content, routes, counts, and pagination**

Run:

```powershell
npm.cmd exec -- vitest run tests/deepDiveContent.test.ts tests/taxonomySchema.test.ts
npm.cmd run build
npm.cmd exec -- vitest run tests/routes.test.ts -t "post rows|pagination|Archives"
```

Inspect generated routes and assert the final visible counts: Rendering 13, Architecture 10, Memory 10. Confirm each subcategory has its expected paginated output based on `postsConfig.perPage` and every new row uses the default thumbnail.

- [ ] **Step 5: Commit**

```powershell
git add src/content/posts/_ko/deep-dive tests/deepDiveContent.test.ts tests/routes.test.ts
git commit -m "docs(content): Deep Dive 테스트 글 서른 개를 추가한다"
```

---

### Task 5: Integrated verification gate

**Files:** none

**Interfaces:**
- Consumes all contracts from Tasks 1–4.
- Produces no new production interface.

- [ ] **Step 1: Run the complete gate with fail-fast exit handling**

```powershell
npm.cmd run format:check
npm.cmd run lint
npm.cmd test
npm.cmd run astro -- check
npm.cmd run build
git diff --check
git status --short
```

Expected: all commands exit 0. The existing static `/categories/project/` Pagefind warning and Korean stemming note are allowed; no new warning is allowed.

- [ ] **Step 2: Audit generated artifacts**

Across built post HTML/CSS/scripts, verify:

- every code block has one header, three lights, one non-empty data-language, no line number, and runtime Copy initialization;
- code CSS has neutral light/dark surfaces, hidden scrollbar buttons, transparent track/corner, both gradient axes, and theme accent language colors;
- every general post row has exactly one anchor and one thumbnail;
- known Deep Dive rows contain `Deep Dive > Rendering|Architecture|Memory` and compact full-year dates;
- `/series/` and each detail page contain dates while native details/animation hooks remain;
- Archives outline remains h1/h2/h3/h4 and year headers have no background band;
- the 30 new posts and expected subcategory pagination routes exist;
- 320px width calculations leave no page-level horizontal overflow.

- [ ] **Step 3: Preserve the branch for the remaining integration review**

Do not merge, push, deploy, delete the worktree, or change the unresolved production site URL. Report the verification evidence and keep `feat/redesign-consolidation` in place for the final whole-branch review.

