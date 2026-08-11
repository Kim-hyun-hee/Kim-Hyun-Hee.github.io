# Callout and Code Block Visual Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the approved Callout spacing and the final neutral-light macOS code frame with line hover, axis-specific gradient scrollbars, and a small bottom-right language label.

**Architecture:** Keep `rehype-callouts`, Shiki, the filename transformer, and the post-interaction lifecycle intact. Apply Callout corrections through local CSS after the plugin import, change only the Shiki light background token, and style existing Shiki `data-language`/`.line` markup without client-side line rewriting.

**Tech Stack:** Astro 7, Shiki, rehype-callouts, Tailwind CSS 4, TypeScript 6, Vitest 4

## Global Constraints

- Do not add Highlight.js, ClipboardJS, line numbers, code execution, or a new dependency.
- Keep code copy, filename ellipsis, scrollport focus, diff lines, highlighted lines, highlighted words, and page-transition cleanup/re-init behavior.
- Keep all syntax-role colors unchanged except the Shiki light background `#fafafa`.
- Callout colors, icons, types, fold semantics, and one-piece tinted background remain unchanged.
- Filename and code-language labels are both `11px` monospace.
- Scrollbar stops are exactly `#3ac3d0`, `#c08ae5`, `#f06689`, `#ffd0aa`.
- All commit subjects use `type(scope): 한글 설명`.
- Do not modify the untracked `.claude/` directory.

---

### Task 1: Restore the approved Callout internal rhythm

**Files:**
- Modify: `src/styles/global.css`
- Modify: `tests/routes.test.ts`

**Interfaces:**
- Consumes the plugin classes `.callout`, `.callout-title`, `.callout-title-text`, `.callout-fold-icon`, and `.callout-content`.
- Produces no new markup, component, or JavaScript interface.

- [ ] **Step 1: Extend the generated-output Callout test**

In the existing `describe("callouts")` block, retain the ordinary and collapsible markup assertions and add exact generated-CSS contracts:

```ts
expect(css).toMatch(
  /\.callout\{(?=[^}]*padding:14px 16px)(?=[^}]*border-radius:8px)(?=[^}]*line-height:1\.55)/
);
expect(css).toMatch(
  /\.callout-title\{(?=[^}]*min-height:20px)(?=[^}]*align-items:center)(?=[^}]*gap:7px)(?=[^}]*line-height:1\.4)/
);
expect(css).toMatch(
  /\.callout-content\{(?=[^}]*margin-top:7px)(?=[^}]*padding-inline-start:25px)/
);
expect(css).toMatch(
  /\.callout-fold-icon\{[^}]*align-items:center/
);
```

Keep the first/last child margin assertions and assert the local CSS does not redefine plugin semantic Callout colors.

- [ ] **Step 2: Run the focused test and observe RED**

Run:

```powershell
npm.cmd run build
npm.cmd exec -- vitest run tests/routes.test.ts -t "callouts"
```

Expected: FAIL because the current override lacks title gap/min-height/line-height, content offset, and fold alignment.

- [ ] **Step 3: Add the minimal local override**

Extend the existing rules after the Obsidian theme import:

```css
.callout {
  padding: 14px 16px;
  border-radius: 8px;
  line-height: 1.55;
}

.callout-title {
  min-height: 20px;
  align-items: center;
  gap: 7px;
  line-height: 1.4;
}

.callout-title-text {
  margin: 0;
}

.callout-fold-icon {
  display: flex;
  align-items: center;
}

.callout-content {
  margin-top: 7px;
  padding-inline-start: 25px;
}

.callout-content > :first-child { margin-top: 0; }
.callout-content > :last-child { margin-bottom: 0; }
```

If the approved `saturate(1.03)` hover is added, keep it in this same rule set and do not add a transition or semantic state.

- [ ] **Step 4: Verify ordinary and collapsible Callouts**

Run:

```powershell
npm.cmd run format:check
npm.cmd run lint
npm.cmd exec -- vitest run tests/routes.test.ts -t "callouts"
npm.cmd run astro -- check
npm.cmd run build
```

Expected: all pass; generated markup remains plugin-owned and the CSS contains only layout overrides.

