# 팔레트와 스케일 재설계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 무채색 UI에 보라 포인트 색을 도입하되, 색이 본문 크기 텍스트로 번지지 않게 배치 규칙을 함께 세운다.

**Architecture:** 색값은 전부 `src/styles/theme.css`의 CSS 변수 한 곳에 있고 컴포넌트는 Tailwind 토큰 유틸리티(`bg-accent`, `decoration-accent`)로만 접근한다 — 어느 컴포넌트에도 hex를 쓰지 않는다. 그래서 나중에 색을 바꾸거나 배치를 되돌릴 때 값은 한 줄, 배치는 해당 컴포넌트 한 줄로 끝난다. 태스크는 "토큰 교체 → 텍스트에서 색 빼기 → 표시 추가 → 인용문 → 제목 → 여백" 순으로, 앞 태스크가 뒤 태스크의 전제가 되도록 배열했다.

**Tech Stack:** Astro 5, Tailwind CSS v4 (`@theme inline` 토큰), TypeScript

**설계 문서:** `docs/superpowers/specs/2026-08-07-palette-and-scale-design.md`

## Global Constraints

- **패키지 매니저는 pnpm이고 PATH에 없다.** 모든 명령은 `corepack pnpm ...`. `npm install`을 절대 돌리지 않는다.
- **`corepack pnpm format`을 저장소 전체에 돌리지 않는다.** 기존 드리프트로 무관한 파일 90여 개가 재포맷된다. 건드린 파일만 경로로 지정해 `corepack pnpm exec prettier --write <경로>`.
- **`git add -A` / `git add .` 금지.** 경로로 명시해 스테이징하고 커밋 전 `git status --short`로 확인한다.
- **커밋 메시지와 코드 주석에 다음 고유명사를 쓰지 않는다:** hELLO, Inpa Dev, 티스토리, Tistory.
- **커밋 메시지와 코드 주석은 한국어로 쓴다.**
- **컴포넌트에 색 hex를 직접 쓰지 않는다.** 반드시 토큰 유틸리티를 거친다.
- **포인트 색은 본문 크기 텍스트에 쓰지 않는다.** 선·테두리·배경 틴트·밑줄·아이콘·진행 바·활성 표시·선택 영역에만 쓴다. 유일한 예외는 404 페이지의 `text-9xl` 숫자다.
- 전체 검증은 `corepack pnpm build` 후 `corepack pnpm test` 를 따로 돌린다. `corepack pnpm verify` 는 내부에서 맨 `pnpm`을 호출해 실패한다.
- `tests/routes.test.ts` 는 빌드된 `dist/`가 있어야 돈다. 테스트 전에 빌드한다.
- 이 계획은 `src/series.ts` / `src/categories.ts` / `content.config.ts` 를 건드리지 않으므로 dev 서버 재시작이 필요 없다.

---

### Task 1: 팔레트 토큰 교체

**Files:**
- Modify: `src/styles/theme.css` (전체 교체)
- Modify: `src/components/Tag.astro`
- Modify: `src/styles/typography.css` (39-41행 주석)
- Modify: `CLAUDE.md` (git에 커밋되지 않는 파일 — 스테이징하지 말 것)

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces: 유틸리티 `bg-accent` `text-accent` `decoration-accent` `outline-accent` `bg-accent-muted` `text-accent-foreground` `bg-sky` `bg-sky-muted` `text-link` `text-sidebar-link` `bg-muted` `text-muted-foreground` `border-border` `text-foreground` `bg-background`
- 없어짐: `--brand` / `--tag-hover` / `--tag-hover-foreground` 와 대응 유틸리티

이 태스크가 끝나면 사이트 색이 전부 바뀌지만 **글 제목에도 보라가 들어간 상태**가 된다. 그건 Task 2가 걷어낸다. 이 태스크의 완료 조건은 "색값이 바뀌고 빌드가 통과한다"까지다.

- [ ] **Step 1: `theme.css`를 통째로 교체한다**

`src/styles/theme.css` 전체를 아래로 바꾼다.

