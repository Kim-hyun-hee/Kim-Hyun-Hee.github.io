# Callout and Code Block Visual Alignment Design

## Goal

Restore the approved Callout rhythm and macOS code-frame details that were
missing from the first implementation, including neutral light surfaces,
axis-aware gradient scrollbars, line hover, and a bottom-right language label.

## Scope

- Refine the existing `rehype-callouts` local CSS overrides.
- Refine the existing Shiki/macOS frame; keep Shiki as the only syntax
  highlighter.
- Reuse Shiki's existing `<pre data-language>` output for the language label.
- Preserve code copy, filename, diff, highlighted-line, highlighted-word,
  focus, and page-transition lifecycle behavior.
- Do not add line numbers, ClipboardJS, Highlight.js, or a new dependency.

## Approved Callout Design

- Keep the Obsidian semantic colors, icons, Callout types, collapsible syntax,
  and one-piece tinted background.
- Shell padding remains `14px 16px`; radius remains `8px`.
- Callout line height is `1.55`.
- Title row:
  - minimum height `20px`;
  - vertically centered;
  - icon/title gap `7px`;
  - line height `1.4`;
  - title margin `0`;
  - fold control vertically centered at the inline end.
- Content:
  - top margin `7px`;
  - inline-start padding `25px` so body copy aligns with the title text;
  - first and last child margins remain normalized.
- A very subtle `saturate(1.03)` hover may be retained from the approved
  mockup; it cannot change meaning or contrast.

## Approved Code Frame

### Shared Frame

- Outer radius: `10px`.
- Header height: `40px`.
- Traffic lights: `11px`; red `#f5655b`, yellow `#f6bd3b`, green `#43c645`.
- Filename and language labels: `11px` monospace.
- Code area maximum height: `550px`; only the code area scrolls.
- Reserve a fixed `30px` lower strip so the language label does not overlap
  code text or either scrollbar.
- Keep the header, filename, copy button, and language label fixed while the
  code area scrolls.

### Light Mode

- Code surface: neutral `#fafafa`.
- Header surface: neutral `#f0f0f1`.
- Border: `#dedede`.
- Line hover: `#f1f1f2`.
- The Shiki light theme background must also be `#fafafa`; syntax role colors
  remain unchanged.
- Use a restrained neutral shadow equivalent to the approved mockup.

### Dark Mode

- Code surface remains `#1c1e26`.
- Header surface: `#232530`.
- Border: `#34353d`; header separator `#2e303e`.
- Line hover: `#262830`.
- Use the approved dark shadow without adding blue to the surface.

### Line Hover

- Hover changes only the row under the pointer.
- Light hover is `#f1f1f2`; dark hover is `#262830`.
- Diff additions/removals, explicitly highlighted lines, and word highlights
  remain more specific and are not visually erased by hover.
- No line-number markup, counters, or pseudo-elements are added.

### Gradient Scrollbars

- Width and height: `15px`.
- Thumb border: `5px`; radius `10px`.
- Stops: `#3ac3d0`, `#c08ae5`, `#f06689`, `#ffd0aa`.
- Horizontal thumb flows left to right.
- Vertical thumb flows top to bottom.
- Border color matches the code surface in each theme: `#fafafa` / `#1c1e26`.
- Preserve a solid-color `scrollbar-color` fallback for browsers that do not
  render WebKit gradients.

### Language Label

- Use the existing Shiki `data-language` attribute:

```css
.astro-code::after {
  content: attr(data-language);
}
```

- Position at inline-end `12px`, bottom `8px`.
- Color: `#3ac3d0`.
- Size: `11px`, matching the filename label.
- Font: the existing monospace stack.
- Render uppercase for compact consistency.
- Decorative and non-interactive; it must not enter the tab order or duplicate
  the code block's accessible name.

## Interaction and Accessibility

- The actual code scrollport remains keyboard focusable and keeps its filename
  `aria-labelledby` or fallback `aria-label`.
- Copy control retains its current accessible text and cleanup/re-init logic.
- Frame decoration and language label are ignored by assistive technology.
- Filename ellipsis still preserves the full accessible text.
- Focus outline remains on the real scrollport.

## Implementation Boundary

- Prefer CSS changes in `typography.css` and `global.css` plus the existing raw
  Shiki theme background value.
- Reuse `data-language`; do not add a transformer solely for the label.
- Change the filename transformer only if required to expose stable hooks
  already described here.
- Do not rewrite code lines in client JavaScript.

## Verification

- Build a specimen with filename and filename-less blocks, long horizontal
  code, more than 550 px of vertical code, every syntax role, diff lines,
  highlighted lines, and highlighted words.
- Verify both themes, line hover, copy success/reset, keyboard scrolling,
  filename ellipsis, language label, and both scrollbar axes.
- Assert generated CSS contains exact light/dark frame values, axis-specific
  gradients, language pseudo-element, and no line-number selector.
- Assert every generated code block has exactly one frame header, three traffic
  lights, one language data value, and no duplicate label markup.
- Run format, lint, full tests, Astro check, and production build.
- If live browser automation is unavailable, document the limitation and audit
  generated HTML/CSS plus the approved visual companion screen.

## Out of Scope

- Syntax-role colors other than the light background token.
- Markdown tables, prose links, post-list rows, Series, About, and Archives.
- New Callout types or semantic color palettes.
- Code execution, line numbers, or a code-language selector UI.