- [ ] **Step 5: Commit**

```powershell
git add src/styles/global.css tests/routes.test.ts
git commit -m "fix(markdown): Callout 내부 간격을 원본 시안에 맞춘다"
```

---

### Task 2: Restore the final macOS code frame

**Files:**
- Modify: `src/codeThemes.ts`
- Modify: `src/styles/typography.css`
- Modify: `tests/codeThemes.test.ts`
- Modify: `tests/routes.test.ts`

**Interfaces:**
- Consumes existing Shiki `<pre class="astro-code" data-language="...">`, direct child `<code>`, `.line`, `.code-frame-header`, `.code-frame-title`, and runtime `.copy-code` hooks.
- Keeps `horizonLight` and `horizonDark` export names and all existing TextMate scope mappings.
- Produces the language label with `.astro-code::after { content: attr(data-language) }`; no transformer change is required.

- [ ] **Step 1: Add exact palette and frame assertions**

Update `tests/codeThemes.test.ts` so the light theme background is exactly `#fafafa` in both `colors["editor.background"]` and the default settings entry. Keep every foreground and role color assertion unchanged.

Extend the code-block route test to assert:

```ts
expect(css).toMatch(/\.astro-code::after\{[^}]*content:attr\(data-language\)/);
expect(css).toMatch(/\.astro-code::after\{(?=[^}]*inset-inline-end:12px)(?=[^}]*bottom:8px)(?=[^}]*color:#3ac3d0)(?=[^}]*font-size:11px)/);
expect(css).toMatch(/\.code-frame-title\{[^}]*font-size:11px/);
expect(css).toMatch(/\.code-frame-header\{(?=[^}]*height:40px)(?=[^}]*background-color:#f0f0f1)/);
expect(css).toMatch(/html\[data-theme=dark\] \.code-frame-header\{[^}]*background-color:#232530/);
```

Add exact assertions for radius `10px`, light/dark borders and shadows, 11 px traffic lights, 30 px reserved lower strip, light/dark line hover, and the scrollbar rules below. Parse built post HTML and assert every `.astro-code` has one non-empty `data-language` value without adding a language child node.

- [ ] **Step 2: Run focused tests and observe RED**

Run:

```powershell
npm.cmd exec -- vitest run tests/codeThemes.test.ts
npm.cmd run build
npm.cmd exec -- vitest run tests/routes.test.ts -t "code blocks"
```

Expected: FAIL because the light background is `#fbfafb`, the frame surfaces are not separated, line hover/language label are absent, and the scrollbar uses one diagonal gradient with a 4 px pill border.

- [ ] **Step 3: Change only the Shiki light background**

In `src/codeThemes.ts`, change both light background entries from `#fbfafb` to `#fafafa`:

```ts
"editor.background": "#fafafa"
```

and:

```ts
{ settings: { background: "#fafafa", foreground: "#36373d" } }
```

Do not change any syntax foreground or scope mapping.

- [ ] **Step 4: Apply the final frame surfaces and fixed footer strip**

In `src/styles/typography.css`, keep the scrollport on the direct child code and apply the approved frame values:

```css
.astro-code {
  border-color: #dedede;
  border-radius: 10px;
  background-color: var(--shiki-light-bg);
  box-shadow: 0 8px 24px rgb(60 35 55 / 9%);
}

html[data-theme="dark"] .astro-code {
  border-color: #34353d;
  background-color: var(--shiki-dark-bg);
  box-shadow: 0 8px 24px rgb(0 0 0 / 22%);
}

.astro-code > code {
  max-height: 550px;
  margin-bottom: 30px;
  padding: 15px 17px 18px;
  overflow: auto;
}
```

Keep sufficient top padding for the fixed 40 px header. If the existing code/header stacking needs a single combined padding value, preserve the 15/17/18 content inset after the header rather than allowing text beneath it.

Set the header and decoration:

```css
.code-frame-header {
  height: 40px;
  padding-inline: 14px;
  border-color: #dedede;
  background-color: #f0f0f1;
}

html[data-theme="dark"] .code-frame-header {
  border-color: #2e303e;
  background-color: #232530;
}

.code-frame-light { width: 11px; height: 11px; }
.code-frame-title { font-size: 11px; }
```