```css
/* [CUSTOM] 이 파일은 값이 전부 교체됐습니다.
   업스트림과 달라진 것: 라이트/다크 색값, --link·--accent-muted·--sky·
   --sky-muted·--sidebar-link 토큰 신설, --font-app/--font-mono가 가리키는
   폰트, 레이아웃 폭 토큰 3개 추가.
   업스트림에 있던 토큰 "이름"은 그대로라 기존 유틸리티는 전부 동작합니다.
   병합 충돌이 나면 값 선택의 문제이니 이쪽을 유지하면 됩니다.

   ── 포인트 색을 쓰는 원칙 ──────────────────────────────────
   포인트 색(--accent)은 "표시"에만 씁니다 — 선, 테두리, 배경 틴트, 밑줄,
   아이콘, 진행 바, 활성 표시, 선택 영역.

   본문 크기 텍스트(제목·링크·목록 항목)에는 쓰지 않습니다. 라이트의
   #7e82d8은 흰 배경에서 3.4:1이라 작은 글씨에 쓰면 흐리고, 글자마다 색이
   들어가면 화면이 시끄러워집니다. 링크는 글씨를 --link 로 두고 밑줄만
   --accent 로 칠합니다.

   예외는 24px 이상 큰 글씨입니다. 대비 기준이 3:1이라 통과합니다. 지금
   해당하는 곳은 404 페이지의 숫자 하나뿐입니다.

   --sky 는 독립된 포인트 색이 아니라 --accent 와 함께 그라데이션을 만드는
   짝입니다. 단독으로 쓰지 마세요. 지금은 본문 인용문 배경에만 쓰입니다.

   관련 설계: docs/superpowers/specs/2026-08-07-palette-and-scale-design.md */

/* Register design tokens for Tailwind v4 */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent-muted: var(--accent-muted);
  --color-sky: var(--sky);
  --color-sky-muted: var(--sky-muted);
  --color-link: var(--link);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-sidebar-link: var(--sidebar-link);
  --font-app: var(--font-suit);
  --font-mono: var(--font-jetbrains-mono);
}

/* Light theme values */
:root,
[data-theme="light"] {
  --background: #fcfdff;
  --foreground: #2e3442;
  --accent: #7e82d8;
  --accent-foreground: #ffffff;
  --accent-muted: #eceeff;
  --sky: #79c8ea;
  --sky-muted: #eaf8ff;
  --link: #3d4453;
  --muted: #f3f7fc;
  --muted-foreground: #717889;
  --border: #e1e8f2;
  --sidebar-link: #9aa2b3;
}

/* Dark theme values */
[data-theme="dark"] {
  --background: #16181f;
  --foreground: #e6e9f0;
  --accent: #a5a8ea;
  --accent-foreground: #16181f;
  --accent-muted: #2b2f4a;
  --sky: #8fd2f0;
  --sky-muted: #1c2a35;
  --link: #c9cedb;
  --muted: #232733;
  --muted-foreground: #9aa1b2;
  --border: #2e3342;
  --sidebar-link: #9aa1b2;
}

/* Layout widths — single source, referenced by shell and TOC */
:root {
  --sidebar-width: 256px;
  --toc-width: 224px;
  /* Single source for article width. max-w-app (global.css) and the
     floating TOC position math both read this. */
  --content-width: 48rem;
}
```

없어진 것을 확인하라 — `--brand`, `--tag-hover`, `--tag-hover-foreground`, 그리고 그것들을 담고 있던 `:root` 블록.

- [ ] **Step 2: 태그 칩의 hover를 새 토큰으로 바꾼다**

`src/components/Tag.astro`에서 `class:list` 안의 이 두 줄을

```astro
      "hover:bg-tag-hover hover:text-tag-hover-foreground",
      "focus-visible:bg-tag-hover focus-visible:text-tag-hover-foreground",
```

이렇게 바꾼다.

```astro
      "hover:bg-accent-muted hover:text-foreground",
      "focus-visible:bg-accent-muted focus-visible:text-foreground",
```

- [ ] **Step 3: `typography.css`의 낡은 주석을 고친다**

`src/styles/typography.css` 39-41행의 주석을

```css
    /* [CUSTOM] 업스트림은 `text-accent`였습니다. 강조색과 링크색을 분리해
       강조색은 파랑, 본문 링크는 무채색으로 두기로 해서 text-link로 바꿨습니다.
       나머지 유틸(줄바꿈·점선 밑줄·오프셋)은 업스트림 원본입니다. */
```

이렇게 바꾼다.

```css
    /* [CUSTOM] 업스트림은 `text-accent`였습니다. 포인트 색은 본문 크기
       텍스트에 쓰지 않기로 해서 글씨는 --link 로 두고 밑줄만 포인트 색을
       칠합니다. 나머지 유틸(줄바꿈·오프셋)은 업스트림 원본입니다. */
```

같은 블록의 `a` 규칙도 바꾼다. 점선 밑줄을 실선 + 포인트 색으로 바꾼다.

