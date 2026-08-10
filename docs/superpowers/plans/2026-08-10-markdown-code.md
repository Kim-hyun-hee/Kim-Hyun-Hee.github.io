# Markdown and Code Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine Markdown typography, correct callout alignment, and replace the current blue-dark code blocks with the approved adaptive Horizon B palette and macOS frame.

**Architecture:** Keep Shiki as the only syntax highlighter and keep `rehype-callouts` intact. Register two raw TextMate themes with the approved role colors, then style the existing Shiki/filename/copy markup through CSS. Markdown refinements remain local overrides in `typography.css`; client JavaScript does not rewrite token spans or code lines.

**Tech Stack:** Astro 7, Shiki, rehype-callouts, TypeScript 6, Vitest 4, CSS

## Global Constraints

- All commit subjects use `type(scope): 한글 설명`.
- Do not modify the untracked `.claude/` directory.
- Do not add Highlight.js or another highlighting dependency.
- Do not add line numbers.
- Keep diff, highlighted-line, highlighted-word, filename, and copy behavior.
- Keep the 15 px gradient scrollbar in both themes.

---

### Task 1: Apply the approved dark site accent tokens

**Files:**
- Modify: `src/styles/theme.css`
- Test: `tests/routes.test.ts`

**Interfaces:**
- Light site accent remains `#8387d3`; light sky remains `#8fb4dd`.
- Dark site tokens become accent `#e58d7d`, sky `#efb993`, accent foreground `#1c1e26`, accent muted `#302321`, and sky muted `#302820`.

- [ ] **Step 1: Add generated-CSS assertions**

Assert the built stylesheet contains every approved dark token and retains both approved light tokens.

- [ ] **Step 2: Confirm failure**

Run: `pnpm build && pnpm vitest run tests/routes.test.ts -t "다크 포인트 색"`

Expected: FAIL because the current dark site palette is still orange/gold.

- [ ] **Step 3: Change only the dark accent family**

Update the dark-mode declarations:

```css
--accent: #e58d7d;
--sky: #efb993;
--accent-foreground: #1c1e26;
--accent-muted: #302321;
--sky-muted: #302820;
```

Leave neutral background, foreground, border, link, sidebar, and all light tokens unchanged.

- [ ] **Step 4: Verify**

Run: `pnpm build && pnpm vitest run tests/routes.test.ts`

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/styles/theme.css tests/routes.test.ts
git commit -m "feat(theme): 다크 포인트 색을 연어색과 황금색으로 맞춘다"
```

### Task 2: Refine Markdown typography and tables

**Files:**
- Modify: `src/styles/typography.css`
- Test: `tests/routes.test.ts`

**Interfaces:**
- Heading IDs remain; decorative heading `#` links do not return.
- Prose links use neutral text with an accent underline.
- Tables have one rounded outer shell; blockquotes retain their current structure.

- [ ] **Step 1: Add Markdown specimen assertions**

Use an existing Markdown-rich built post and assert it contains heading IDs, prose links, blockquotes, and tables. Assert it contains no `.heading-link` anchor.

- [ ] **Step 2: Confirm the style assertions fail**

Run: `pnpm build && pnpm vitest run tests/routes.test.ts -t "마크다운 요소"`

Expected: FAIL because links and table framing do not yet match the approved rules.

- [ ] **Step 3: Apply restrained prose styles**

Use accent-colored underline decoration for prose anchors while keeping their text color inherited. Preserve keyboard focus rings. Wrap table overflow on its existing container, move border/radius to the outer shell, and avoid double borders on cells. Keep the current quote rail and image/lightbox styling.

- [ ] **Step 4: Verify**

Run: `pnpm lint && pnpm astro check && pnpm build && pnpm vitest run tests/routes.test.ts`

Expected: all pass. Manually check heading fragment links still work when entered directly in the address bar.

- [ ] **Step 5: Commit**

```bash
git add src/styles/typography.css tests/routes.test.ts
git commit -m "style(markdown): 본문 링크와 표의 경계를 정돈한다"
```

### Task 3: Correct callout alignment without forking the plugin

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/styles/typography.css`
- Test: `tests/routes.test.ts`

**Interfaces:**
- Existing `rehype-callouts/theme/obsidian` import remains.
- Local overrides use documented callout classes after the import.
- Padding is 14 px by 16 px; radius is 8 px.

- [ ] **Step 1: Add callout markup and CSS assertions**

Assert a callout specimen retains plugin classes and the built CSS contains local `.callout-title` alignment and `.callout-content` margin normalization.

- [ ] **Step 2: Confirm failure**

Run: `pnpm build && pnpm vitest run tests/routes.test.ts -t "콜아웃"`

Expected: FAIL because the title remains top-biased.

- [ ] **Step 3: Add the minimal override**

```css
.callout {
  padding: 14px 16px;
  border-radius: 8px;
}

.callout-title {
  align-items: center;
}

.callout-title-text {
  margin: 0;
}

.callout-content > :first-child { margin-top: 0; }
.callout-content > :last-child { margin-bottom: 0; }
```

Do not add a title bar, rail, inner separator, or replacement semantic palette.

- [ ] **Step 4: Verify all callout states**

Run: `pnpm astro check && pnpm build && pnpm vitest run tests/routes.test.ts`

Expected: all pass. Manually inspect ordinary and collapsible callouts in both themes; icon, title, and fold control share a vertical center.

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css src/styles/typography.css tests/routes.test.ts
git commit -m "fix(markdown): 콜아웃 제목과 본문의 정렬을 바로잡는다"
```

