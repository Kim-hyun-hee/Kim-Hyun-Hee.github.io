# AstroPaper redesign consolidation design

- Date: 2026-08-10
- Status: Approved design; implementation pending
- Scope: upstream stabilization, information architecture, lists, Series, Archives, About/Projects, Markdown, code blocks, and interaction cleanup

## 1. Goal

Keep the current AstroPaper fork recognizable and maintainable while completing the approved redesign. The work must:

1. separate topic categories, ordered Series, and portfolio Projects;
2. make list pages easier to scan and better balanced vertically;
3. give Series, Archives, and About their own semantic presentation;
4. align Markdown and code blocks with the site palette without over-designing them;
5. remove unwanted transitions and heading anchors;
6. port the one missing upstream accessibility fix and reduce known maintenance risk;
7. preserve existing post URLs and avoid adding unnecessary dependencies.

This is a consolidation of the visual decisions approved in the design companion. Product code has not yet been changed for this scope.

## 2. Non-goals

- Do not choose or publish a production domain in this change. Keep the current placeholder URL and add a pre-deploy note.
- Do not delete historical design specs or plans as part of the redesign.
- Do not add a client framework, animation library, syntax-highlighting library, ClipboardJS, or jQuery.
- Do not create standalone Project detail routes yet. Projects render inside About.
- Do not change existing post slugs or URLs.
- Do not reproduce the reference portfolio or series page byte-for-byte; adapt its useful information hierarchy to this fork.

## 3. Audit baseline and stabilization

### 3.1 Upstream

The local fork is based on AstroPaper commit `342bcde…`. Upstream has one relevant later commit, `35cfa7f…`, which fixes skip-link focus visibility. The custom sidebar/header shell replaced the upstream component where that change landed, so it must be ported manually rather than merged blindly.

Required action:

- ensure the skip link becomes visible and usable on keyboard focus in the custom shell;
- retain the current sidebar layout and visual tokens.

### 3.2 Cross-platform scripts

The project passes ESLint, all 83 Vitest tests, `astro check`, and static page generation. The final Windows build step fails because `package.json` uses Unix `cp -r`.

Required action:

- replace the shell copy with a small Node standard-library command using `fs.cpSync`;
- add no dependency;
- keep the generated Pagefind copy behavior identical.

### 3.3 Line endings

`format:check` currently reports broad changes because repository LF expectations conflict with `core.autocrlf=true`.

Required action:

- add a narrow `.gitattributes` policy for text files using LF;
- do not mechanically rewrite unrelated user files during this feature.

### 3.4 Post interaction lifecycle

The post page currently owns progress, heading-anchor display, copy, lightbox, touch zoom, and transition-scroll behavior in one large inline script. With Astro view transitions, repeated page loads can accumulate listeners.

Required action:

- remove the heading `#` behavior entirely;
- group remaining post interactions into small local modules or one lifecycle-aware initializer;
- bind through `astro:page-load` and release listeners through an `AbortController` or `astro:before-swap` cleanup;
- preserve copy, progress, lightbox, and touch behavior;
- respect reduced motion where animation remains.

### 3.5 Dead configuration

The Edit Post UI has already been removed, but its component/config/schema/icon remain.

Required action:

- remove the dead component, unused icon/imports, and configuration/schema fields only after repository-wide reference checks;
- cover the removed configuration surface in typecheck/build verification.

## 4. Information architecture

### 4.1 Definitions

| Concept | Meaning | Storage | Navigation |
| --- | --- | --- | --- |
| Category | topic-based classification for standalone posts | `categories.ts` + post frontmatter | Categories |
| Series | ordered reading path, independent of Category | `series.ts` + `series`/`seriesOrder` | Series |
| Project | portfolio work, not a post classification | `projects` content collection | About `#projects` |

The sidebar label `Projects` becomes `Series`. Portfolio Projects appear only in About.

### 4.2 Post schema invariants

`category` becomes optional so a Series post does not need a fake topic category. Validation rules:

- every publishable post must have at least one discovery path: a valid `category` or a valid `series`;
- `subcategory` requires `category` and must belong to that category;
- `seriesOrder` requires `series`;
- `series` requires a positive integer `seriesOrder`;
- a Series cannot contain duplicate orders;
- Series membership no longer checks or stores a Category;
- standalone posts without Series continue to require Category.

A post may still have both a topic Category and a Series in the future. The migrated Project posts use Series only.

### 4.3 Migration of current Project posts

There are 17 existing posts with `category: project`. Every one already belongs to either `building-this-blog` or `dod-digitaltwin-unity` and has a `seriesOrder`.

Migration:

- remove `category: project` from those 17 frontmatters;
- retain `series`, `seriesOrder`, tags, dates, and slugs;
- remove `project` from `CATEGORIES`;
- remove the Category/Series coupling and `getSeriesByCategory` API;
- make home and Series pages read Series directly.

### 4.4 Routes

| Route | Result |
| --- | --- |
| `/categories/` | topic categories only |
| `/categories/project/` | redirect to `/series/` |
| `/series/` | independent accordion index |
| `/series/[slug]/` | linkable full Series page |
| `/about/` | narrative About plus Projects |
| `/about/#projects` | Projects section anchor |

The old Project path redirects to Series because that is where its 17 posts move. Portfolio test data lives at the About anchor and is not mixed into the old post route.

## 5. Theme tokens

### 5.1 Site palette

Light site palette remains unchanged:

- `--accent: #8387d3`
- `--sky: #8fb4dd`
- existing light muted and foreground tokens remain unchanged.

Dark site palette changes from orange/gold to Horizon-derived salmon/gold:

- `--accent: #e58d7d`
- `--sky: #efb993`
- `--accent-foreground: #1c1e26`
- `--accent-muted: #302321`
- `--sky-muted: #302820`

Neutral dark background, foreground, border, link, and sidebar tokens remain unchanged unless contrast verification requires a minimal adjustment.

### 5.2 Code palette B

Code blocks use a custom adaptive Horizon family. The only difference between the original Horizon role mapping and approved B is the function color.

| Syntax role | Light | Dark |
| --- | --- | --- |
| Foreground/punctuation | `#36373d` | `#cbced0` |
| Comment | `#767277` | `#6f6f70` |
| Tag | `#666369` | `#9da0a2` |
| Variable | `#c72f4c` | `#e93c58` |
| Attribute/number | `#b65345` | `#e58d7d` |
| Title/class | `#986039` | `#efb993` |
| String | `#a94d32` | `#efaf8e` |
| Built-in/regexp | `#147985` | `#24a8b4` |
| Function | `#3f75a9` | `#8fb4dd` |
| Keyword/type | `#8249a0` | `#b072d1` |
| Meta | `#a65b39` | `#e4a382` |

The Shiki output remains the source of token spans. Do not add Highlight.js.

## 6. Home and general post lists

### 6.1 Remove shared-title motion

Remove the view-transition name shared between home/list cards and post titles:

- remove `transition:name` from list titles;
- remove the matching post-header `viewTransitionName` assignment;
- delete `toTransitionName` if no references remain.

Normal page navigation may keep the site-level view transition. Only the title-morph animation is removed.

### 6.2 General post row A

Subcategory lists and direct-category lists share one row design:

- full-width divider at the top/between/bottom of rows;
- compact date column on the left;
- title, metadata, and description on the right;
- approximately 14–15 px vertical row padding;
- optional subtle hover tint without turning the row into a card;
- responsive collapse so the date and content remain readable on narrow screens.

Use the existing `Card.astro` as the implementation surface unless a narrowly named replacement clearly reduces branching. Do not build a generic card framework.

### 6.3 Page composition

The current `Main` ends with `pb-16` while Pagination sits outside it with `mt-auto`, creating an imbalanced description/list/pagination relationship.

Approved composition:

- intro-to-list gap: approximately 28 px;
- list-to-pagination gap: approximately 31 px;
- Pagination renders inside the main content flow;
- remove `mt-auto` from Pagination;
- Footer spacing depends on content flow, not viewport pushing.

### 6.4 Pagination B