```css
    a {
      @apply text-link decoration-accent wrap-break-word underline-offset-4 focus-visible:no-underline;
    }
```

- [ ] **Step 4: 남은 참조가 없는지 확인**

Run: `git grep -nE "brand|tag-hover" -- src/`
Expected: 아무것도 안 나옴. `src/content/` 에서 나오면 글 본문이니 그대로 둔다

- [ ] **Step 5: 빌드로 검증**

Run: `corepack pnpm build`
Expected: 0 errors

Run: `grep -o '\-\-accent:[^;]*' dist/_astro/*.css | head -2`
Expected: `--accent:#7e82d8` 과 `--accent:#a5a8ea` 가 나온다

- [ ] **Step 6: `CLAUDE.md`의 색 원칙을 갱신한다**

`CLAUDE.md`에 "색 운용 원칙 (이후 결정)"이라는 문단이 있고 "블로그 UI에는 유채색을 쓰지 않는다"로 시작한다. **이 파일은 git에 커밋되지 않지만 다음 세션의 작업 기준이 되므로 반드시 고친다.**

그 문단을 새 원칙으로 다시 쓴다 — 포인트 색은 보라(`#7e82d8` / `#a5a8ea`)이고, "표시"에만 쓰며 본문 크기 텍스트에는 쓰지 않는다는 것, `--sky`는 그라데이션 짝이라 단독으로 쓰지 않는다는 것, 그리고 설계 문서 경로.

같은 파일의 팔레트 표(원본 토큰 ↔ 값 대응)도 지금 값과 어긋나므로 새 값으로 갱신한다.

- [ ] **Step 7: 포맷하고 커밋**

`CLAUDE.md`는 gitignore 대상이므로 스테이징되지 않는다. `git status --short`에 안 보이는 것이 정상이다.

```bash
corepack pnpm exec prettier --write src/styles/theme.css src/styles/typography.css src/components/Tag.astro
git status --short
git add src/styles/theme.css src/styles/typography.css src/components/Tag.astro
git commit -m "feat(theme): 보라 포인트 색 도입, 무채색 원칙 폐기

UI에 유채색을 쓰지 않는다는 원칙을 접고 포인트 색을 넣는다. 남겨둔
탈출구(--accent 값 하나)가 실제로 작동해 호출부는 손대지 않아도 됐다.

--brand 는 역할이 끝나 지우고, --accent-muted / --sky / --sky-muted 를
새로 만들었다. 태그 칩 hover는 --accent-muted 로 처리되므로 하루 만에
--tag-hover 두 개도 없어진다."
```

---

### Task 2: 텍스트에서 포인트 색 걷어내기

**Files:**
- Modify: `src/components/Card.astro:20`
- Modify: `src/components/home/HomeSeries.astro:45`
- Modify: `src/components/layout/Sidebar.astro:52, 64`
- Modify: `src/components/layout/TopBar.astro:30`
- Modify: `src/components/LinkButton.astro:15`
- Modify: `src/pages/categories/index.astro:35`
- Modify: `src/pages/series/index.astro:34`
- Modify: `src/pages/categories/[category]/index.astro:66, 86, 104`
- Modify: `src/pages/posts/[...slug]/index.astro:134`
- Modify: `src/pages/posts/[...slug]/_components/EditPost.astro:29`
- Modify: `src/components/series/SeriesBadge.astro`

**Interfaces:**
- Consumes: Task 1의 토큰 유틸리티 — 특히 `decoration-accent`, `text-foreground`, `text-link`
- Produces: 없음

**공통 치환 규칙.** 두 패턴뿐이다.

1. `text-accent` (글씨 색) → `text-foreground` 또는 `text-link` + `decoration-accent`
2. `hover:text-accent` (hover 시 글씨 색) → `hover:underline underline-offset-4 decoration-accent`

**줄 번호는 참고용이다. 주변 코드로 찾아라.**

- [ ] **Step 1: 글 제목에서 색을 뺀다**

`src/pages/posts/[...slug]/index.astro` — `<h1>` 의 class:

```astro
      class="text-foreground inline-block text-2xl font-bold sm:text-3xl"
```

- [ ] **Step 2: 카드·목록 항목 제목 네 곳을 바꾼다**

`src/components/Card.astro` (`class:list` 첫 항목):

```astro
      "text-foreground decoration-accent inline-block text-lg font-medium underline-offset-4 hover:underline",
```

`src/pages/categories/index.astro`:

```astro
          class="text-foreground decoration-accent text-lg font-semibold underline-offset-4 hover:underline"
```

`src/pages/series/index.astro`:

```astro
          class="text-foreground decoration-accent text-lg font-semibold underline-offset-4 hover:underline"
```

`src/pages/categories/[category]/index.astro` (104행 근처, 소분류 안의 항목):

```astro
                  class="text-foreground decoration-accent text-lg font-semibold underline-offset-4 hover:underline"
```

`Card.astro`의 `font-medium`은 그대로 둔다 — 제목 굵기는 Task 5가 일괄 정리한다.

- [ ] **Step 3: "더 보기" 링크를 무채색 링크로 바꾼다**

`src/pages/categories/[category]/index.astro` (86행 근처):

```astro
                  class="text-link decoration-accent text-sm underline-offset-4 hover:underline"
```

- [ ] **Step 4: hover 색을 밑줄로 바꾼다 (여섯 곳)**

`src/components/home/HomeSeries.astro`:

```astro
          class="text-foreground decoration-accent font-semibold underline-offset-4 hover:underline"
```

`src/components/layout/Sidebar.astro` (사이트 이름, 64행 근처):

```astro
    class="decoration-accent text-lg font-bold underline-offset-4 hover:underline"
```

`src/components/layout/TopBar.astro`:

```astro
      class="decoration-accent font-semibold underline-offset-4 hover:underline"
```

`src/components/LinkButton.astro` (`class:list` 안의 조건부 항목):

```astro
    { "hover:underline underline-offset-4 decoration-accent": !disabled },
```

`src/pages/categories/[category]/index.astro` (66행 근처, 소분류 제목 링크):

```astro
                  class="decoration-accent underline-offset-4 hover:underline"
```

`src/pages/posts/[...slug]/_components/EditPost.astro`:

```astro
    "text-muted-foreground decoration-accent flex justify-baseline gap-1.5 underline-offset-4 hover:underline",
```

- [ ] **Step 5: 건너뛰기 링크의 색을 뺀다**

`src/components/layout/Sidebar.astro` 52행 근처. 키보드 포커스에서만 보이는 접근성 링크다.

```astro
  class="bg-background text-foreground absolute inset-s-16 -top-full z-50 px-3 py-2 backdrop-blur-lg transition-all focus:top-4"
```

- [ ] **Step 6: 시리즈 배지의 링크를 확인한다**

`src/components/series/SeriesBadge.astro`의 연재명 링크는 지금 색 지정 없이 `underline-offset-4 hover:underline` 만 있다. 부모 `<p>`가 `text-muted-foreground`라 색은 그대로 두고 밑줄에만 포인트 색을 더한다.

```astro
    class="decoration-accent underline-offset-4 hover:underline"
```

- [ ] **Step 7: 남아 있어야 할 것을 확인한다**

Run: `git grep -n "text-accent" -- src/ ':!src/styles'`
Expected: **`src/pages/404.astro` 한 줄만** 나온다 (`text-accent text-9xl font-bold`). 다른 게 나오면 빠뜨린 것이다

Run: `git grep -n "bg-accent\|outline-accent\|marker:text-accent\|selection:bg-accent" -- src/`
Expected: 진행 바(`bg-accent`), 포커스 링(`outline-accent`), 목록 불릿(`marker:text-accent`), 선택 영역(`selection:bg-accent/75`)이 남아 있다. **이것들은 "표시"라 그대로 둔다**

- [ ] **Step 8: 빌드하고 눈으로 확인**

Run: `corepack pnpm build`
Expected: 0 errors

Run: `grep -c 'text-accent' dist/posts/digitaltwin/05-culling/index.html`
Expected: `0` — 글 페이지에 색 글씨가 없다

Run: `grep -o 'decoration-accent' dist/posts/index.html | head -1`
Expected: `decoration-accent` — 목록 카드에 포인트 색 밑줄이 붙었다

- [ ] **Step 9: 포맷하고 커밋**

```bash
corepack pnpm exec prettier --write src/components/Card.astro src/components/home/HomeSeries.astro src/components/layout/Sidebar.astro src/components/layout/TopBar.astro src/components/LinkButton.astro src/components/series/SeriesBadge.astro src/pages/categories/index.astro "src/pages/categories/[category]/index.astro" src/pages/series/index.astro "src/pages/posts/[...slug]/index.astro" "src/pages/posts/[...slug]/_components/EditPost.astro"
git status --short
git add src/components src/pages
git commit -m "feat(theme): 본문 크기 텍스트에서 포인트 색을 걷어냄

글씨는 먹색으로 두고 밑줄만 포인트 색을 칠한다. 라이트의 #7e82d8은 흰
배경에서 3.4:1이라 작은 글씨에 쓰면 흐리고, 글자마다 색이 들어가면 화면이
시끄러워진다.

404 숫자만 예외로 남긴다. 24px 이상은 대비 기준이 3:1이라 통과한다."
```