### Task 4: Register adaptive Horizon B Shiki themes

**Files:**
- Create: `src/codeThemes.ts`
- Modify: `astro.config.ts`
- Create: `tests/codeThemes.test.ts`

**Interfaces:**
- Light background/foreground: `#fbfafb` / `#36373d`.
- Dark background/foreground: `#1c1e26` / `#cbced0`.
- Function colors: light `#3f75a9`, dark `#8fb4dd`.
- Raw themes cover comment, tag, punctuation, variable, number/attribute, title/class, string, built-in/regexp, function, keyword/type, and meta scopes.

- [ ] **Step 1: Write exact palette tests**

Import both raw themes and assert these role pairs:

| Role | Light | Dark |
| --- | --- | --- |
| foreground | `#36373d` | `#cbced0` |
| comment | `#767277` | `#6f6f70` |
| tag | `#666369` | `#9da0a2` |
| variable | `#c72f4c` | `#e93c58` |
| attribute/number | `#b65345` | `#e58d7d` |
| title/class | `#986039` | `#efb993` |
| string | `#a94d32` | `#efaf8e` |
| built-in/regexp | `#147985` | `#24a8b4` |
| function | `#3f75a9` | `#8fb4dd` |
| keyword/type | `#8249a0` | `#b072d1` |
| meta | `#a65b39` | `#e4a382` |

- [ ] **Step 2: Confirm failure**

Run: `pnpm vitest run tests/codeThemes.test.ts`

Expected: FAIL because the raw themes do not exist.

- [ ] **Step 3: Implement two TextMate themes**

Export plain raw-theme objects `horizonLight` and `horizonDark`, validated when passed to Astro's Shiki configuration. This avoids adding a direct Shiki package solely for a type import. Map each tested role to the corresponding TextMate scopes, including `entity.name.function`, `support.function`, `keyword`, `storage.type`, `string`, `constant.numeric`, and comment scopes. Give the two themes unique names.

- [ ] **Step 4: Register them in Astro**

Replace the current `min-light`/`night-owl` selection:

```ts
shikiConfig: {
  themes: {
    light: horizonLight,
    dark: horizonDark,
  },
  transformers: [/* preserve the existing transformer list */],
}
```

Do not change the transformer ordering.

- [ ] **Step 5: Verify token output**

Run: `pnpm vitest run tests/codeThemes.test.ts && pnpm astro check && pnpm build`

Expected: all pass and built code blocks expose light/dark Shiki variables using the new theme colors.

- [ ] **Step 6: Commit**

```bash
git add src/codeThemes.ts astro.config.ts tests/codeThemes.test.ts
git commit -m "feat(code): 라이트와 다크에 맞춘 호라이즌 테마를 추가한다"
```

### Task 5: Apply the macOS code frame and retained scrollbar

**Files:**
- Modify: `src/styles/typography.css`
- Modify: `src/utils/transformers/fileName.js`
- Test: `tests/routes.test.ts`

**Interfaces:**
- Traffic lights: red `#f5655b`, yellow `#f6bd3b`, green `#43c645`.
- Code block maximum height: 550 px.
- Scrollbar width/height: 15 px.
- Thumb gradient: `#3ac3d0 → #c08ae5 → #f06689 → #ffd0aa`.
- No line-number markup or counter CSS.

- [ ] **Step 1: Add frame assertions**

Assert a filename code block has a frame header, copy button, and traffic-light decoration. Assert the built CSS contains all four gradient stops, both theme backgrounds, `max-height: 550px`, and no line-number selector.

- [ ] **Step 2: Confirm failure**

Run: `pnpm build && pnpm vitest run tests/routes.test.ts -t "코드 블록"`

Expected: FAIL because the current frame and dark background differ.

- [ ] **Step 3: Style existing Shiki markup**

Use the filename transformer output as the frame header hook. Add three pseudo-element or child-dot circles without inserting code-line wrappers. Set adaptive frame/background variables, keep horizontal and vertical overflow on the code area, cap it at 550 px, and preserve the native copy control established by post interactions.

Apply the retained scrollbar:

```css
.astro-code::-webkit-scrollbar {
  width: 15px;
  height: 15px;
}

.astro-code::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #3ac3d0, #c08ae5, #f06689, #ffd0aa);
  border: 4px solid #fbfafb;
  border-radius: 999px;
}

[data-theme="dark"] .astro-code::-webkit-scrollbar-thumb {
  border-color: #1c1e26;
}
```

Provide equivalent `scrollbar-color` fallback without removing the gradient for WebKit/Blink.

- [ ] **Step 4: Verify every syntax color and scroll state**

Run: `pnpm lint && pnpm astro check && pnpm test && pnpm build`

Expected: all pass.

Manually inspect a specimen containing comments, tags, variables, numbers, attributes, classes, strings, built-ins, regexps, functions, keywords, types, and meta tokens. Check both themes, copy success/reset, long horizontal lines, more than 550 px of vertical content, and both scrollbars. Confirm no line numbers appear.

- [ ] **Step 5: Commit**

```bash
git add src/styles/typography.css src/utils/transformers/fileName.js tests/routes.test.ts
git commit -m "feat(code): 코드 블록에 맥 스타일 프레임과 스크롤바를 입힌다"
```

### Task 6: Markdown and code gate

**Files:** none

- [ ] **Step 1: Run the complete gate**

Run: `pnpm format:check && pnpm lint && pnpm test && pnpm build`

Expected: all commands exit 0; the adaptive Horizon B palette, macOS frame, gradient scrollbars, callout alignment, and Markdown refinements are present in both themes.