Retain filename ellipsis and copy-control placement in the fixed header.

- [ ] **Step 5: Add per-line hover without overriding explicit states**

Make base Shiki lines fill the scrollable width and add the approved theme colors before the existing diff/highlight rules:

```css
.astro-code > code .line {
  display: inline-block;
  min-width: 100%;
  border-radius: 3px;
}

.astro-code > code .line:hover {
  background-color: #f1f1f2;
}

html[data-theme="dark"] .astro-code > code .line:hover {
  background-color: #262830;
}
```

Keep diff and highlighted-line rules later or more specific so their semantic backgrounds win.

- [ ] **Step 6: Restore the axis-specific gradient scrollbar**

Replace the diagonal thumb with:

```css
.astro-code > code::-webkit-scrollbar {
  width: 15px;
  height: 15px;
}

.astro-code > code::-webkit-scrollbar-thumb {
  border: 5px solid #fafafa;
  border-radius: 10px;
}

.astro-code > code::-webkit-scrollbar-thumb:horizontal {
  background: linear-gradient(to right, #3ac3d0, #c08ae5, #f06689, #ffd0aa);
}

.astro-code > code::-webkit-scrollbar-thumb:vertical {
  background: linear-gradient(to bottom, #3ac3d0, #c08ae5, #f06689, #ffd0aa);
}

[data-theme="dark"] .astro-code > code::-webkit-scrollbar-thumb {
  border-color: #1c1e26;
}
```

Keep `scrollbar-color: #c08ae5 transparent` as the non-gradient fallback.

- [ ] **Step 7: Add the fixed language label**

Use the existing Shiki attribute:

```css
.astro-code::after {
  position: absolute;
  inset-inline-end: 12px;
  bottom: 8px;
  color: #3ac3d0;
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1;
  text-transform: uppercase;
  pointer-events: none;
  content: attr(data-language);
}
```

Do not add a DOM label or modify the filename transformer. The reserved 30 px strip prevents overlap with code and scrollbars.

- [ ] **Step 8: Verify every code state**

Run:

```powershell
npm.cmd exec -- vitest run tests/codeThemes.test.ts
npm.cmd run build
npm.cmd exec -- vitest run tests/routes.test.ts -t "code blocks"
npm.cmd exec -- vitest run tests/postInteractions.test.ts
```

Expected: palette, built frame, both gradient axes, line hover, language label, filename/no-filename blocks, copy lifecycle, focus lifecycle, diff/highlight states, and line-number absence all pass.

- [ ] **Step 9: Run the full gate**

Run:

```powershell
npm.cmd run format:check
npm.cmd run lint
npm.cmd test
npm.cmd run astro -- check
npm.cmd run build
git diff --check
```

Expected: all commands exit 0; only the known static legacy redirect Pagefind warning may remain.

- [ ] **Step 10: Commit**

```powershell
git add src/codeThemes.ts src/styles/typography.css tests/codeThemes.test.ts tests/routes.test.ts
git commit -m "style(code): 코드 프레임과 그라데이션 스크롤바를 시안에 맞춘다"
```

---

### Task 3: Callout and code visual gate

**Files:** none

**Interfaces:**
- Consumes the CSS and theme contracts from Tasks 1 and 2.
- Produces no new runtime interface.

- [ ] **Step 1: Audit built markup and CSS**

After a production build, verify every code block has exactly one frame header, three traffic lights, one `data-language`, no language child node, no line-number markup/counter CSS, and unchanged diff/highlight hooks. Verify ordinary and collapsible Callouts retain plugin markup.

- [ ] **Step 2: Compare both themes and scroll directions**

At desktop and 320 px, compare Callouts and filename/filename-less code blocks against the approved visual screens. Hover individual code lines, scroll horizontally and vertically, and confirm the language label and fixed header never overlap either scrollbar. If live browser automation is unavailable, record the limitation and use generated HTML/CSS plus viewport calculations.

- [ ] **Step 3: Run the complete gate**

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

Expected: all commands pass and the worktree is clean after the task commits.