---

### Task 3: 활성 위치 표시 추가

**Files:**
- Modify: `src/components/toc/FloatingToc.astro`
- Modify: `src/components/layout/SidebarNav.astro`
- Modify: `src/components/related/SeriesPosts.astro`

**Interfaces:**
- Consumes: Task 1의 `--accent` 변수와 `border-s-accent` 유틸리티
- Produces: 없음

Task 2가 활성 항목에서 색 글씨를 뺐으므로, 지금 "지금 여기 있다"를 알려주는 신호가 굵기밖에 없다. 좌측 마커를 더해 신호를 되살린다.

- [ ] **Step 1: 목차 링크에 마커 자리를 만든다**

`src/components/toc/FloatingToc.astro`의 `<a>` class를 바꾼다. `<ul>`이 이미 `border-s`로 세로 레일을 그리고 있으므로, 마커는 그 레일 위에 겹쳐 앉는다.

```astro
                class="text-muted-foreground decoration-accent -ms-px block border-s-2 border-s-transparent ps-3 underline-offset-4 hover:underline"
```

- [ ] **Step 2: 스크롤 스파이가 마커를 켜게 한다**

같은 파일의 `setActive` 안에서

```ts
        a.classList.toggle("text-accent", on);
        a.classList.toggle("font-semibold", on);
        a.classList.toggle("text-muted-foreground", !on);
```

이 세 줄을 아래로 바꾼다.

```ts
        a.classList.toggle("text-foreground", on);
        a.classList.toggle("font-semibold", on);
        a.classList.toggle("border-s-accent", on);
        a.classList.toggle("text-muted-foreground", !on);
```

- [ ] **Step 3: 사이드바 활성 항목에 마커를 붙인다**

`src/components/layout/SidebarNav.astro`의 `<style>` 블록에서 `.cat-row` 규칙에 `position: relative;`를 더하고, 그 아래에 마커 규칙 두 개를 추가한다.

```css
  .cat-row {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    padding-right: 1.25rem;
    font-weight: 500;
    color: var(--sidebar-link);
    text-decoration: none;
  }
  .cat-row:hover,
  .cat-row.is-active {
    color: var(--foreground);
  }

  /* 활성 표시: 글씨 색만으로는 약해서 좌측에 포인트 색 막대를 둔다.
     사이드바의 좌우 여백(px-5) 안쪽에 자리 잡는다. */
  .cat-row.is-active::before,
  .sub-link.is-active::before {
    content: "";
    position: absolute;
    top: 0.15rem;
    bottom: 0.15rem;
    width: 2px;
    border-radius: 2px;
    background: var(--accent);
  }
  .cat-row.is-active::before {
    inset-inline-start: -0.75rem;
  }
  .sub-link.is-active::before {
    inset-inline-start: -0.9375rem;
  }
```

`.sub-link` 규칙에도 `position: relative;`를 더한다.

```css
  .sub-link {
    position: relative;
    display: inline-flex;
    align-items: center;
    font-size: 0.8125rem;
    color: var(--sidebar-link);
    text-decoration: none;
  }
```

`.sub-link`의 마커 위치가 `-0.9375rem`인 이유: `.subs`가 `padding-left: 1.75rem`이고 그 레일(`::before`)이 `left: 0.8125rem`에 있다. 차이가 `0.9375rem`이라 마커가 레일 위에 정확히 겹친다.

- [ ] **Step 4: 시리즈 현재 편 마커에 색을 준다**

`src/components/related/SeriesPosts.astro`의 마커 span:

```astro
            <span
              class="text-accent w-3 shrink-0 text-end"
              aria-hidden="true"
            >
```

`▸`는 글자지만 24px 미만이다. 대비 기준의 예외로 삼는 이유는 **이것이 텍스트가 아니라 순수 장식 표식**이고 `aria-hidden`이며, 같은 줄의 제목이 굵기로 이미 현재 위치를 알리기 때문이다. 색은 보조 신호다.

- [ ] **Step 5: 빌드하고 확인**

Run: `corepack pnpm build`
Expected: 0 errors

Run: `grep -o 'border-s-transparent' dist/posts/digitaltwin/05-culling/index.html | head -1`
Expected: `border-s-transparent` — 목차 링크에 마커 자리가 생겼다

