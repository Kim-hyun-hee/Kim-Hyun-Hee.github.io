# Post List Visual Alignment Design

## Goal

Bring the shared post-list rows back to the approved `A · Full-width rules`
mockup. The existing route composition and responsive layout remain; this
change corrects visual details that were lost when the mockup was implemented.

## Scope

- Update the shared `Card.astro` row used by home, posts, tag, category, and
  Archives lists.
- Preserve Series accordion and project portfolio designs unchanged.
- Preserve the existing list header, pagination, All posts action, routing,
  ordering, links, and heading levels.
- Do not add reading-time calculation or content fields.

## Approved Row Design

### Structure

- Keep one semantic `<li data-post-row>` per post.
- Desktop uses a compact date axis followed by the content column.
- Mobile stacks the date above the content without horizontal overflow.
- The list has an accent-colored top rule; every row has a neutral bottom rule.
- Each row uses approximately 15 px vertical padding.
- Hover uses the original quiet left-to-right accent-muted gradient and does
  not turn the row into a card.

### Date

- Visible format: `YYYY.MM.DD`, for example `2026.06.29`.
- Keep the machine-readable ISO value in `<time datetime>`.
- Desktop date column is approximately 78 px with a 13 px gap to the content.
- Date text is compact, muted, single-line, and medium weight.

### Typography and Metadata

- Title: approximately 16 px, strong editorial weight, compact line height.
- Metadata: approximately 11 px, accent color.
- Description: approximately 13 px with a restrained foreground color and
  comfortable line height.
- Do not show reading time.
- Show at most one taxonomy label:
  - prefer the subcategory label when a post has a subcategory;
  - otherwise show the category label;
  - omit the metadata row when neither exists.
- Use the existing taxonomy registry for display labels. Do not duplicate
  labels or add frontmatter.

## Interaction and Accessibility

- The post title remains the link and retains the existing dashed
  focus-visible outline behavior.
- Hover tint is decorative only; contrast and link meaning cannot depend on it.
- The entire row does not become a link or button.
- Heading variants (`h2`, `h3`, `h4`) remain intact for each consumer.
- Reduced motion needs no special rule because the hover change is a simple
  color/background transition and no structural animation is added.

## Implementation Boundary

- Prefer a small `Card.astro` and `Datetime.astro` change plus existing theme
  tokens; do not create another card abstraction.
- If a list-level top rule cannot be expressed reliably by the first shared
  row, use `first:` styling on the row rather than modifying every route.
- Keep the change mostly presentational. The only markup addition is the
  already-available taxonomy label.

## Verification

- Rendered-output tests cover home, posts, tag, direct-category,
  subcategory, and Archives consumers.
- Verify exact row ordering: date, title, optional taxonomy, description.
- Verify `YYYY.MM.DD`, no reading-time text, one top accent rule, neutral row
  dividers, and the gradient hover recipe.
- Verify category-less posts omit the metadata line.
- Run format, lint, full tests, Astro check, and production build.
- Compare desktop and 320 px output against the approved visual companion
  screen. If browser automation is unavailable, document that limitation and
  audit generated HTML/CSS.

## Out of Scope

- Pagination, All posts, Archives hierarchy, Series, About projects, Markdown,
  Callouts, and code-block themes.
- New reading-time logic.
- Route or content-schema changes.

