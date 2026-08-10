# Post Lists and Archives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every post list a clear rhythm, replace dock-like controls with quiet editorial navigation, and make Archives counts and grouping immediately legible.

**Architecture:** Keep one shared `Card` row for home, posts, tag, and category results. Layout routes provide headings and spacing; the row owns its separator. Pagination and All posts share one selected-state color recipe without sharing a dock wrapper. Archives uses the same ruled-row vocabulary in a year/month hierarchy.

**Tech Stack:** Astro 7, TypeScript 6, Vitest 4, Tailwind CSS 4

## Global Constraints

- All commit subjects use `type(scope): 한글 설명`.
- Keep list markup semantic and keyboard accessible.
- Do not modify the untracked `.claude/` directory.
- Remove the title view-transition morph; retain normal page transitions.
- Keep responsive layouts usable at 320 px width.

---

### Task 1: Remove shared-title morphing

**Files:**
- Modify: `src/components/Card.astro`
- Modify: `src/pages/posts/[...slug]/_components/PostHeader.astro`
- Delete: `src/utils/toTransitionName.ts`
- Test: `tests/routes.test.ts`

**Interfaces:**
- Post titles have no matching `transition:name` between list and article pages.

- [ ] **Step 1: Add an assertion against title transition names**

Assert a built post listing and article contain no generated title transition identifier while ordinary page-transition scripts remain.

- [ ] **Step 2: Confirm the focused assertion fails**

Run: `pnpm build && pnpm vitest run tests/routes.test.ts -t "제목 이동 효과"`

Expected: FAIL because list and post titles still share a transition name.

- [ ] **Step 3: Remove the shared transition surface**

Delete the `toTransitionName` import and `transition:name` attributes from both components, then delete `src/utils/toTransitionName.ts`.

- [ ] **Step 4: Verify no references remain**

Run: `rg -n "toTransitionName|transition:name=.*title" src`

Expected: no matches.

Run: `pnpm astro check && pnpm vitest run tests/routes.test.ts`

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/Card.astro src/pages/posts/[...slug]/_components/PostHeader.astro src/utils/toTransitionName.ts tests/routes.test.ts
git commit -m "fix(ui): 글 제목 사이의 이동 효과를 없앤다"
```

### Task 2: Establish the ruled post-row component

**Files:**
- Modify: `src/components/Card.astro`
- Test: `tests/routes.test.ts`

**Interfaces:**
- Desktop row: date column on the left, title/description/taxonomy on the right.
- Every adjacent row is separated by a full-width border.
- Mobile row stacks without horizontal overflow.

- [ ] **Step 1: Add structural assertions**

Assert listing cards carry `data-post-row`, use a border separator, and expose `<time>` before the title content.

- [ ] **Step 2: Confirm failure**

Run: `pnpm build && pnpm vitest run tests/routes.test.ts -t "글 목록 행"`

Expected: FAIL against the current card markup.

- [ ] **Step 3: Implement the approved A row**

Use a two-column grid from the small breakpoint upward and a stacked layout below it:

```astro
<li data-post-row class="border-border grid border-b py-5 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-6">
  <time class="text-foreground/60 text-sm">...</time>
  <div class="min-w-0">...</div>