Run: `grep -o 'cat-row is-active' dist/posts/unity-render-pipeline/01-what-srp-replaces/index.html`
Expected: 한 건 — 사이드바 활성 항목이 그대로 있다 (마커는 CSS `::before`라 HTML에 안 보인다)

Run: `grep -o 'text-accent w-3' dist/posts/building-this-blog/03-sidebar-shell/index.html`
Expected: 한 건 — 시리즈 현재 편 마커에 색이 붙었다

- [ ] **Step 6: 포맷하고 커밋**

```bash
corepack pnpm exec prettier --write src/components/toc/FloatingToc.astro src/components/layout/SidebarNav.astro src/components/related/SeriesPosts.astro
git status --short
git add src/components/toc/FloatingToc.astro src/components/layout/SidebarNav.astro src/components/related/SeriesPosts.astro
git commit -m "feat(theme): 활성 위치를 좌측 포인트 색 마커로 표시

앞 커밋에서 활성 항목의 색 글씨를 빼면서 \"지금 여기\" 신호가 굵기밖에
남지 않았다. 목차와 사이드바에 좌측 막대를 더해 신호를 되살린다.
막대는 텍스트가 아니라 표시라 대비 기준에서 자유롭다."
```

---

### Task 4: 인용문

**Files:**
- Modify: `src/styles/typography.css` (blockquote 규칙)

**Interfaces:**
- Consumes: Task 1의 `--accent` / `--accent-muted` / `--sky-muted` / `--muted-foreground`
- Produces: 없음

포인트 색과 그라데이션이 실제로 쓰이는 자리를 만든다. 지금은 `border-s-accent/80 opacity-80` — 좌측 선과 흐림뿐이다.

- [ ] **Step 1: blockquote 규칙을 교체한다**

`src/styles/typography.css`에서

```css
    blockquote {
      @apply border-s-accent/80 wrap-break-word opacity-80;
    }
```

이걸 아래로 바꾼다.

```css
    /* [CUSTOM] 업스트림은 좌측 선 + opacity-80 뿐이었습니다. opacity 를
       걷어낸 이유: 글씨 색을 직접 정하므로 투명도로 흐리게 만들 필요가
       없고, opacity 는 배경 그라데이션까지 함께 흐리게 만듭니다. */
    blockquote {
      @apply border-s-accent text-muted-foreground my-8 rounded-e-xl border-s-[3px] px-5 py-4 wrap-break-word;
      background: linear-gradient(
        100deg,
        var(--accent-muted),
        var(--sky-muted)
      );
    }
```

`linear-gradient`를 `@apply`가 아니라 일반 CSS로 쓰는 이유: Tailwind의 그라데이션 유틸리티는 색 정지점을 두 개의 별도 유틸리티(`from-*` / `to-*`)로 나누는데, 각도까지 지정하려면 임의값 문법이 길어져 오히려 읽기 어렵다. 여기서는 CSS 한 줄이 더 명확하다.

- [ ] **Step 2: 인용문이 있는 글을 찾는다**

Run: `git grep -ln "^> " -- src/content/posts/ | head -3`
Expected: 인용문을 쓰는 글이 하나 이상 나온다. 하나도 없으면 다음 스텝에서 임시 파일로 확인한다

- [ ] **Step 3: 빌드하고 확인**

Run: `corepack pnpm build`
Expected: 0 errors

Run: `grep -o 'linear-gradient([^)]*)' dist/_astro/*.css | grep -c 'accent-muted'`
Expected: `1` 이상 — 그라데이션이 번들에 들어갔다

Step 2에서 인용문이 있는 글을 찾았다면 그 페이지의 `<blockquote` 태그를 grep해 클래스가 붙었는지 확인하고, 없었다면 아무 글 끝에 `> 인용문 확인용` 한 줄을 임시로 넣고 빌드해 확인한 뒤 **되돌린다.**

- [ ] **Step 4: 포맷하고 커밋**

```bash
corepack pnpm exec prettier --write src/styles/typography.css
git status --short
git add src/styles/typography.css
git commit -m "feat(theme): 인용문에 포인트 색 선과 그라데이션 배경

포인트 색과 --sky 가 함께 쓰이는 유일한 자리다. 글씨는 보조 회색으로
두어 배경 위에서 읽히게 한다. opacity-80 은 배경까지 흐리게 만들어 걷어냈다."
```

---

### Task 5: 제목 위계

