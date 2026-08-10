# About Projects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn About into a portfolio-style page with a content-driven Projects section that is independent from blog taxonomy and easy to curate at any featured-project count.

**Architecture:** Keep personal prose in the existing About Markdown. Add a separate `projects` content collection for portfolio records, split records by per-file `featured` flags, and render detailed featured cards followed by a compact remainder. The collection—not a hard-coded slice—controls whether 2, 4, 6, or any other number is featured.

**Tech Stack:** Astro 7 content collections, TypeScript 6, Zod, Vitest 4, Tailwind CSS 4

## Global Constraints

- All commit subjects use `type(scope): 한글 설명`.
- About projects are portfolio items, not blog categories or series.
- Do not modify the untracked `.claude/` directory.
- Do not publish a placeholder email address.
- Keep the existing About Markdown prose editable as Markdown.
- The Projects section anchor is exactly `/about/#projects`.

---

### Task 1: Define the projects collection and grouping helper

**Files:**
- Modify: `src/content.config.ts`
- Create: `src/utils/groupProjects.ts`
- Create: `tests/groupProjects.test.ts`

**Interfaces:**
- Project data: `title`, `summary`, `period`, `role`, `stack`, `featured`, optional `repository`, optional `website`, and integer `order`.
- `groupProjects(projects)` returns `{ featured, other }`, each sorted by `order`.

- [ ] **Step 1: Write grouping tests**

```ts
it("featured 표시에 따라 프로젝트를 나누고 순서를 지킨다", () => {
  const result = groupProjects([
    project("둘", 2, false),
    project("하나", 1, true),
    project("셋", 3, true),
  ]);

  expect(result.featured.map(item => item.data.title)).toEqual(["하나", "셋"]);
  expect(result.other.map(item => item.data.title)).toEqual(["둘"]);
});
```

Add a second test proving six `featured: true` records produce six featured results; there is no fixed limit.

- [ ] **Step 2: Confirm the tests fail**

Run: `pnpm vitest run tests/groupProjects.test.ts`

Expected: FAIL because the collection helper does not exist.

- [ ] **Step 3: Add the collection schema**

```ts
const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    period: z.string(),
    role: z.string(),
    stack: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    repository: z.string().url().optional(),
    website: z.string().url().optional(),
    order: z.number().int().nonnegative(),
  }),
});
```

Export `projects` beside the blog and pages collections. Implement `groupProjects` as two filters followed by ascending `order` sorts.

- [ ] **Step 4: Verify**

Run: `pnpm vitest run tests/groupProjects.test.ts && pnpm astro check`

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts src/utils/groupProjects.ts tests/groupProjects.test.ts
git commit -m "feat(projects): 포트폴리오 프로젝트 컬렉션을 만든다"
```

### Task 2: Add ten editable sample projects

**Files:**
- Create: `src/content/projects/01-dod-digital-twin.md`
- Create: `src/content/projects/02-astropaper-fork.md`
- Create: `src/content/projects/03-ndt-defect-classifier.md`
- Create: `src/content/projects/04-agv-route-simulator.md`
- Create: `src/content/projects/05-equipment-dashboard.md`
- Create: `src/content/projects/06-sensor-data-pipeline.md`
- Create: `src/content/projects/07-factory-alert-console.md`
- Create: `src/content/projects/08-model-optimizer.md`
- Create: `src/content/projects/09-log-analysis-toolkit.md`
- Create: `src/content/projects/10-portfolio-data-model.md`
- Create: `tests/projectsContent.test.ts`

**Interfaces:**
- Initial distribution: 4 featured and 6 compact projects.
- Samples are clearly editable demonstration content, not fabricated claims presented as verified biography.

- [ ] **Step 1: Add content invariants**

Test that exactly ten project entries load, orders are unique, titles are non-empty, and the initial featured count is four.

- [ ] **Step 2: Confirm failure**

Run: `pnpm vitest run tests/projectsContent.test.ts`

Expected: FAIL because no project records exist.

- [ ] **Step 3: Write all ten records**

Use realistic but explicitly sample-oriented summaries. Set `featured: true` on entries 01–04 and `featured: false` on entries 05–10. Give each entry a unique `order` matching its filename. Include stack and role metadata; omit URLs unless they are real and already known from repository content.

- [ ] **Step 4: Verify collection loading**

Run: `pnpm vitest run tests/projectsContent.test.ts && pnpm astro check`

Expected: ten valid records, four featured.

- [ ] **Step 5: Commit**

```bash
git add src/content/projects tests/projectsContent.test.ts
git commit -m "docs(projects): 편집 가능한 예시 프로젝트 열 개를 추가한다"
```

### Task 3: Build the portfolio-style About page

**Files:**
- Modify: `src/pages/about.astro`
- Modify: `src/content/pages/about.md`
- Create: `src/components/about/FeaturedProject.astro`
- Create: `src/components/about/ProjectRow.astro`
- Test: `tests/routes.test.ts`

**Interfaces:**
- `about.astro` renders the Markdown prose first and `<section id="projects">` after it.
- Featured cards show summary, period, role, stack, and available links.
- Remaining projects use compact ruled rows.
- GitHub is an outline action; Email is rendered only when a real configured address exists.

- [ ] **Step 1: Add About route assertions**

Assert `/about/` contains `id="projects"`, four `data-featured-project` records, six `data-project-row` records, a GitHub outline action, and no placeholder email link.

- [ ] **Step 2: Confirm failure**

Run: `pnpm build && pnpm vitest run tests/routes.test.ts -t "About 프로젝트"`

Expected: FAIL because About has no collection-backed Projects section.

- [ ] **Step 3: Render Markdown and collection data together**

Load the About entry and all project entries in the page frontmatter:

```ts
const about = await getEntry("pages", "about");
const projects = await getCollection("projects");
const { featured, other } = groupProjects(projects);
const { Content } = await render(about);
```

Preserve the existing About prose and append a portfolio transition plus the Projects section. Do not duplicate project data in `about.md`.

- [ ] **Step 4: Implement approved option A**

Featured projects use larger editorial cards with restrained borders and clear metadata. Compact projects use one-line-to-two-line ruled rows. Derive counts from the collection arrays; never slice to a fixed number. Render only real `repository`/`website` links. Keep the GitHub action outlined with a subtle accent hover instead of a solid dark-purple fill.

- [ ] **Step 5: Verify responsive presentation**

Run: `pnpm astro check && pnpm build && pnpm vitest run tests/routes.test.ts tests/groupProjects.test.ts tests/projectsContent.test.ts`

Expected: all pass.

Manually inspect `/about/#projects` in both themes at mobile and desktop widths. Toggle two additional records to `featured: true`, rebuild, and confirm six detailed cards render without code changes; restore the initial four before committing.

- [ ] **Step 6: Commit**

```bash
git add src/pages/about.astro src/content/pages/about.md src/components/about tests/routes.test.ts
git commit -m "feat(about): 프로젝트를 보여주는 포트폴리오 영역을 추가한다"
```

### Task 4: About Projects gate

**Files:** none

- [ ] **Step 1: Run the complete gate**

Run: `pnpm format:check && pnpm lint && pnpm test && pnpm build`

Expected: all commands exit 0; `/about/#projects` contains ten records; the featured count is controlled only by frontmatter.