- no outer dock/container;
- individual 36 px cells remain;
- active page uses `accent-muted` background and `accent` text;
- inactive hover keeps the existing muted hover behavior;
- two-digit labels remain;
- accessible previous/next and current-page labels remain.

### 6.5 Home “All posts”

- place below a full-width divider, aligned to the right;
- no underline and no outer dock;
- default arrow uses accent;
- hover exactly matches the selected pagination state: `background: accent-muted`, `color: accent`, including the arrow;
- retain a dashed focus-visible outline.

## 7. Series

### 7.1 Index design A

`/series/` uses an editorial native accordion:

- semantic `<details>/<summary>`;
- dashed separators, no enclosing cards;
- title, post-count badge, period/status, and chevron in Summary;
- description and ordered post links in the body;
- two-digit accent episode numbers `01`, `02`, ...;
- episode hover uses a quiet tinted background;
- Series with zero posts render a clear empty message;
- no `S01` numbering for Series themselves.

### 7.2 Motion

Because native `<details>` has no reliable cross-browser two-way height animation, use a small local Web Animations helper:

- open duration: about 240 ms;
- close duration: about 210 ms;
- easing: `cubic-bezier(.2,.8,.2,1)`;
- animate rendered height plus a small content fade/translation;
- rapid clicks cancel and restart from the current rendered height;
- reduced-motion users get an immediate native toggle;
- open chevron keeps a transparent background and changes only rotation and accent color.

No animation dependency is allowed.

### 7.3 Detail and post footer

- retain `/series/[slug]/` for stable linking and a full ordered view;
- apply the same two-digit numbering language;
- retain post-detail previous/next Series navigation;
- current episode must have `aria-current="page"` and a non-color distinction.

## 8. Archives

Sidebar:

- label is exactly `Archives`;
- remove the archive icon;
- use the same text-only navigation language as other entries.

Archive page design A:

- page description includes overall post total;
- each year occupies a left rail with year and an explicit `08 posts` badge/count;
- the right column contains months and post rows;
- month count uses a compact two-digit accent number;
- archive posts reuse the approved full-width ruled row language;
- remove current superscript counts;
- mobile layout stacks the year header above month content without losing count hierarchy.

## 9. About and Projects

### 9.1 Composition

Keep `src/content/pages/about.md` for editable narrative content. `about.astro` composes that narrative with a portfolio section anchored as `id="projects"`.

The About hero may use the approved restrained portfolio language:

- small `ABOUT / PORTFOLIO` eyebrow;
- concise role statement;
- current purple/blue gradient only for a short highlighted phrase;
- GitHub and optional Email actions use outline controls;
- no solid purple Contact button;
- omit Email entirely until a public address is explicitly configured.

### 9.2 Projects collection

Add a `projects` content collection. Suggested fields:

```yaml
title: string
description: string
status: in-progress | completed | prototype | paused
period: string
role: string? 
techStack: string[]
featured: boolean
order: number
metric:
  value: string
  label: string
links:
  github: string?
  demo: string?
relatedPosts: string[]
```

`metric`, `links`, `role`, and `relatedPosts` are optional. Related-post count may be zero.

### 9.3 Layout A

- all entries with `featured: true` render as detailed two-column cards;
- featured count is data-driven, not a global `2` constant;
- any count works; 2/4/6 simply produces balanced rows on desktop;
- remaining entries render as a compact numbered index;
- mobile uses one column;
- detailed cards show status, title, description, optional metric, and stack;
- compact rows show number, title, and primary stack;
- Projects never become Category or Series definitions.

Add ten clearly test-oriented Project entries so the layout can be evaluated at scale. Start with four featured and six compact entries; the user can change this by editing `featured` in each file.

## 10. Markdown

### 10.1 Headings and anchors

- remove the hover `#` displayed beside post headings;
- keep heading IDs for deep links and Table of Contents;
- preserve keyboard navigation and direct fragment URLs;
- refine heading top/bottom spacing only; do not add decorative rails or labels.

### 10.2 Links, lists, blockquotes, tables