**Files:**
- Modify: `src/components/Card.astro`
- Modify: `src/components/Main.astro`
- Modify: `src/components/home/HomeSeries.astro`
- Modify: `src/pages/index.astro` (2곳)
- Modify: `src/pages/archives/index.astro`
- Modify: `src/pages/categories/[category]/index.astro`

**Interfaces:**
- Consumes: 없음 (순수 클래스 변경)
- Produces: 없음

지금 h2급 제목이 `2xl-semibold` / `2xl-bold` / `xl-semibold` / `lg-semibold` 네 갈래고, `text-lg`도 굵기가 셋이다. 세 단계로 고정한다.

| 단계 | 규격 |
|---|---|
| 페이지 제목 | `text-2xl sm:text-3xl` · `font-bold` |
| 섹션 제목 | `text-xl` · `font-semibold` |
| 항목 제목 | `text-lg` · `font-semibold` |

- [ ] **Step 1: 페이지 제목을 bold로 통일한다**

`src/components/Main.astro` — 모든 페이지의 제목이 여기를 지난다.

```astro
  <h1 class="text-2xl font-bold sm:text-3xl">{pageTitle}</h1>
```

글 제목(`src/pages/posts/[...slug]/index.astro`)은 이미 `text-2xl font-bold sm:text-3xl`이라 손대지 않는다.

- [ ] **Step 2: 섹션 제목을 `text-xl semibold`로 내린다 (세 곳)**

`src/pages/index.astro` — 홈의 섹션 제목 두 개. 둘 다 지금 `text-2xl font-semibold tracking-wide`다.

```astro
          <h2 class="text-xl font-semibold tracking-wide">
```

`src/components/home/HomeSeries.astro` — 지금 `text-2xl font-semibold tracking-wide`.

```astro
      <h2 class="text-xl font-semibold tracking-wide">
```

`src/pages/categories/[category]/index.astro` — 소분류 제목. 지금 `text-xl font-semibold`이라 크기·굵기는 이미 맞다. **손대지 않는다.**

- [ ] **Step 3: 아카이브 연도를 섹션 제목으로 맞춘다**

`src/pages/archives/index.astro` — 지금 `text-2xl font-bold`. 페이지 제목이 아니라 섹션 구분이다.

```astro
            <span class="text-xl font-semibold">{year}</span>
```

- [ ] **Step 4: 항목 제목의 굵기를 통일한다**

`src/components/Card.astro` — 지금 `font-medium`. 다른 목록 항목 제목은 전부 `font-semibold`다.

```astro
      "text-foreground decoration-accent inline-block text-lg font-semibold underline-offset-4 hover:underline",
```

- [ ] **Step 5: 세 단계 밖의 제목이 없는지 확인**

Run: `git grep -nE 'text-(2xl|3xl|xl|lg)[^"]*font-(bold|semibold|medium)|font-(bold|semibold|medium)[^"]*text-(2xl|3xl|xl|lg)' -- src/ ':!src/content'`
Expected: 나오는 조합이 `text-2xl…font-bold`(+`sm:text-3xl`), `text-xl…font-semibold`, `text-lg…font-semibold` 셋뿐이다.

예외 두 개는 나와도 정상이다 — `src/pages/404.astro`의 `text-9xl font-bold`(장식용 숫자)와 `src/components/layout/Sidebar.astro`의 사이트 이름 `text-lg font-bold`. 사이트 이름은 목록 항목이 아니라 브랜드 표기라 항목 제목 규격을 따르지 않는다.

- [ ] **Step 6: 빌드하고 커밋**

Run: `corepack pnpm build`
Expected: 0 errors

```bash
corepack pnpm exec prettier --write src/components/Card.astro src/components/Main.astro src/components/home/HomeSeries.astro src/pages/index.astro src/pages/archives/index.astro
git status --short
git add src/components/Card.astro src/components/Main.astro src/components/home/HomeSeries.astro src/pages/index.astro src/pages/archives/index.astro
git commit -m "style: 제목 위계를 세 단계로 고정

같은 위계의 제목이 페이지마다 2xl-semibold / 2xl-bold / xl-semibold /
lg-semibold 넷으로 갈려 있었다. 페이지 제목은 2xl bold, 섹션 제목은 xl
semibold, 항목 제목은 lg semibold로 맞춘다. font-medium 은 제목에서 뺀다."
```

---

### Task 6: 여백 스케일