</li>
```

Remove card-like backgrounds, floating borders, and excessive internal gaps. Keep focus-visible styles on the title link.

- [ ] **Step 4: Verify all consumers**

Run: `pnpm build && pnpm vitest run tests/routes.test.ts tests/listsPostsDirectly.test.ts`

Expected: home, posts, tag, large category, and leaf category routes all render the shared ruled rows.

- [ ] **Step 5: Commit**

```bash
git add src/components/Card.astro tests/routes.test.ts
git commit -m "feat(ui): 글 목록에 날짜 열과 구분선을 적용한다"
```

### Task 3: Rebalance list headers, rows, and pagination

**Files:**
- Modify: `src/components/Main.astro`
- Modify: `src/pages/posts/[...page].astro`
- Modify: `src/pages/tags/[tag]/[...page].astro`
- Modify: `src/pages/categories/[category]/[...page].astro`
- Modify: `src/pages/categories/[category]/[subcategory]/[...page].astro`
- Test: `tests/routes.test.ts`

**Interfaces:**
- Header-to-list gap is smaller than list-to-pagination gap.
- The same content width and vertical rhythm apply to posts, tags, and categories.

- [ ] **Step 1: Encode page-section markers in route tests**

Assert each listing route contains `data-list-header`, `data-post-list`, and `data-list-pagination` in that order.

- [ ] **Step 2: Confirm failure**

Run: `pnpm build && pnpm vitest run tests/routes.test.ts -t "목록 영역 배치"`

Expected: FAIL because the current pages do not expose the shared section structure.

- [ ] **Step 3: Normalize vertical rhythm**

Use one main column width. Give the header a compact bottom margin, place the list immediately after it, and give pagination a distinct top margin:

```astro
<header data-list-header class="mb-6">...</header>
<section data-post-list>...</section>
<nav data-list-pagination class="mt-10">...</nav>
```

Keep headings, descriptions, and counts together inside the header instead of splitting them across the page.

- [ ] **Step 4: Verify responsive layout**

Run: `pnpm astro check && pnpm build && pnpm vitest run tests/routes.test.ts`

Expected: all pass.

Manually inspect posts, a top-level category, a leaf category, and a tag at mobile and desktop widths. Confirm the description, rows, and pagination read as one balanced column.

- [ ] **Step 5: Commit**

```bash
git add src/components/Main.astro src/pages/posts src/pages/tags src/pages/categories tests/routes.test.ts
git commit -m "style(lists): 목록 설명과 페이지네이션의 간격을 맞춘다"
```

### Task 4: Replace dock pagination with bare selected cells

**Files:**
- Modify: `src/components/Pagination.astro`
- Test: `tests/pagination.test.ts`
- Test: `tests/routes.test.ts`

**Interfaces:**
- Pagination has no enclosing dock background or pill.
- Selected page uses `bg-accent-muted text-accent`.
- Hover and keyboard focus use the same recipe on selectable numbers.

- [ ] **Step 1: Add pagination-state assertions**

Assert the current page has `aria-current="page"`, selected-state classes, and no dock container class. Assert numbered links expose the same hover background and text colors.

- [ ] **Step 2: Confirm failure**

Run: `pnpm vitest run tests/pagination.test.ts tests/routes.test.ts -t "페이지네이션"`

Expected: FAIL against the current dock presentation.

- [ ] **Step 3: Implement option B**

Render compact bare controls with a small gap. Use transparent default backgrounds, rounded individual hit targets, and the selected recipe only on the current item. Keep Previous/Next accessible names and disabled semantics.

- [ ] **Step 4: Verify pagination boundaries**

Run: `pnpm vitest run tests/pagination.test.ts && pnpm astro check && pnpm build`

Expected: first, middle, and last page tests pass; no layout overflow.

- [ ] **Step 5: Commit**

```bash
git add src/components/Pagination.astro tests/pagination.test.ts tests/routes.test.ts
git commit -m "feat(ui): 페이지네이션을 선택형 셀 디자인으로 바꾼다"
```

### Task 5: Restyle the home All posts action

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/components/LinkButton.astro`
- Test: `tests/routes.test.ts`

**Interfaces:**
- The home action is separated by a rule and aligned to the right.
- It has no dock shell and no underline hover.
- Hover/focus colors equal selected pagination: `bg-accent-muted text-accent`.

- [ ] **Step 1: Add the home-action assertion**

Assert the action carries `data-all-posts`, appears after a divider, and contains selected-pagination hover classes but no underline class.

- [ ] **Step 2: Confirm failure**

Run: `pnpm build && pnpm vitest run tests/routes.test.ts -t "전체 글 링크"`

Expected: FAIL against the current dock-like action.

- [ ] **Step 3: Implement option C with the approved hover**

Allow `LinkButton` to render the quiet text-button variant without changing other consumers. On the home page, place it after `border-border border-t`, align it right, and use `hover:bg-accent-muted hover:text-accent` plus matching focus-visible classes.

- [ ] **Step 4: Verify**

Run: `pnpm astro check && pnpm build && pnpm vitest run tests/routes.test.ts`

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro src/components/LinkButton.astro tests/routes.test.ts
git commit -m "feat(ui): 홈 전체 글 링크를 조용한 선택형 버튼으로 바꾼다"
```

### Task 6: Redesign Archives and its sidebar item

**Files:**
- Modify: `src/pages/archives/index.astro`
- Modify: `src/components/layout/Sidebar.astro`
- Modify: `src/i18n/lang/ko.ts`
- Modify: `src/i18n/lang/en.ts`
- Modify: `src/i18n/types.ts`
- Test: `tests/routes.test.ts`

**Interfaces:**
- Sidebar label is `Archives` in both locales and has no icon.
- Archive years have a left rail and visible total count.
- Month counts use the accent color; posts use ruled rows.

- [ ] **Step 1: Add archive assertions**

Assert the sidebar contains the text-only `Archives` link, archive markup exposes year and month counts, the year group has a left border, and archive posts use separators.

- [ ] **Step 2: Confirm failure**

Run: `pnpm build && pnpm vitest run tests/routes.test.ts -t "아카이브"`

Expected: FAIL against the icon menu and understated counts.

- [ ] **Step 3: Implement archive option A**

Remove the archive icon import/render from the sidebar. Render each year as a section with a subdued left rail, year heading, and total count. Render month headings with accent-colored counts and each post as a date/title row separated by `border-border`.

- [ ] **Step 4: Verify**

Run: `pnpm astro check && pnpm build && pnpm vitest run tests/routes.test.ts`

Expected: all pass. Manually confirm counts remain visible in both themes and at mobile width.

- [ ] **Step 5: Commit**

```bash
git add src/pages/archives/index.astro src/components/layout/Sidebar.astro src/i18n/lang/ko.ts src/i18n/lang/en.ts src/i18n/types.ts tests/routes.test.ts
git commit -m "feat(archives): 글 수가 선명한 연도별 목록으로 다듬는다"
```

### Task 7: Lists and Archives gate

**Files:** none

- [ ] **Step 1: Run the complete gate**

Run: `pnpm format:check && pnpm lint && pnpm test && pnpm build`

Expected: all commands exit 0; title morphing is absent; home, post, category, tag, pagination, and Archives layouts match the approved structure.