- links keep neutral text with accent underline;
- list markers use accent;
- inline code remains a quiet muted capsule;
- blockquote keeps the existing accent/sky tinted background and 3 px rail;
- table receives one rounded, overflow-safe outer border and quiet muted header;
- horizontal rules remain neutral borders;
- images keep the existing rounded border and lightbox behavior.

### 10.3 Callouts

Keep `rehype-callouts` and the Obsidian semantic palette. Apply only the approved minimal correction:

- `align-items: center` for icon/title/fold control;
- remove margins from the title text element;
- normalize content first/last paragraph margins;
- padding `14px 16px`;
- radius `8px`;
- retain the single tinted background with no new title bar, rail, or inner separator;
- retain all existing callout types and collapsible Markdown syntax.

Do not fork the plugin. Override its documented classes locally after the imported theme.

### 10.4 Code blocks

Approved frame:

- adaptive light/dark Horizon B token palettes;
- light background `#fbfafb` and dark background `#1c1e26`;
- macOS traffic lights: red `#f5655b`, yellow `#f6bd3b`, green `#43c645`;
- filename header and existing native copy behavior;
- no line numbers;
- maximum height 550 px;
- horizontal and vertical overflow remain usable;
- retain the 15 px custom scrollbar and gradient thumb `#3ac3d0 → #c08ae5 → #f06689 → #ffd0aa`;
- scrollbar thumb border matches each code background;
- keep Shiki transformer support for diff, highlighted lines, highlighted words, and filenames.

Implement through Shiki configuration plus CSS variables/selectors. Do not rewrite Shiki DOM or split lines with client JavaScript.

## 11. Component and dependency boundaries

- Prefer editing existing focused components over introducing a design-system abstraction layer.
- Keep taxonomy utilities pure and tested.
- Series data reads directly from `series.ts`; Projects read from the Astro content collection.
- Do not make About query Series to infer Projects.
- Do not make Series query Category.
- Keep navigation labels sourced from i18n where practical, with `Archives` and `Series` updated consistently.
- No new runtime or build dependency is expected.

## 12. Accessibility and interaction requirements

- port skip-link focus visibility;
- retain semantic headings while removing only the decorative heading hash;
- accordion remains keyboard-operable through native Summary;
- accordion animation respects `prefers-reduced-motion`;
- active pagination uses `aria-current="page"`;
- active/current Series episode has text/weight distinction in addition to color;
- hover states have equivalent focus-visible states;
- code copy button has a stable accessible label and success announcement/state;
- counts are visible text, not superscript-only decoration;
- redirects preserve old navigation intent.

## 13. Testing

### 13.1 Unit tests

Add or update tests for:

- optional Category / required discovery-path validation;
- Series order validation and duplicate rejection;
- Category utilities after Project removal;
- Series filtering independent of Category;
- Project collection schema, sorting, featured split, and zero related posts;
- pagination output unchanged apart from layout classes;
- old Project route destination where testable.

### 13.2 Build checks

Run:

1. formatter on touched files;
2. ESLint;
3. Vitest;
4. `astro check`;
5. full Windows `pnpm build` including the Pagefind copy step;
6. `pnpm format:check` after `.gitattributes` handling is verified.

### 13.3 Visual/manual checks

At minimum inspect light/dark and desktop/mobile for:

- home recent posts and All posts hover/focus;
- direct Category and subcategory lists with one page and multiple pages;
- Series collapsed, expanded, rapid-toggle, zero-post, and reduced-motion states;
- Archives with multiple years/months;
- About with four featured and six compact Projects;
- Markdown specimen containing headings, links, lists, quote, callout, table, inline code, and long code block;
- code horizontal/vertical scrollbars and copy behavior;
- post navigation across Astro view transitions to confirm listeners do not duplicate.

## 14. Delivery order

Implementation should proceed in dependency order:

1. stabilization and cross-platform build fixes;
2. information architecture/schema migration;
3. shared list composition and interactions;
4. Series and Archives;
5. About/Projects;
6. Markdown and code blocks;
7. post-script lifecycle cleanup and full regression verification.

Each phase should leave the repository buildable. The production URL remains a documented pre-deploy task rather than a guessed value.