**Files:**
- Modify: `src/components/Card.astro:16`
- Modify: `src/components/Main.astro:25`
- Modify: `src/components/home/HomeHero.astro:18, 21`
- Modify: `src/components/home/HomeSeries.astro:52`
- Modify: `src/components/layout/Sidebar.astro:72, 82, 143`
- Modify: `src/pages/404.astro:21, 27`
- Modify: `src/pages/archives/index.astro:56`
- Modify: `src/pages/categories/[category]/index.astro:78`
- Modify: `src/pages/series/[slug].astro:32`

**Interfaces:**
- Consumes: 없음
- Produces: 없음

세로 여백을 네 단계(`2` / `4` / `8` / `12`)로 줄인다. 아이콘·배지 옆의 `gap-1`·`gap-1.5`와 라벨 바로 아래 붙는 `mt-1`·`mt-1.5`는 미세 간격이라 그대로 둔다.

**치환 규칙**

| 지금 | 바꾼 뒤 | 근거 |
|---|---|---|
| `mt-3` | `mt-4` | 블록 사이 |
| `mt-5` | `mt-4` | 블록 사이 |
| `mt-6` / `mb-6` / `my-6` | `8` | 섹션 사이 |
| `mt-7` | `mt-8` | 섹션 사이 |
| `mb-14` | `mb-12` | 큰 구획 |

- [ ] **Step 1: 위반 지점을 모두 찾는다**

Run: `git grep -nE '\b(mt|mb|my)-(3|5|6|7|14)\b' -- src/ ':!src/content'`
Expected: 14곳이 나온다. 이 목록을 그대로 작업 목록으로 쓴다

- [ ] **Step 2: 위 표대로 하나씩 바꾼다**

각 지점을 규칙표에 따라 치환한다. `my-6`은 `my-8`, `mb-6`은 `mb-8`이다.

`src/pages/archives/index.astro:56`은 한 줄에 `mt-6`과 `sm:my-6`이 함께 있다(`class="mt-6 min-w-36 text-lg sm:my-6"`). 둘 다 바꾼다 → `class="mt-8 min-w-36 text-lg sm:my-8"`.

- [ ] **Step 3: 위반이 남지 않았는지 확인**

Run: `git grep -nE '\b(mt|mb|my)-(3|5|6|7|14)\b' -- src/ ':!src/content'`
Expected: 아무것도 안 나옴

- [ ] **Step 4: 빌드하고 테스트**

Run: `corepack pnpm build`
Expected: 0 errors

Run: `corepack pnpm test`
Expected: 전부 통과

Run: `corepack pnpm lint`
Expected: 출력 없음

- [ ] **Step 5: 포맷하고 커밋**

```bash
corepack pnpm exec prettier --write src/components/Card.astro src/components/Main.astro src/components/home/HomeHero.astro src/components/home/HomeSeries.astro src/components/layout/Sidebar.astro src/pages/404.astro src/pages/archives/index.astro "src/pages/categories/[category]/index.astro" "src/pages/series/[slug].astro"
git status --short
git add src/components src/pages
git commit -m "style: 세로 여백을 네 단계로 정리

mt-1 부터 mt-8 까지 사실상 모든 단계를 쓰고 있었고 mt-5 / mt-6 / mt-7 /
mb-14 는 한두 번씩만 등장했다. 2(붙은 요소) / 4(블록) / 8(섹션) /
12(큰 구획) 네 단계로 줄인다."
```

---

## 완료 확인

설계 문서 §9를 하나씩 확인한다.

- [ ] 라이트·다크 양쪽에서 §3의 값이 그대로 적용된다
- [ ] 글 제목, 카드 제목, 목록 제목 어디에도 포인트 색이 들어가지 않는다
- [ ] 링크는 글씨가 먹색이고 밑줄이 포인트 색이다
- [ ] 목차 현재 위치와 사이드바 활성 분류가 좌측 마커로 표시된다
- [ ] 태그 칩 hover가 연보라 배경이 된다 — **다크에서도 구분되는지 눈으로 확인한다**
- [ ] 본문 인용문에 좌측 선과 그라데이션 배경이 들어간다
- [ ] 404 숫자를 제외하면 24px 미만 텍스트에 `--accent`가 쓰이지 않는다
- [ ] 제목이 §5의 세 단계 밖으로 나가지 않는다 (404 숫자, 사이드바 사이트명 제외)
- [ ] 세로 여백에 `mt-3` / `mt-5` / `-6` / `mt-7` / `mb-14`가 남아 있지 않다
- [ ] `--brand` / `--tag-hover` / `--tag-hover-foreground`를 참조하는 곳이 없다
- [ ] `theme.css` 주석, `typography.css` 주석, `CLAUDE.md` 색 원칙이 갱신됐다
- [ ] `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`가 통과한다
