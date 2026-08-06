# 블로그 리디자인 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AstroPaper 기반 블로그를 좌측 사이드바 + 2단 카테고리 + 시리즈 구조를 갖춘 포트폴리오 겸 개발 블로그로 재구성한다.

**Architecture:** 카테고리·시리즈를 `src/categories.ts` / `src/series.ts` 단일 소스에 정의하고, 콘텐츠 스키마가 zod로 이를 교차 검증한다. 레이아웃은 신규 컴포넌트로 만들고 기존 `Header.astro`는 조립부로만 남겨 업스트림 병합 충돌 면적을 최소화한다. 순수 TS 로직은 vitest로 단위 테스트하고, `.astro` 렌더링은 빌드 산출물 검사로 검증한다.

**Tech Stack:** Astro 7, Tailwind CSS 4, TypeScript, zod (astro/zod), vitest, pnpm

## Global Constraints

- 패키지 매니저는 **pnpm**이다. `npm`을 쓰지 않는다 (`package-lock.json`이 생기면 삭제).
- 작업 브랜치는 `redesign/sidebar-shell`이다. `main`에 직접 커밋하지 않는다.
- **작성 규칙: 저장소 루트의 `CLAUDE.md`「커밋·스펙·계획 문서 작성 규칙」절을 반드시 먼저 읽고 따른다.** 커밋 메시지·문서·코드·주석에 쓰면 안 되는 고유명사 목록과 중립적 대체 표현이 거기 있다. 디자인의 출처를 설명해야 할 때는 값과 동작만 기술한다. (`CLAUDE.md`는 gitignore되어 로컬에만 존재한다.)
- 색 토큰 값(라이트 7 / 다크 7)은 스펙 7.1의 값을 그대로 쓴다. 임의로 조정하지 않는다.
- 폭 토큰: `--sidebar-width: 240px`, `--toc-width: 224px`. 매직넘버를 별도로 반복하지 않는다.
- 본문 폰트 SUIT, 코드 폰트 JetBrains Mono.
- 글 콘텐츠는 `src/content/posts/_ko/` 아래에 둔다. 밑줄 접두어라 URL에 반영되지 않는다.
- 각 태스크는 `pnpm build`가 통과하는 상태로 끝난다.

**참조 스펙:** `docs/superpowers/specs/2026-08-06-blog-redesign-design.md`

---

## 파일 구조

| 파일 | 책임 |
|---|---|
| `src/categories.ts` | 대분류/소분류 정의 + 조회 헬퍼. 단일 소스 |
| `src/series.ts` | 시리즈 정의 + 조회 헬퍼 |
| `src/utils/getPostsByCategory.ts` | 카테고리 기준 필터/그룹핑 (순수 함수) |
| `src/utils/getSeriesPosts.ts` | 시리즈 정렬 + 중복 순번 검출 (순수 함수) |
| `src/components/layout/Sidebar.astro` | 사이드바 껍데기: 프로필·내비·유틸·소셜 |
| `src/components/layout/SidebarNav.astro` | 카테고리 아코디언 (`<details>`) |
| `src/components/layout/TopBar.astro` | 모바일 전용 상단바 |
| `src/components/toc/InlineToc.astro` | 본문 상단 접이식 목차 |
| `src/components/toc/FloatingToc.astro` | 우측 부유 목차 + 스크롤 스파이 |
| `src/components/series/SeriesBox.astro` | 글 상단 시리즈 안내 |
| `src/components/series/SeriesNav.astro` | 글 하단 이전/다음 편 |
| `src/pages/categories/**` | 카테고리 라우트 |
| `src/pages/series/**` | 시리즈 라우트 |
| `tests/*.test.ts` | vitest 단위 테스트 + 빌드 산출물 검사 |

---

### Task 1: 디자인 토큰과 폰트

**Files:**
- Modify: `src/styles/theme.css` (전체 교체)
- Modify: `astro.config.ts:61-71` (fonts 배열)
- Modify: `src/layouts/Layout.astro:47-51` (Font 태그)
- Create: `src/assets/fonts/SUIT-Variable.woff2` (다운로드)

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces: CSS 변수 `--font-suit`, `--font-jetbrains-mono`, `--sidebar-width`, `--toc-width`. Tailwind 유틸 `font-app`(본문), `font-mono`(코드). 색 토큰 7종은 이름 변경 없이 값만 교체되므로 기존 `bg-background` 등 유틸이 그대로 동작한다.

- [ ] **Step 1: SUIT 가변 폰트 파일 내려받기**

SUIT는 SIL Open Font License로 배포된다. 가변 폰트 woff2 하나만 받는다.

```bash
mkdir -p src/assets/fonts
curl -L -o src/assets/fonts/SUIT-Variable.woff2 \
  https://cdn.jsdelivr.net/gh/sunn-us/SUIT/fonts/variable/woff2/SUIT-Variable.woff2
ls -la src/assets/fonts/SUIT-Variable.woff2
```

파일 크기가 0이 아니고 최소 100KB 이상인지 확인한다. 0이거나 HTML이 받아졌으면 URL이 바뀐 것이므로 https://github.com/sunn-us/SUIT 릴리스에서 직접 받는다.

- [ ] **Step 2: `astro.config.ts`의 fonts 배열 교체**

61–71행의 `fonts: [...]`를 통째로 아래로 바꾼다.

```ts
  fonts: [
    {
      name: "SUIT Variable",
      cssVariable: "--font-suit",
      provider: "local",
      fallbacks: ["system-ui", "sans-serif"],
      variants: [
        {
          weight: "400 800",
          style: "normal",
          src: ["./src/assets/fonts/SUIT-Variable.woff2"],
        },
      ],
    },
    {
      name: "JetBrains Mono",
      cssVariable: "--font-jetbrains-mono",
      provider: fontProviders.google(),
      fallbacks: ["monospace"],
      weights: [400, 500, 700],
      styles: ["normal", "italic"],
      formats: ["woff2"],
    },
  ],
```

`fontProviders`는 이미 1–6행에서 import되어 있으므로 import 변경은 없다.

- [ ] **Step 3: `src/styles/theme.css` 전체 교체**

```css
/* Register design tokens for Tailwind v4 */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --font-app: var(--font-suit);
  --font-mono: var(--font-jetbrains-mono);
}

/* Light theme values */
:root,
[data-theme="light"] {
  --background: #fdfdfe;
  --foreground: #1e1f21;
  --accent: #353638;
  --accent-foreground: #ffffff;
  --muted: #f1f3f7;
  --muted-foreground: #66666e;
  --border: #e2e5ec;
}

/* Dark theme values */
[data-theme="dark"] {
  --background: #1e1f21;
  --foreground: #f4f4f6;
  --accent: #5db0d7;
  --accent-foreground: #1e1f21;
  --muted: #292a2d;
  --muted-foreground: #9999a1;
  --border: #353638;
}

/* Layout widths — single source, referenced by shell and TOC */
:root {
  --sidebar-width: 240px;
  --toc-width: 224px;
  /* max-w-3xl과 같은 값. 부유 목차 위치 계산이 이 값을 참조한다. */
  --content-width: 48rem;
}
```

- [ ] **Step 4: `Layout.astro`의 Font 태그 교체**

47–51행의 `<!-- Font -->` 블록을 아래로 바꾼다.

```astro
    <!-- Fonts -->
    <Font cssVariable="--font-suit" preload />
    <Font cssVariable="--font-jetbrains-mono" />
```

- [ ] **Step 5: 코드블록에 mono 폰트 적용 확인**

`src/styles/typography.css`에서 `pre`/`code`가 `font-mono`를 쓰는지 확인한다.

```bash
grep -n "font-mono\|font-family" src/styles/typography.css
```

`font-mono`를 쓰는 규칙이 없으면 `@layer base`에 추가한다:

```css
  code,
  kbd,
  samp,
  pre {
    @apply font-mono;
  }
```

- [ ] **Step 6: 빌드 검증**

```bash
pnpm build
```

Expected: 성공. 오류 시 흔한 원인 두 가지 — (a) `provider: "local"`에서 폰트 경로 오타, (b) `weight: "400 800"` 문자열이 아닌 배열로 적음.

- [ ] **Step 7: 육안 확인**

```bash
pnpm dev
```

브라우저에서 확인할 것: 배경이 순백이 아닌 아주 옅은 회백(`#fdfdfe`), 한글이 SUIT로 렌더(시스템 고딕과 자소 모양이 다름), 코드블록이 JetBrains Mono, 다크 모드 링크가 파랑(`#5db0d7`).

- [ ] **Step 8: 커밋**

```bash
git add src/styles/theme.css astro.config.ts src/layouts/Layout.astro src/assets/fonts/ src/styles/typography.css
git commit -m "feat(theme): 색 토큰 교체 및 본문/코드 폰트 도입

- 라이트/다크 색 토큰 14개를 새 팔레트로 교체
- 본문 SUIT(로컬), 코드 JetBrains Mono(구글) 도입
- --sidebar-width / --toc-width 폭 토큰 추가"
```

---

### Task 2: 한국어 UI 문자열과 사이트 설정

**Files:**
- Modify: `src/i18n/types.ts` (키 추가)
- Modify: `src/i18n/lang/en.ts` (키 추가)
- Create: `src/i18n/lang/ko.ts`
- Modify: `astro.config.ts:31-37` (locales)
- Modify: `astro-paper.config.ts:4-14` (site)

**Interfaces:**
- Consumes: 없음
- Produces: `useTranslations(locale)`가 반환하는 `UIStrings`에 아래 세 그룹이 추가된다. 이후 모든 태스크가 이 키를 쓴다.
  - `t.nav.categories: string`, `t.nav.series: string`
  - `t.category.{ title, desc, allPosts, seeMore, seriesCount }`
  - `t.series.{ title, desc, part, ongoing, completed, prevPart, nextPart, inThisSeries }`
  - `t.toc.title: string`

- [ ] **Step 1: `src/i18n/types.ts`에 키 추가**

`nav` 블록에 두 줄을 추가하고, `notFound` 앞에 세 블록을 추가한다.

```ts
  nav: {
    home: string;
    posts: string;
    tags: string;
    about: string;
    archives: string;
    search: string;
    categories: string;
    series: string;
  };
```

```ts
  category: {
    title: string;
    desc: string;
    allPosts: string;
    seeMore: string;
    seriesCount: string;
  };
  series: {
    title: string;
    desc: string;
    part: string;
    ongoing: string;
    completed: string;
    prevPart: string;
    nextPart: string;
    inThisSeries: string;
  };
  toc: {
    title: string;
  };
```

- [ ] **Step 2: `src/i18n/lang/en.ts`에 같은 키 추가**

`nav`에 두 줄:

```ts
    categories: "Categories",
    series: "Series",
```

`notFound` 앞에 세 블록:

```ts
  category: {
    title: "Category",
    desc: "Posts in this category.",
    allPosts: "All posts",
    seeMore: "See more",
    seriesCount: "{{count}} parts",
  },
  series: {
    title: "Series",
    desc: "Multi-part writeups.",
    part: "Part {{current}} of {{total}}",
    ongoing: "Ongoing",
    completed: "Completed",
    prevPart: "Previous part",
    nextPart: "Next part",
    inThisSeries: "In this series",
  },
  toc: {
    title: "Table of contents",
  },
```

- [ ] **Step 3: `src/i18n/lang/ko.ts` 생성**

```ts
import type { UIStrings } from "../types";

export default {
  nav: {
    home: "홈",
    posts: "글",
    tags: "태그",
    about: "소개",
    archives: "아카이브",
    search: "검색",
    categories: "카테고리",
    series: "시리즈",
  },
  post: {
    publishedAt: "작성일",
    updatedAt: "수정일",
    sharePostIntro: "이 글 공유하기:",
    sharePostOn: "{{platform}}에 공유",
    sharePostViaEmail: "메일로 공유",
    tagLabel: "태그",
    backToTop: "맨 위로",
    goBack: "뒤로",
    editPage: "이 글 수정",
    previousPost: "이전 글",
    nextPost: "다음 글",
  },
  pagination: {
    prev: "이전",
    next: "다음",
    page: "페이지",
  },
  home: {
    socialLinks: "소셜 링크",
    featured: "추천 글",
    recentPosts: "최근 글",
    allPosts: "전체 글",
  },
  footer: {
    copyright: "저작권",
    allRightsReserved: "All rights reserved.",
  },
  pages: {
    tagTitle: "태그",
    tagDesc: "이 태그가 달린 글",

    tagsTitle: "태그",
    tagsDesc: "글에 사용된 모든 태그입니다.",

    postsTitle: "글",
    postsDesc: "지금까지 쓴 글입니다.",

    archivesTitle: "아카이브",
    archivesDesc: "날짜별로 모아 본 글입니다.",

    searchTitle: "검색",
    searchDesc: "글 검색 ...",
  },
  category: {
    title: "카테고리",
    desc: "이 분류에 속한 글입니다.",
    allPosts: "전체 보기",
    seeMore: "더 보기",
    seriesCount: "{{count}}편",
  },
  series: {
    title: "시리즈",
    desc: "여러 편으로 이어지는 글입니다.",
    part: "{{total}}편 중 {{current}}편",
    ongoing: "연재 중",
    completed: "완결",
    prevPart: "이전 편",
    nextPart: "다음 편",
    inThisSeries: "이 시리즈의 글",
  },
  toc: {
    title: "목차",
  },
  a11y: {
    skipToContent: "본문으로 건너뛰기",
    openMenu: "메뉴 열기",
    closeMenu: "메뉴 닫기",
    toggleTheme: "테마 전환",
    searchPlaceholder: "글 검색...",
    noResults: "검색 결과가 없습니다",
    goToPreviousPage: "이전 페이지로",
    goToNextPage: "다음 페이지로",
  },
  notFound: {
    title: "404 Not Found",
    message: "페이지를 찾을 수 없습니다",
    goHome: "홈으로 돌아가기",
  },
} satisfies UIStrings;
```

- [ ] **Step 4: `astro.config.ts`의 i18n locales 변경**

31–37행:

```ts
  i18n: {
    locales: ["ko"],
    defaultLocale: "ko",
    routing: {
      prefixDefaultLocale: false,
    },
  },
```

- [ ] **Step 5: `astro-paper.config.ts`의 site 블록 변경**

`lang`과 `timezone`만 바꾼다. `title`/`author`/`description`은 사용자가 직접 채울 항목이므로 이 태스크에서는 그대로 둔다 (Task 10에서 처리).

```ts
    lang: "ko",
    timezone: "Asia/Seoul",
```

- [ ] **Step 6: 타입 검사**

```bash
pnpm exec astro check
```

Expected: 0 errors. 오류가 나면 `en.ts` 또는 `ko.ts`에서 `UIStrings` 키가 빠진 것이다. 오류 메시지가 빠진 키 이름을 알려준다.

- [ ] **Step 7: 빌드 검증**

```bash
pnpm build
```

Expected: 성공. `html lang="ko"`가 출력되는지 확인:

```bash
grep -o 'lang="[a-z]*"' dist/index.html
```

Expected: `lang="ko"`

- [ ] **Step 8: 커밋**

```bash
git add src/i18n astro.config.ts astro-paper.config.ts
git commit -m "feat(i18n): 한국어 UI 문자열 추가 및 기본 로케일 전환

- ko.ts 신규, 기본 로케일을 ko로 변경, 시간대 Asia/Seoul
- 카테고리/시리즈/목차 UI 문자열 키 추가 (en, ko 양쪽)"
```

---

### Task 3: 카테고리·시리즈 정의와 테스트 환경

**Files:**
- Create: `src/categories.ts`
- Create: `src/series.ts`
- Create: `tests/categories.test.ts`
- Create: `tests/series.test.ts`
- Create: `vitest.config.ts`
- Modify: `package.json` (devDependency + scripts)

**Interfaces:**
- Consumes: 없음
- Produces:
  - `CATEGORIES` 객체, `type CategoryId`, `CATEGORY_IDS: [CategoryId, ...CategoryId[]]`
  - `hasSubcategories(id: CategoryId): boolean`
  - `getSubcategoryIds(id: CategoryId): string[]` — 소분류 없으면 `[]`
  - `getSubcategoryLabel(id: CategoryId, sub: string): string | undefined`
  - `isValidSubcategory(id: CategoryId, sub: string): boolean`
  - `SERIES` 객체, `type SeriesId`, `SERIES_IDS: [SeriesId, ...SeriesId[]]`
  - `getSeriesByCategory(category: CategoryId): { id: SeriesId; label: string; description: string; status: "ongoing" | "completed" }[]`

- [ ] **Step 1: vitest 설치**

```bash
pnpm add -D vitest
```

- [ ] **Step 2: `vitest.config.ts` 생성**

Astro 런타임에 의존하지 않는 순수 TS만 테스트하므로 Astro 통합이 필요 없다. 경로 별칭만 맞춘다.

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 3: `package.json`에 스크립트 추가**

`scripts` 블록에 두 줄 추가:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 4: 실패하는 테스트 작성 — `tests/categories.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import {
  CATEGORIES,
  CATEGORY_IDS,
  hasSubcategories,
  getSubcategoryIds,
  getSubcategoryLabel,
  isValidSubcategory,
} from "@/categories";

describe("CATEGORY_IDS", () => {
  it("정의된 대분류 5개를 순서대로 담는다", () => {
    expect(CATEGORY_IDS).toEqual([
      "deep-dive",
      "project",
      "troubleshooting",
      "study",
      "etc",
    ]);
  });

  it("모든 id가 CATEGORIES의 키와 일치한다", () => {
    expect(CATEGORY_IDS.every(id => id in CATEGORIES)).toBe(true);
  });
});

describe("hasSubcategories", () => {
  it("소분류를 가진 대분류에 true를 반환한다", () => {
    expect(hasSubcategories("deep-dive")).toBe(true);
    expect(hasSubcategories("study")).toBe(true);
  });

  it("소분류가 없는 대분류에 false를 반환한다", () => {
    expect(hasSubcategories("project")).toBe(false);
    expect(hasSubcategories("troubleshooting")).toBe(false);
    expect(hasSubcategories("etc")).toBe(false);
  });
});

describe("getSubcategoryIds", () => {
  it("소분류 id 배열을 정의 순서대로 반환한다", () => {
    expect(getSubcategoryIds("deep-dive")).toEqual([
      "rendering",
      "architecture",
      "memory",
    ]);
  });

  it("소분류가 없으면 빈 배열을 반환한다", () => {
    expect(getSubcategoryIds("etc")).toEqual([]);
  });
});

describe("getSubcategoryLabel", () => {
  it("표시용 라벨을 반환한다", () => {
    expect(getSubcategoryLabel("study", "cs")).toBe("CS 기초");
  });

  it("없는 소분류에 undefined를 반환한다", () => {
    expect(getSubcategoryLabel("study", "nope")).toBeUndefined();
  });
});

describe("isValidSubcategory", () => {
  it("해당 대분류에 속한 소분류면 true", () => {
    expect(isValidSubcategory("deep-dive", "rendering")).toBe(true);
  });

  it("다른 대분류의 소분류면 false", () => {
    expect(isValidSubcategory("deep-dive", "cs")).toBe(false);
  });

  it("소분류를 갖지 않는 대분류면 항상 false", () => {
    expect(isValidSubcategory("etc", "rendering")).toBe(false);
  });
});
```

- [ ] **Step 5: 테스트 실패 확인**

```bash
pnpm test
```

Expected: FAIL — `Failed to resolve import "@/categories"`

- [ ] **Step 6: `src/categories.ts` 작성**

```ts
/**
 * 카테고리 단일 소스.
 * 사이드바 내비게이션, 라우팅, 콘텐츠 스키마 검증이 모두 이 파일에서 파생된다.
 * 카테고리를 추가하거나 이름을 바꿀 때는 이 파일만 고친다.
 *
 * `subcategories: null`은 "소분류를 갖지 않는 대분류"를 뜻하며 빈 객체와 구분된다.
 */
export const CATEGORIES = {
  "deep-dive": {
    label: "Deep Dive",
    description: "렌더링·아키텍처·메모리를 파고든 기록",
    subcategories: {
      rendering: "Rendering",
      architecture: "Architecture",
      memory: "Memory",
    },
  },
  project: {
    label: "Project",
    description: "만든 것들",
    subcategories: null,
  },
  troubleshooting: {
    label: "Troubleshooting",
    description: "짧고 실전적인 이슈 기록",
    subcategories: null,
  },
  study: {
    label: "Study",
    description: "기초를 다시 훑는 기록",
    subcategories: {
      cs: "CS 기초",
      language: "Language",
      tools: "Tools & Framework",
    },
  },
  etc: {
    label: "Etc",
    description: "잡담·회고·커리어",
    subcategories: null,
  },
} as const;

export type CategoryId = keyof typeof CATEGORIES;

export const CATEGORY_IDS = Object.keys(CATEGORIES) as [
  CategoryId,
  ...CategoryId[],
];

export function hasSubcategories(id: CategoryId): boolean {
  return CATEGORIES[id].subcategories !== null;
}

export function getSubcategoryIds(id: CategoryId): string[] {
  const subs = CATEGORIES[id].subcategories;
  return subs === null ? [] : Object.keys(subs);
}

export function getSubcategoryLabel(
  id: CategoryId,
  sub: string
): string | undefined {
  const subs = CATEGORIES[id].subcategories;
  if (subs === null) return undefined;
  return (subs as Record<string, string>)[sub];
}

export function isValidSubcategory(id: CategoryId, sub: string): boolean {
  return getSubcategoryLabel(id, sub) !== undefined;
}
```

- [ ] **Step 7: 테스트 통과 확인**

```bash
pnpm test
```

Expected: `tests/categories.test.ts` 전부 PASS

- [ ] **Step 8: 실패하는 테스트 작성 — `tests/series.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { SERIES, SERIES_IDS, getSeriesByCategory } from "@/series";

describe("SERIES_IDS", () => {
  it("정의된 시리즈 id를 담는다", () => {
    expect(SERIES_IDS).toContain("dod-digitaltwin-unity");
  });

  it("모든 id가 SERIES의 키와 일치한다", () => {
    expect(SERIES_IDS.every(id => id in SERIES)).toBe(true);
  });
});

describe("SERIES 정의", () => {
  it("모든 시리즈가 project 대분류에 속한다", () => {
    for (const id of SERIES_IDS) {
      expect(SERIES[id].category).toBe("project");
    }
  });

  it("status는 ongoing 또는 completed다", () => {
    for (const id of SERIES_IDS) {
      expect(["ongoing", "completed"]).toContain(SERIES[id].status);
    }
  });
});

describe("getSeriesByCategory", () => {
  it("해당 대분류의 시리즈를 반환한다", () => {
    const result = getSeriesByCategory("project");
    expect(result.map(s => s.id)).toContain("dod-digitaltwin-unity");
    expect(result[0]).toHaveProperty("label");
    expect(result[0]).toHaveProperty("status");
  });

  it("시리즈가 없는 대분류에는 빈 배열을 반환한다", () => {
    expect(getSeriesByCategory("etc")).toEqual([]);
  });
});
```

- [ ] **Step 9: 테스트 실패 확인**

```bash
pnpm test
```

Expected: FAIL — `Failed to resolve import "@/series"`

- [ ] **Step 10: `src/series.ts` 작성**

```ts
import type { CategoryId } from "./categories";

export type SeriesStatus = "ongoing" | "completed";

/**
 * 시리즈 단일 소스.
 * 프로젝트 하나가 시리즈 하나에 1:1 대응한다. 시리즈 제목을 글마다 반복
 * 기입하지 않아도 되고, 오타로 시리즈가 둘로 쪼개지는 것을 막는다.
 */
export const SERIES = {
  "dod-digitaltwin-unity": {
    label: "DOD로 만드는 디지털트윈",
    description:
      "Unity에서 데이터 지향 설계로 설비 6,400개를 그리기까지",
    category: "project",
    status: "ongoing",
  },
} as const satisfies Record<
  string,
  {
    label: string;
    description: string;
    category: CategoryId;
    status: SeriesStatus;
  }
>;

export type SeriesId = keyof typeof SERIES;

export const SERIES_IDS = Object.keys(SERIES) as [SeriesId, ...SeriesId[]];

export type SeriesSummary = {
  id: SeriesId;
  label: string;
  description: string;
  status: SeriesStatus;
};

export function getSeriesByCategory(category: CategoryId): SeriesSummary[] {
  return SERIES_IDS.filter(id => SERIES[id].category === category).map(id => ({
    id,
    label: SERIES[id].label,
    description: SERIES[id].description,
    status: SERIES[id].status,
  }));
}
```

- [ ] **Step 11: 테스트 통과 확인**

```bash
pnpm test
```

Expected: 두 파일 모두 PASS

- [ ] **Step 12: 커밋**

```bash
git add src/categories.ts src/series.ts tests/ vitest.config.ts package.json pnpm-lock.yaml
git commit -m "feat(taxonomy): 카테고리·시리즈 정의와 조회 헬퍼 추가

- CATEGORIES/SERIES 단일 소스와 파생 헬퍼
- vitest 도입, 두 모듈 단위 테스트"
```

---

### Task 4: 스키마 확장과 콘텐츠 마이그레이션

기존 데모 글이 18개다. `category`를 필수로 만드는 순간 전부 빌드가 깨지므로 스키마 변경과 콘텐츠 마이그레이션을 한 태스크로 묶는다.

**Files:**
- Modify: `src/content.config.ts`
- Move: `src/content/posts/*` → `src/content/posts/_ko/*`
- Modify: 기존 글 18개의 frontmatter

**Interfaces:**
- Consumes: `CATEGORY_IDS`, `isValidSubcategory`, `hasSubcategories` (Task 3), `SERIES_IDS` (Task 3)
- Produces: `CollectionEntry<"posts">["data"]`에 `category: CategoryId`, `subcategory?: string`, `series?: SeriesId`, `seriesOrder?: number` 추가

- [ ] **Step 1: 글을 `_ko/`로 이동**

밑줄 접두어 폴더는 URL에 반영되지 않으므로 이동해도 주소가 바뀌지 않는다.

```bash
cd src/content/posts
mkdir -p _ko
git mv adding-new-post.mdx customizing-astropaper-theme-color-schemes.mdx \
  dynamic-og-images.md how-to-add-latex-equations-in-blog-posts.md \
  how-to-configure-astropaper-theme.mdx how-to-integrate-giscus-comments.md \
  how-to-update-dependencies.md setting-dates-via-git-hooks.md _ko/ 2>/dev/null \
  || mv adding-new-post.mdx customizing-astropaper-theme-color-schemes.mdx \
     dynamic-og-images.md how-to-add-latex-equations-in-blog-posts.md \
     how-to-configure-astropaper-theme.mdx how-to-integrate-giscus-comments.md \
     how-to-update-dependencies.md setting-dates-via-git-hooks.md _ko/
mv examples _color-schemes _releases _ko/
cd ../../..
find src/content/posts -name "*.md" -o -name "*.mdx" | sort
```

Expected: 18개 전부 `src/content/posts/_ko/` 아래에 있다.

- [ ] **Step 2: 기존 글 전부에 `category: etc` 스탬프**

데모 글이므로 전부 `etc`로 보낸다. 실제 글쓰기를 시작할 때 삭제하면 된다.

```bash
find src/content/posts/_ko -name "*.md" -o -name "*.mdx" | while read -r f; do
  grep -q "^category:" "$f" || \
    perl -0pi -e 's/^(---\n)/$1category: etc\n/' "$f"
done
grep -L "^category:" $(find src/content/posts/_ko -name "*.md" -o -name "*.mdx") \
  || echo "✓ 전부 category 보유"
```

Expected: `✓ 전부 category 보유`

- [ ] **Step 3: `src/content.config.ts` 수정**

import 두 줄을 파일 상단에 추가한다:

```ts
import { CATEGORY_IDS, hasSubcategories, isValidSubcategory } from "@/categories";
import { SERIES_IDS } from "@/series";
```

`posts` 컬렉션의 `schema`를 아래로 교체한다. `z.object({...})` 뒤에 `.superRefine()`이 붙는 형태다.

```ts
const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z
      .object({
        author: z.string().default(config.site.author),
        pubDatetime: z.date(),
        modDatetime: z.date().optional().nullable(),
        title: z.string(),
        featured: z.boolean().optional(),
        draft: z.boolean().optional(),
        tags: z.array(z.string()).default(["others"]),
        category: z.enum(CATEGORY_IDS),
        subcategory: z.string().optional(),
        series: z.enum(SERIES_IDS).optional(),
        seriesOrder: z.number().int().positive().optional(),
        ogImage: image().or(z.string()).optional(),
        description: z.string(),
        canonicalURL: z.string().optional(),
        hideEditPost: z.boolean().optional(),
        timezone: z.string().optional(),
      })
      .superRefine((data, ctx) => {
        const needsSub = hasSubcategories(data.category);

        if (needsSub && !data.subcategory) {
          ctx.addIssue({
            code: "custom",
            path: ["subcategory"],
            message: `"${data.category}"에는 subcategory가 필요합니다.`,
          });
        }

        if (
          needsSub &&
          data.subcategory &&
          !isValidSubcategory(data.category, data.subcategory)
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["subcategory"],
            message: `"${data.subcategory}"는 "${data.category}"의 subcategory가 아닙니다.`,
          });
        }

        if (!needsSub && data.subcategory) {
          ctx.addIssue({
            code: "custom",
            path: ["subcategory"],
            message: `"${data.category}"는 subcategory를 갖지 않습니다.`,
          });
        }

        if (Boolean(data.series) !== Boolean(data.seriesOrder)) {
          ctx.addIssue({
            code: "custom",
            path: ["seriesOrder"],
            message: "series와 seriesOrder는 함께 지정해야 합니다.",
          });
        }
      }),
});
```

- [ ] **Step 4: 빌드가 통과하는지 확인**

```bash
pnpm build
```

Expected: 성공.

**실패 시 분기:** Astro가 `ZodEffects`(superRefine 결과)를 컬렉션 스키마로 거부하면 `Invalid schema` 류의 오류가 난다. 그 경우 `.superRefine()`을 떼어내고, 같은 검증 로직을 `src/utils/validateTaxonomy.ts`로 옮겨 Task 6의 `src/pages/categories/index.astro` `getStaticPaths`에서 전체 글을 순회하며 호출한다(위반 시 `throw new Error(message)`). 검증 시점이 조금 늦어질 뿐 빌드가 실패한다는 결과는 같다.

- [ ] **Step 5: 검증이 실제로 동작하는지 확인 (일부러 깨뜨리기)**

```bash
cat > src/content/posts/_ko/__probe.md <<'EOF'
---
title: probe
description: probe
pubDatetime: 2026-01-01
category: deep-dive
subcategory: rendring
---
probe
EOF
pnpm build; echo "exit=$?"
```

Expected: 빌드 실패, 메시지에 `"rendring"는 "deep-dive"의 subcategory가 아닙니다`가 포함된다.

- [ ] **Step 6: 두 번째 검증 — 소분류 누락**

```bash
perl -pi -e 's/^subcategory: rendring$//' src/content/posts/_ko/__probe.md
pnpm build; echo "exit=$?"
```

Expected: 빌드 실패, `"deep-dive"에는 subcategory가 필요합니다`.

- [ ] **Step 7: 프로브 제거 후 빌드 복구 확인**

```bash
rm src/content/posts/_ko/__probe.md
pnpm build
```

Expected: 성공

- [ ] **Step 8: URL이 안 바뀌었는지 확인**

```bash
ls dist/posts/ | head
ls dist/posts/examples/ 2>/dev/null
```

Expected: `_ko`라는 경로 세그먼트가 없고, `dist/posts/adding-new-post/`와 `dist/posts/examples/…`가 이동 전과 동일하게 존재한다.

- [ ] **Step 9: 커밋**

```bash
git add -A src/content/posts src/content.config.ts
git commit -m "feat(content): 분류 필드 도입 및 콘텐츠를 _ko/로 이동

- category/subcategory/series/seriesOrder 필드와 교차 검증 추가
- 잘못된 소분류·시리즈 조합은 빌드 실패
- 글을 _ko/ 아래로 이동 (밑줄 폴더라 URL 불변)
- 기존 데모 글은 category: etc로 표시"
```

---

### Task 5: 조회 유틸

**Files:**
- Create: `src/utils/getPostsByCategory.ts`
- Create: `src/utils/getSeriesPosts.ts`
- Create: `tests/getPostsByCategory.test.ts`
- Create: `tests/getSeriesPosts.test.ts`

**Interfaces:**
- Consumes: `CategoryId`, `getSubcategoryIds` (Task 3)
- Produces:
  - `type TaxonomyPost` — 유틸이 요구하는 최소 형태. `CollectionEntry<"posts">`가 구조적으로 이를 만족한다.
  - `filterByCategory<T extends TaxonomyPost>(posts: T[], category: CategoryId): T[]`
  - `groupBySubcategory<T extends TaxonomyPost>(posts: T[], category: CategoryId): { id: string; posts: T[] }[]`
  - `filterBySubcategory<T extends TaxonomyPost>(posts: T[], category: CategoryId, sub: string): T[]`
  - `getSeriesPosts<T extends TaxonomyPost>(posts: T[], seriesId: string): T[]` — `seriesOrder` 오름차순, 중복 시 throw
  - `getSeriesPosition<T extends TaxonomyPost>(posts: T[], seriesId: string, order: number): { current: number; total: number; prev: T | null; next: T | null }`

유틸을 `CollectionEntry` 대신 최소 구조 타입으로 받는 이유는 Astro 런타임 없이 단위 테스트하기 위해서다.

- [ ] **Step 1: 실패하는 테스트 작성 — `tests/getPostsByCategory.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import {
  filterByCategory,
  filterBySubcategory,
  groupBySubcategory,
  type TaxonomyPost,
} from "@/utils/getPostsByCategory";

const post = (
  id: string,
  category: TaxonomyPost["data"]["category"],
  subcategory?: string
) => ({ id, data: { category, subcategory } });

const posts = [
  post("a", "deep-dive", "rendering"),
  post("b", "deep-dive", "memory"),
  post("c", "deep-dive", "rendering"),
  post("d", "etc"),
];

describe("filterByCategory", () => {
  it("해당 대분류의 글만 남긴다", () => {
    expect(filterByCategory(posts, "deep-dive").map(p => p.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("일치하는 글이 없으면 빈 배열", () => {
    expect(filterByCategory(posts, "study")).toEqual([]);
  });
});

describe("filterBySubcategory", () => {
  it("대분류와 소분류가 모두 일치하는 글만 남긴다", () => {
    expect(
      filterBySubcategory(posts, "deep-dive", "rendering").map(p => p.id)
    ).toEqual(["a", "c"]);
  });
});

describe("groupBySubcategory", () => {
  it("정의 순서대로 소분류 그룹을 반환한다", () => {
    const groups = groupBySubcategory(posts, "deep-dive");
    expect(groups.map(g => g.id)).toEqual([
      "rendering",
      "architecture",
      "memory",
    ]);
  });

  it("글이 없는 소분류도 빈 배열로 포함한다", () => {
    const groups = groupBySubcategory(posts, "deep-dive");
    expect(groups.find(g => g.id === "architecture")?.posts).toEqual([]);
  });

  it("소분류가 없는 대분류에는 빈 배열을 반환한다", () => {
    expect(groupBySubcategory(posts, "etc")).toEqual([]);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
pnpm test
```

Expected: FAIL — 모듈을 찾을 수 없음

- [ ] **Step 3: `src/utils/getPostsByCategory.ts` 작성**

```ts
import { getSubcategoryIds, type CategoryId } from "@/categories";

/**
 * 분류 유틸이 요구하는 최소 형태.
 * `CollectionEntry<"posts">`가 구조적으로 이를 만족하므로 별도 변환이 필요 없고,
 * Astro 런타임 없이 단위 테스트할 수 있다.
 */
export type TaxonomyPost = {
  data: {
    category: CategoryId;
    subcategory?: string;
    series?: string;
    seriesOrder?: number;
  };
};

export function filterByCategory<T extends TaxonomyPost>(
  posts: T[],
  category: CategoryId
): T[] {
  return posts.filter(p => p.data.category === category);
}

export function filterBySubcategory<T extends TaxonomyPost>(
  posts: T[],
  category: CategoryId,
  subcategory: string
): T[] {
  return posts.filter(
    p => p.data.category === category && p.data.subcategory === subcategory
  );
}

/**
 * 소분류별로 글을 묶는다. 그룹 순서는 `categories.ts`의 정의 순서를 따르며,
 * 글이 하나도 없는 소분류도 빈 배열로 포함한다 (내비게이션이 목록을
 * 일관되게 그릴 수 있도록).
 */
export function groupBySubcategory<T extends TaxonomyPost>(
  posts: T[],
  category: CategoryId
): { id: string; posts: T[] }[] {
  return getSubcategoryIds(category).map(id => ({
    id,
    posts: filterBySubcategory(posts, category, id),
  }));
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm test
```

Expected: PASS

- [ ] **Step 5: 실패하는 테스트 작성 — `tests/getSeriesPosts.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { getSeriesPosts, getSeriesPosition } from "@/utils/getSeriesPosts";

const part = (id: string, seriesOrder: number, series = "s1") => ({
  id,
  data: { category: "project" as const, series, seriesOrder },
});

describe("getSeriesPosts", () => {
  it("seriesOrder 오름차순으로 정렬한다", () => {
    const posts = [part("c", 3), part("a", 1), part("b", 2)];
    expect(getSeriesPosts(posts, "s1").map(p => p.id)).toEqual(["a", "b", "c"]);
  });

  it("다른 시리즈의 글은 제외한다", () => {
    const posts = [part("a", 1), part("x", 1, "s2")];
    expect(getSeriesPosts(posts, "s1").map(p => p.id)).toEqual(["a"]);
  });

  it("seriesOrder가 중복되면 예외를 던진다", () => {
    const posts = [part("a", 1), part("b", 1)];
    expect(() => getSeriesPosts(posts, "s1")).toThrowError(
      /중복된 seriesOrder/
    );
  });

  it("예외 메시지에 중복된 번호가 들어간다", () => {
    const posts = [part("a", 2), part("b", 2)];
    expect(() => getSeriesPosts(posts, "s1")).toThrowError(/2/);
  });
});

describe("getSeriesPosition", () => {
  const posts = [part("a", 1), part("b", 2), part("c", 3)];

  it("현재 위치와 전체 편 수를 반환한다", () => {
    const pos = getSeriesPosition(posts, "s1", 2);
    expect(pos.current).toBe(2);
    expect(pos.total).toBe(3);
  });

  it("이전/다음 편을 반환한다", () => {
    const pos = getSeriesPosition(posts, "s1", 2);
    expect(pos.prev?.id).toBe("a");
    expect(pos.next?.id).toBe("c");
  });

  it("첫 편의 prev는 null이다", () => {
    expect(getSeriesPosition(posts, "s1", 1).prev).toBeNull();
  });

  it("마지막 편의 next는 null이다", () => {
    expect(getSeriesPosition(posts, "s1", 3).next).toBeNull();
  });
});
```

- [ ] **Step 6: 테스트 실패 확인**

```bash
pnpm test
```

Expected: FAIL — 모듈을 찾을 수 없음

- [ ] **Step 7: `src/utils/getSeriesPosts.ts` 작성**

```ts
import type { TaxonomyPost } from "./getPostsByCategory";

/**
 * 시리즈에 속한 글을 편 순서로 정렬해 반환한다.
 *
 * 콘텐츠 스키마의 zod 검증은 글 하나씩만 보므로 같은 시리즈에 같은
 * `seriesOrder`가 두 번 등장하는 것을 잡지 못한다. 그 검사를 여기서 하고,
 * 위반 시 예외를 던져 빌드를 세운다.
 */
export function getSeriesPosts<T extends TaxonomyPost>(
  posts: T[],
  seriesId: string
): T[] {
  const inSeries = posts.filter(p => p.data.series === seriesId);

  const seen = new Map<number, number>();
  for (const p of inSeries) {
    const order = p.data.seriesOrder!;
    seen.set(order, (seen.get(order) ?? 0) + 1);
  }

  const duplicates = [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(([order]) => order);

  if (duplicates.length > 0) {
    throw new Error(
      `시리즈 "${seriesId}"에 중복된 seriesOrder가 있습니다: ${duplicates.join(", ")}`
    );
  }

  return inSeries.sort((a, b) => a.data.seriesOrder! - b.data.seriesOrder!);
}

export function getSeriesPosition<T extends TaxonomyPost>(
  posts: T[],
  seriesId: string,
  order: number
): { current: number; total: number; prev: T | null; next: T | null } {
  const ordered = getSeriesPosts(posts, seriesId);
  const index = ordered.findIndex(p => p.data.seriesOrder === order);

  return {
    current: index + 1,
    total: ordered.length,
    prev: index > 0 ? ordered[index - 1] : null,
    next: index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null,
  };
}
```

- [ ] **Step 8: 테스트 통과 확인**

```bash
pnpm test
```

Expected: 네 파일 전부 PASS

- [ ] **Step 9: 커밋**

```bash
git add src/utils/getPostsByCategory.ts src/utils/getSeriesPosts.ts tests/
git commit -m "feat(utils): 카테고리·시리즈 조회 유틸 추가

- 최소 구조 타입을 받아 Astro 런타임 없이 테스트 가능
- 시리즈 중복 seriesOrder는 예외로 빌드를 세운다"
```

---

### Task 6: 사이드바와 상단바

**Files:**
- Create: `src/components/layout/SidebarNav.astro`
- Create: `src/components/layout/Sidebar.astro`
- Create: `src/components/layout/TopBar.astro`
- Modify: `src/components/Header.astro` (전체 교체, 6줄)
- Modify: `src/layouts/Layout.astro:119-121` (body class)

**Interfaces:**
- Consumes: `CATEGORIES`, `CATEGORY_IDS`, `hasSubcategories`, `getSubcategoryIds`, `getSubcategoryLabel` (Task 3), `t.nav.*` (Task 2), `--sidebar-width` (Task 1)
- Produces: 모든 페이지에 렌더되는 껍데기. 이후 태스크는 `<Header />`를 그대로 쓰면 된다.

- [ ] **Step 1: `SidebarNav.astro` 작성**

아코디언을 `<details>`로 만들어 JavaScript 없이 동작시킨다. 현재 경로가 속한 대분류에만 서버에서 `open`을 부여하므로 첫 페인트부터 상태가 맞고 깜빡임이 없다.

```astro
---
import { getRelativeLocaleUrl } from "astro:i18n";
import {
  CATEGORIES,
  CATEGORY_IDS,
  getSubcategoryIds,
  getSubcategoryLabel,
  hasSubcategories,
} from "@/categories";
import { stripBase, stripLocale } from "@/utils/withBase";
import config from "@/config";

const locale = Astro.currentLocale ?? config.site.lang;
const currentPath = stripLocale(stripBase(Astro.url.pathname), locale);

/** `/categories/deep-dive/rendering/` → ["deep-dive", "rendering"] */
const segments = currentPath.split("/").filter(Boolean);
const activeCategory = segments[0] === "categories" ? segments[1] : undefined;
const activeSubcategory = segments[0] === "categories" ? segments[2] : undefined;

const linkClass =
  "block rounded px-2 py-1.5 text-sm hover:text-accent focus-outline";
---

<nav aria-label="Categories">
  <ul class="space-y-0.5">
    {
      CATEGORY_IDS.map(id => {
        const category = CATEGORIES[id];
        const href = getRelativeLocaleUrl(locale, `categories/${id}`);
        const isActive = activeCategory === id;

        if (!hasSubcategories(id)) {
          return (
            <li>
              <a
                href={href}
                class:list={[linkClass, { "text-accent font-semibold": isActive }]}
                aria-current={isActive ? "page" : undefined}
              >
                {category.label}
              </a>
            </li>
          );
        }

        return (
          <li>
            <details open={isActive}>
              <summary
                class:list={[
                  linkClass,
                  "cursor-pointer list-none marker:content-none",
                  "flex items-center justify-between gap-2",
                  { "text-accent font-semibold": isActive },
                ]}
              >
                <span>{category.label}</span>
                <span aria-hidden="true" class="text-muted-foreground text-xs">
                  ▸
                </span>
              </summary>
              <ul class="mt-0.5 space-y-0.5 ps-3">
                <li>
                  <a
                    href={href}
                    class:list={[
                      linkClass,
                      "text-muted-foreground",
                      { "text-accent font-semibold": isActive && !activeSubcategory },
                    ]}
                  >
                    전체
                  </a>
                </li>
                {getSubcategoryIds(id).map(sub => (
                  <li>
                    <a
                      href={getRelativeLocaleUrl(locale, `categories/${id}/${sub}`)}
                      class:list={[
                        linkClass,
                        "text-muted-foreground",
                        {
                          "text-accent font-semibold":
                            isActive && activeSubcategory === sub,
                        },
                      ]}
                      aria-current={
                        isActive && activeSubcategory === sub ? "page" : undefined
                      }
                    >
                      {getSubcategoryLabel(id, sub)}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        );
      })
    }
  </ul>
</nav>

<style>
  /* 기본 삼각형 마커 제거 (사파리 포함) */
  summary::-webkit-details-marker {
    display: none;
  }
  details[open] > summary span[aria-hidden] {
    transform: rotate(90deg);
  }
  summary span[aria-hidden] {
    display: inline-block;
    transition: transform 150ms ease;
  }
</style>
```

- [ ] **Step 2: `Sidebar.astro` 작성**

프로필, 카테고리 내비, 유틸(검색·아카이브·테마), 소셜을 모두 담는다. `features.showArchives`를 반드시 존중한다.

```astro
---
import { getRelativeLocaleUrl } from "astro:i18n";
import IconArchive from "@/assets/icons/IconArchive.svg";
import IconSearch from "@/assets/icons/IconSearch.svg";
import IconSunHigh from "@/assets/icons/IconSunHigh.svg";
import IconMoon from "@/assets/icons/IconMoon.svg";
import IconRss from "@/assets/icons/IconRss.svg";
import SidebarNav from "./SidebarNav.astro";
import Socials from "@/components/Socials.astro";
import { useTranslations } from "@/i18n";
import config from "@/config";

const { site, features } = config;
const locale = Astro.currentLocale ?? site.lang;
const t = useTranslations(locale);
const rssHref = getRelativeLocaleUrl(locale, "rss.xml");
---

<a
  id="skip-to-content"
  href="#main-content"
  class="bg-background text-accent absolute inset-s-16 -top-full z-50 px-3 py-2 backdrop-blur-lg transition-all focus:top-4"
>
  {t.a11y.skipToContent}
</a>

<aside
  id="site-sidebar"
  aria-label={t.nav.categories}
  class="border-border bg-background fixed inset-y-0 start-0 z-40 flex w-(--sidebar-width)
         -translate-x-full flex-col overflow-y-auto border-e px-5 py-7
         transition-transform duration-200 lg:translate-x-0
         rtl:translate-x-full rtl:lg:translate-x-0"
>
  <a
    href={getRelativeLocaleUrl(locale, "")}
    class="hover:text-accent text-lg font-bold"
  >
    {site.title}
  </a>
  <p class="text-muted-foreground mt-1.5 text-sm leading-relaxed">
    {site.description}
  </p>

  <div class="mt-7">
    <SidebarNav />
  </div>

  <div class="border-border mt-7 space-y-0.5 border-t pt-4">
    <a
      href={getRelativeLocaleUrl(locale, "posts")}
      class="hover:text-accent focus-outline block rounded px-2 py-1.5 text-sm"
    >
      {t.nav.posts}
    </a>
    <a
      href={getRelativeLocaleUrl(locale, "tags")}
      class="hover:text-accent focus-outline block rounded px-2 py-1.5 text-sm"
    >
      {t.nav.tags}
    </a>
    <a
      href={getRelativeLocaleUrl(locale, "about")}
      class="hover:text-accent focus-outline block rounded px-2 py-1.5 text-sm"
    >
      {t.nav.about}
    </a>
    {
      features.showArchives && (
        <a
          href={getRelativeLocaleUrl(locale, "archives")}
          class="hover:text-accent focus-outline flex items-center gap-2 rounded px-2 py-1.5 text-sm"
        >
          <IconArchive class="size-4" />
          {t.nav.archives}
        </a>
      )
    }
  </div>

  <div class="mt-auto pt-6">
    <div class="flex items-center gap-1">
      {
        features.search !== false && (
          <a
            href={getRelativeLocaleUrl(locale, "search")}
            class="focus-outline hover:text-accent rounded p-2"
            title={t.nav.search}
            aria-label={t.nav.search}
          >
            <IconSearch class="size-5" />
          </a>
        )
      }
      <a
        href={rssHref}
        class="focus-outline hover:text-accent rounded p-2"
        title="RSS"
        aria-label="RSS"
      >
        <IconRss class="size-5" />
      </a>
      {
        features.lightAndDarkMode && (
          <button
            id="theme-btn"
            type="button"
            class="focus-outline hover:[&>svg]:stroke-accent relative size-9 rounded"
            title={t.a11y.toggleTheme}
            aria-label="auto"
            aria-live="polite"
          >
            <IconMoon class="absolute top-1/2 left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <IconSunHigh class="absolute top-1/2 left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          </button>
        )
      }
    </div>
    <div class="mt-3">
      <Socials />
    </div>
  </div>
</aside>

<button
  id="sidebar-overlay"
  type="button"
  aria-label={t.a11y.closeMenu}
  class="fixed inset-0 z-30 hidden bg-black/40 lg:hidden"></button>
```

- [ ] **Step 3: `TopBar.astro` 작성 (모바일 전용)**

```astro
---
import { getRelativeLocaleUrl } from "astro:i18n";
import IconMenuDeep from "@/assets/icons/IconMenuDeep.svg";
import { useTranslations } from "@/i18n";
import config from "@/config";

const { site } = config;
const locale = Astro.currentLocale ?? site.lang;
const t = useTranslations(locale);
---

<header
  class="border-border bg-background/95 sticky top-0 z-20 border-b backdrop-blur lg:hidden"
>
  <div class="flex min-h-14 items-center gap-3 px-4">
    <button
      id="sidebar-menu-btn"
      type="button"
      class="focus-outline rounded p-2"
      aria-label={t.a11y.openMenu}
      aria-expanded="false"
      aria-controls="site-sidebar"
      data-label-open={t.a11y.openMenu}
      data-label-close={t.a11y.closeMenu}
    >
      <IconMenuDeep />
    </button>
    <a
      href={getRelativeLocaleUrl(locale, "")}
      class="hover:text-accent font-semibold"
    >
      {site.title}
    </a>
  </div>
</header>

<script>
  let cleanup = () => {};

  function initSidebar() {
    cleanup();

    const button =
      document.querySelector<HTMLButtonElement>("#sidebar-menu-btn");
    const sidebar = document.querySelector<HTMLElement>("#site-sidebar");
    const overlay =
      document.querySelector<HTMLButtonElement>("#sidebar-overlay");
    if (!button || !sidebar || !overlay) return;

    // AbortController로 리스너를 묶어두면 astro:before-swap에서 한 번에
    // 해제할 수 있다. 이게 없으면 페이지를 이동할수록 리스너가 쌓인다.
    const controller = new AbortController();
    const opts = { signal: controller.signal };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const openLabel = button.dataset.labelOpen ?? "Open menu";
    const closeLabel = button.dataset.labelClose ?? "Close menu";

    const setOpen = (open: boolean) => {
      const mobileOpen = open && !desktop.matches;
      button.setAttribute("aria-expanded", String(mobileOpen));
      button.setAttribute("aria-label", mobileOpen ? closeLabel : openLabel);
      sidebar.classList.toggle("-translate-x-full", !mobileOpen);
      sidebar.classList.toggle("rtl:translate-x-full", !mobileOpen);
      overlay.classList.toggle("hidden", !mobileOpen);
      document.body.classList.toggle("overflow-hidden", mobileOpen);
    };

    button.addEventListener(
      "click",
      () => setOpen(button.getAttribute("aria-expanded") !== "true"),
      opts
    );
    overlay.addEventListener(
      "click",
      () => {
        setOpen(false);
        button.focus();
      },
      opts
    );
    sidebar.addEventListener(
      "click",
      e => {
        if ((e.target as Element).closest("a")) setOpen(false);
      },
      opts
    );
    document.addEventListener(
      "keydown",
      e => {
        if (e.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
          setOpen(false);
          button.focus();
        }
      },
      opts
    );
    desktop.addEventListener("change", () => setOpen(false), opts);

    setOpen(false);

    cleanup = () => {
      controller.abort();
      document.body.classList.remove("overflow-hidden");
    };
  }

  initSidebar();
  document.addEventListener("astro:before-swap", () => cleanup());
  document.addEventListener("astro:after-swap", initSidebar);
</script>
```

- [ ] **Step 4: `Header.astro` 전체 교체**

여러 페이지가 `<Header />`를 import하고 있으므로 이 파일을 조립부로만 남긴다. 페이지 파일은 하나도 고치지 않는다.

```astro
---
import Sidebar from "./layout/Sidebar.astro";
import TopBar from "./layout/TopBar.astro";
---

<Sidebar />
<TopBar />
```

- [ ] **Step 5: `Layout.astro`의 body에 사이드바 오프셋 추가**

119–121행의 body 태그 class 끝에 `lg:ps-(--sidebar-width)`를 덧붙인다.

```astro
  <body
    class="bg-background font-app text-foreground selection:bg-accent/75 selection:text-accent-foreground flex min-h-svh flex-col lg:ps-(--sidebar-width)"
  >
```

- [ ] **Step 6: 빌드 및 타입 검사**

```bash
pnpm build
```

Expected: 성공

- [ ] **Step 7: 산출물 검사 — 사이드바와 아카이브 링크**

```bash
grep -c 'id="site-sidebar"' dist/index.html
grep -o 'href="[^"]*archives[^"]*"' dist/index.html | head -1
grep -c 'id="theme-btn"' dist/index.html
```

Expected: 각각 `1`, `href="/archives/"`, `1`. 아카이브 링크가 안 나오면 `features.showArchives`가 무시된 것이므로 Sidebar를 고친다. `theme-btn`이 2 이상이면 중복 렌더다.

- [ ] **Step 8: 아코디언이 서버에서 열려 있는지 확인**

```bash
pnpm dev &
sleep 6
curl -s http://localhost:4321/categories/deep-dive/ | grep -o '<details[^>]*>' | head -5
kill %1
```

Expected: `deep-dive` 항목의 `<details open>`가 보이고 나머지는 `<details>`다. (`/categories/` 라우트는 Task 7에서 만들므로 이 단계에서 404가 나면 Task 7 완료 후 다시 확인한다.)

- [ ] **Step 9: 육안 확인**

```bash
pnpm dev
```

확인할 것: 데스크톱에서 좌측 사이드바 고정 + 상단바 없음, 본문이 사이드바에 가려지지 않음, 1024px 미만으로 줄이면 사이드바가 사라지고 햄버거가 나타남, 햄버거로 열고 Esc로 닫힘, 대분류 클릭 시 소분류 펼침(JS 비활성 상태에서도).

- [ ] **Step 10: 커밋**

```bash
git add src/components/layout src/components/Header.astro src/layouts/Layout.astro
git commit -m "feat(layout): 좌측 사이드바와 모바일 상단바 도입

- <details> 기반 카테고리 아코디언 (JS 없이 동작, 현재 분류 자동 펼침)
- Header.astro는 조립부로 축소해 업스트림 충돌 면적 최소화
- 모바일 사이드바 스크립트는 AbortController로 리스너 정리"
```

---

### Task 7: 카테고리 라우트

**Files:**
- Create: `src/pages/categories/index.astro`
- Create: `src/pages/categories/[category]/index.astro`
- Create: `src/pages/categories/[category]/[subcategory]/[...page].astro`

**Interfaces:**
- Consumes: `CATEGORIES`, `CATEGORY_IDS`, `getSubcategoryIds`, `getSubcategoryLabel`, `hasSubcategories` (Task 3), `filterByCategory`, `filterBySubcategory`, `groupBySubcategory` (Task 5), `getSeriesByCategory` (Task 3), `getSeriesPosts` (Task 5), `t.category.*` (Task 2)
- Produces: `/categories`, `/categories/{id}`, `/categories/{id}/{sub}` 라우트

- [ ] **Step 1: `src/pages/categories/index.astro` 작성**

```astro
---
import { getCollection } from "astro:content";
import { getRelativeLocaleUrl } from "astro:i18n";
import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Main from "@/components/Main.astro";
import Footer from "@/components/Footer.astro";
import { CATEGORIES, CATEGORY_IDS } from "@/categories";
import { filterByCategory } from "@/utils/getPostsByCategory";
import { getSortedPosts } from "@/utils/getSortedPosts";
import { useTranslations } from "@/i18n";
import config from "@/config";

const posts = getSortedPosts(await getCollection("posts"));
const locale = Astro.currentLocale ?? config.site.lang;
const t = useTranslations(locale);

const overview = CATEGORY_IDS.map(id => ({
  id,
  label: CATEGORIES[id].label,
  description: CATEGORIES[id].description,
  count: filterByCategory(posts, id).length,
}));
---

<Layout title={`${t.nav.categories} | ${config.site.title}`}>
  <Header />
  <Main pageTitle={t.nav.categories} pageDesc={t.category.desc}>
    <ul class="space-y-4">
      {
        overview.map(c => (
          <li class="border-border rounded-lg border p-4">
            <a
              href={getRelativeLocaleUrl(locale, `categories/${c.id}`)}
              class="text-accent text-lg font-semibold underline-offset-4 hover:underline"
            >
              {c.label}
            </a>
            <p class="text-muted-foreground mt-1 text-sm">{c.description}</p>
            <p class="text-muted-foreground mt-2 text-sm">{c.count}</p>
          </li>
        ))
      }
    </ul>
  </Main>
  <Footer />
</Layout>
```

- [ ] **Step 2: `src/pages/categories/[category]/index.astro` 작성**

대분류 성격에 따라 세 가지로 분기한다: 소분류가 있으면 소분류별 묶음, `project`면 시리즈 카드, 나머지는 글 목록.

```astro
---
import { getCollection } from "astro:content";
import { getRelativeLocaleUrl } from "astro:i18n";
import type { GetStaticPaths } from "astro";
import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Main from "@/components/Main.astro";
import Card from "@/components/Card.astro";
import Footer from "@/components/Footer.astro";
import {
  CATEGORIES,
  CATEGORY_IDS,
  getSubcategoryLabel,
  hasSubcategories,
  type CategoryId,
} from "@/categories";
import { getSeriesByCategory } from "@/series";
import { filterByCategory, groupBySubcategory } from "@/utils/getPostsByCategory";
import { getSeriesPosts } from "@/utils/getSeriesPosts";
import { getSortedPosts } from "@/utils/getSortedPosts";
import { useTranslations } from "@/i18n";
import { tplStr } from "@/i18n";
import config from "@/config";

export const getStaticPaths = (() =>
  CATEGORY_IDS.map(category => ({ params: { category } }))) satisfies GetStaticPaths;

const category = Astro.params.category as CategoryId;
const meta = CATEGORIES[category];

const allPosts = getSortedPosts(await getCollection("posts"));
const posts = filterByCategory(allPosts, category);

const locale = Astro.currentLocale ?? config.site.lang;
const t = useTranslations(locale);

const groups = hasSubcategories(category)
  ? groupBySubcategory(posts, category)
  : [];

// getSeriesPosts는 중복 seriesOrder를 만나면 예외를 던져 빌드를 세운다.
const series = getSeriesByCategory(category).map(s => ({
  ...s,
  count: getSeriesPosts(allPosts, s.id).length,
}));
---

<Layout title={`${meta.label} | ${config.site.title}`}>
  <Header />
  <Main pageTitle={meta.label} pageDesc={meta.description}>
    {
      groups.length > 0 && (
        <div class="space-y-8">
          {groups.map(group => (
            <section>
              <h2 class="border-border border-b pb-2 text-xl font-semibold">
                <a
                  href={getRelativeLocaleUrl(
                    locale,
                    `categories/${category}/${group.id}`
                  )}
                  class="hover:text-accent"
                >
                  {getSubcategoryLabel(category, group.id)}
                </a>
              </h2>
              {group.posts.length > 0 ? (
                <ul>
                  {group.posts.slice(0, 3).map(post => (
                    <Card variant="h3" {...post} />
                  ))}
                </ul>
              ) : (
                <p class="text-muted-foreground mt-3 text-sm">—</p>
              )}
              {group.posts.length > 3 && (
                <a
                  href={getRelativeLocaleUrl(
                    locale,
                    `categories/${category}/${group.id}`
                  )}
                  class="text-accent text-sm underline-offset-4 hover:underline"
                >
                  {t.category.seeMore}
                </a>
              )}
            </section>
          ))}
        </div>
      )
    }

    {
      series.length > 0 && (
        <ul class="space-y-4">
          {series.map(s => (
            <li class="border-border rounded-lg border p-4">
              <a
                href={getRelativeLocaleUrl(locale, `series/${s.id}`)}
                class="text-accent text-lg font-semibold underline-offset-4 hover:underline"
              >
                {s.label}
              </a>
              <p class="text-muted-foreground mt-1 text-sm">{s.description}</p>
              <p class="text-muted-foreground mt-2 text-sm">
                {tplStr(t.category.seriesCount, { count: s.count })}
                {" · "}
                {s.status === "ongoing" ? t.series.ongoing : t.series.completed}
              </p>
            </li>
          ))}
        </ul>
      )
    }

    {
      groups.length === 0 && series.length === 0 && (
        <ul>
          {posts.map(post => (
            <Card {...post} />
          ))}
        </ul>
      )
    }
  </Main>
  <Footer />
</Layout>
```

`tplStr`은 `src/i18n/format.ts`에 `tplStr(template: string, vars: Record<string, string | number>)`로 정의되어 있고 `src/i18n/index.ts`에서 재export된다. 숫자를 그대로 넘겨도 된다.

- [ ] **Step 3: `src/pages/categories/[category]/[subcategory]/[...page].astro` 작성**

`src/pages/tags/[tag]/[...page].astro`의 페이지네이션 패턴을 따른다.

```astro
---
import { getCollection } from "astro:content";
import type { GetStaticPathsOptions } from "astro";
import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Main from "@/components/Main.astro";
import Card from "@/components/Card.astro";
import Footer from "@/components/Footer.astro";
import Pagination from "@/components/Pagination.astro";
import {
  CATEGORIES,
  CATEGORY_IDS,
  getSubcategoryIds,
  getSubcategoryLabel,
  type CategoryId,
} from "@/categories";
import { filterBySubcategory } from "@/utils/getPostsByCategory";
import { getSortedPosts } from "@/utils/getSortedPosts";
import config from "@/config";

export async function getStaticPaths({ paginate }: GetStaticPathsOptions) {
  const posts = getSortedPosts(await getCollection("posts"));

  return CATEGORY_IDS.flatMap(category =>
    getSubcategoryIds(category).flatMap(subcategory =>
      paginate(filterBySubcategory(posts, category, subcategory), {
        params: { category, subcategory },
        pageSize: config.posts.perPage,
      })
    )
  );
}

const { page } = Astro.props;
const category = Astro.params.category as CategoryId;
const subcategory = Astro.params.subcategory as string;

const categoryLabel = CATEGORIES[category].label;
const subLabel = getSubcategoryLabel(category, subcategory);
---

<Layout title={`${categoryLabel} › ${subLabel} | ${config.site.title}`}>
  <Header />
  <Main pageTitle={`${categoryLabel} › ${subLabel}`}>
    <ul>
      {page.data.map(post => <Card {...post} />)}
    </ul>
  </Main>
  <Pagination {page} />
  <Footer noMarginTop={page.lastPage > 1} />
</Layout>
```

- [ ] **Step 4: 빌드 검증**

```bash
pnpm build
```

Expected: 성공

- [ ] **Step 5: 생성된 라우트 확인**

```bash
ls dist/categories/
ls dist/categories/deep-dive/
ls dist/categories/study/
```

Expected: `dist/categories/` 아래 `deep-dive`, `project`, `troubleshooting`, `study`, `etc` 5개 + `index.html`. `deep-dive` 아래 `rendering`, `architecture`, `memory` 3개 + `index.html`. 소분류가 없는 `project`, `troubleshooting`, `etc` 아래에는 하위 디렉토리가 없다.

- [ ] **Step 6: 죽은 링크가 없는지 확인**

```bash
grep -oh 'href="/categories/[^"]*"' dist/**/*.html 2>/dev/null \
  | sort -u | sed 's/href="//;s/"$//' | while read -r p; do
      f="dist${p%/}/index.html"
      [ -f "$f" ] || echo "MISSING: $p"
    done
echo "검사 완료"
```

Expected: `MISSING` 출력이 없다.

- [ ] **Step 7: 커밋**

```bash
git add src/pages/categories
git commit -m "feat(routes): 카테고리 라우트 추가

- /categories, /categories/{대분류}, /categories/{대분류}/{소분류}
- 대분류 페이지는 소분류 묶음 / 시리즈 카드 / 글 목록으로 분기"
```

---

### Task 8: 시리즈 라우트와 글 페이지 시리즈 UI

**Files:**
- Create: `src/pages/series/index.astro`
- Create: `src/pages/series/[slug].astro`
- Create: `src/components/series/SeriesBox.astro`
- Create: `src/components/series/SeriesNav.astro`
- Modify: `src/pages/posts/[...slug]/index.astro`

**Interfaces:**
- Consumes: `SERIES`, `SERIES_IDS` (Task 3), `getSeriesPosts`, `getSeriesPosition` (Task 5), `t.series.*` (Task 2)
- Produces: `/series`, `/series/{slug}` 라우트. 글 페이지에서 시리즈 소속 글에만 렌더되는 두 컴포넌트.

- [ ] **Step 1: `SeriesBox.astro` 작성**

시리즈에 속한 글에만 렌더한다. 접힌 전체 목록을 `<details>`로 둔다.

```astro
---
import type { CollectionEntry } from "astro:content";
import { getRelativeLocaleUrl } from "astro:i18n";
import { SERIES, type SeriesId } from "@/series";
import { getPostUrl } from "@/utils/getPostPaths";
import { useTranslations, tplStr } from "@/i18n";
import config from "@/config";

type Props = {
  seriesId: SeriesId;
  posts: CollectionEntry<"posts">[];
  currentOrder: number;
};

const { seriesId, posts, currentOrder } = Astro.props;
const meta = SERIES[seriesId];

const locale = Astro.currentLocale ?? config.site.lang;
const t = useTranslations(locale);
const current = posts.findIndex(p => p.data.seriesOrder === currentOrder) + 1;
---

<aside class="border-border bg-muted/40 my-6 rounded-lg border p-4">
  <p class="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
    {t.series.title}
  </p>
  <a
    href={getRelativeLocaleUrl(locale, `series/${seriesId}`)}
    class="text-accent mt-1 block font-semibold underline-offset-4 hover:underline"
  >
    {meta.label}
  </a>
  <p class="text-muted-foreground mt-1 text-sm">
    {tplStr(t.series.part, { current: String(current), total: String(posts.length) })}
  </p>

  <details class="mt-3">
    <summary class="hover:text-accent cursor-pointer text-sm">
      {t.series.inThisSeries}
    </summary>
    <ol class="mt-2 space-y-1.5 ps-4">
      {
        posts.map(p => (
          <li
            class:list={[
              "text-sm",
              p.data.seriesOrder === currentOrder
                ? "text-accent font-semibold"
                : "text-muted-foreground",
            ]}
          >
            {p.data.seriesOrder === currentOrder ? (
              <span>{p.data.title}</span>
            ) : (
              <a
                href={getPostUrl(p.id, p.filePath, Astro.currentLocale)}
                class="hover:text-accent underline-offset-4 hover:underline"
              >
                {p.data.title}
              </a>
            )}
          </li>
        ))
      }
    </ol>
  </details>
</aside>
```

- [ ] **Step 2: `SeriesNav.astro` 작성**

```astro
---
import type { CollectionEntry } from "astro:content";
import { getPostUrl } from "@/utils/getPostPaths";
import { useTranslations } from "@/i18n";
import config from "@/config";

type Props = {
  prev: CollectionEntry<"posts"> | null;
  next: CollectionEntry<"posts"> | null;
};

const { prev, next } = Astro.props;
const locale = Astro.currentLocale ?? config.site.lang;
const t = useTranslations(locale);
---

{
  (prev || next) && (
    <nav class="border-border mt-8 grid gap-3 border-t pt-6 sm:grid-cols-2">
      {prev ? (
        <a
          href={getPostUrl(prev.id, prev.filePath, Astro.currentLocale)}
          class="border-border hover:border-accent rounded-lg border p-3"
        >
          <span class="text-muted-foreground text-xs">{t.series.prevPart}</span>
          <span class="mt-1 block text-sm font-medium">{prev.data.title}</span>
        </a>
      ) : (
        <span />
      )}
      {next && (
        <a
          href={getPostUrl(next.id, next.filePath, Astro.currentLocale)}
          class="border-border hover:border-accent rounded-lg border p-3 sm:text-end"
        >
          <span class="text-muted-foreground text-xs">{t.series.nextPart}</span>
          <span class="mt-1 block text-sm font-medium">{next.data.title}</span>
        </a>
      )}
    </nav>
  )
}
```

- [ ] **Step 3: `src/pages/series/[slug].astro` 작성**

```astro
---
import { getCollection } from "astro:content";
import type { GetStaticPaths } from "astro";
import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Main from "@/components/Main.astro";
import Card from "@/components/Card.astro";
import Footer from "@/components/Footer.astro";
import { SERIES, SERIES_IDS, type SeriesId } from "@/series";
import { getSeriesPosts } from "@/utils/getSeriesPosts";
import { postFilter } from "@/utils/postFilter";
import { useTranslations } from "@/i18n";
import config from "@/config";

export const getStaticPaths = (() =>
  SERIES_IDS.map(slug => ({ params: { slug } }))) satisfies GetStaticPaths;

const slug = Astro.params.slug as SeriesId;
const meta = SERIES[slug];

// 최신순이 아니라 편 순서로 정렬한다. 중복 순번이 있으면 예외로 빌드가 선다.
const all = (await getCollection("posts")).filter(postFilter);
const posts = getSeriesPosts(all, slug);

const locale = Astro.currentLocale ?? config.site.lang;
const t = useTranslations(locale);
---

<Layout title={`${meta.label} | ${config.site.title}`}>
  <Header />
  <Main pageTitle={meta.label} pageDesc={meta.description}>
    <p class="text-muted-foreground -mt-4 mb-6 text-sm">
      {posts.length} · {
        meta.status === "ongoing" ? t.series.ongoing : t.series.completed
      }
    </p>
    <ol>
      {posts.map(post => <Card {...post} />)}
    </ol>
  </Main>
  <Footer />
</Layout>
```

- [ ] **Step 4: `src/pages/series/index.astro` 작성**

```astro
---
import { getCollection } from "astro:content";
import { getRelativeLocaleUrl } from "astro:i18n";
import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Main from "@/components/Main.astro";
import Footer from "@/components/Footer.astro";
import { SERIES, SERIES_IDS } from "@/series";
import { getSeriesPosts } from "@/utils/getSeriesPosts";
import { postFilter } from "@/utils/postFilter";
import { useTranslations, tplStr } from "@/i18n";
import config from "@/config";

const all = (await getCollection("posts")).filter(postFilter);
const locale = Astro.currentLocale ?? config.site.lang;
const t = useTranslations(locale);

const list = SERIES_IDS.map(id => ({
  id,
  ...SERIES[id],
  count: getSeriesPosts(all, id).length,
}));
---

<Layout title={`${t.series.title} | ${config.site.title}`}>
  <Header />
  <Main pageTitle={t.series.title} pageDesc={t.series.desc}>
    <ul class="space-y-4">
      {
        list.map(s => (
          <li class="border-border rounded-lg border p-4">
            <a
              href={getRelativeLocaleUrl(locale, `series/${s.id}`)}
              class="text-accent text-lg font-semibold underline-offset-4 hover:underline"
            >
              {s.label}
            </a>
            <p class="text-muted-foreground mt-1 text-sm">{s.description}</p>
            <p class="text-muted-foreground mt-2 text-sm">
              {tplStr(t.category.seriesCount, { count: String(s.count) })}
              {" · "}
              {s.status === "ongoing" ? t.series.ongoing : t.series.completed}
            </p>
          </li>
        ))
      }
    </ul>
  </Main>
  <Footer />
</Layout>
```

- [ ] **Step 5: 글 페이지에 시리즈 UI 연결**

`src/pages/posts/[...slug]/index.astro`를 수정한다. `getStaticPaths`의 `props`에 시리즈 정보를 추가하려면 컬렉션 전체가 필요하므로, 프론트매터에서 직접 조회하는 편이 단순하다.

frontmatter 부분(`const { post, prevPost, nextPost } = Astro.props;` 근처)에 추가:

```ts
import { getCollection } from "astro:content";
import { postFilter } from "@/utils/postFilter";
import { getSeriesPosts, getSeriesPosition } from "@/utils/getSeriesPosts";
import SeriesBox from "@/components/series/SeriesBox.astro";
import SeriesNav from "@/components/series/SeriesNav.astro";
import type { SeriesId } from "@/series";

const seriesId = post.data.series as SeriesId | undefined;
const seriesOrder = post.data.seriesOrder;

const seriesPosts = seriesId
  ? getSeriesPosts((await getCollection("posts")).filter(postFilter), seriesId)
  : [];
const seriesPosition =
  seriesId && seriesOrder
    ? getSeriesPosition(seriesPosts, seriesId, seriesOrder)
    : null;
```

본문 렌더 직전(`<Content />` 또는 `<slot />` 앞)에 삽입:

```astro
{
  seriesId && seriesOrder && (
    <SeriesBox seriesId={seriesId} posts={seriesPosts} currentOrder={seriesOrder} />
  )
}
```

본문 렌더 직후, 기존 `<AdjacentPostNav />` 앞에 삽입:

```astro
{
  seriesPosition && (
    <SeriesNav prev={seriesPosition.prev} next={seriesPosition.next} />
  )
}
```

- [ ] **Step 6: 빌드 검증**

```bash
pnpm build
```

Expected: 성공. `dist/series/index.html`과 `dist/series/dod-digitaltwin-unity/index.html`이 생긴다.

- [ ] **Step 7: 시리즈 글이 없어도 깨지지 않는지 확인**

현재 시리즈에 속한 글이 하나도 없다. 빈 시리즈 페이지가 정상 렌더되는지 본다.

```bash
grep -c "dod-digitaltwin-unity" dist/series/index.html
ls dist/series/dod-digitaltwin-unity/index.html
```

Expected: 각각 1 이상, 파일 존재.

- [ ] **Step 8: 중복 순번 검출이 동작하는지 확인**

```bash
for n in 1 2; do
cat > "src/content/posts/_ko/__s$n.md" <<EOF
---
title: series probe $n
description: probe
pubDatetime: 2026-01-0$n
category: project
series: dod-digitaltwin-unity
seriesOrder: 1
---
probe
EOF
done
pnpm build; echo "exit=$?"
```

Expected: 빌드 실패, 메시지에 `중복된 seriesOrder`와 `1`이 포함된다.

- [ ] **Step 9: 정상 순번으로 고쳐 시리즈 UI 육안 확인**

```bash
perl -pi -e 's/^seriesOrder: 1$/seriesOrder: 2/' src/content/posts/_ko/__s2.md
pnpm build && pnpm preview
```

확인할 것: `/series/dod-digitaltwin-unity/`에 두 글이 **편 순서**(1편 → 2편)로 나열됨. 2편 글 페이지 상단에 시리즈 박스와 `2편 중 2편`, 하단에 이전 편 링크. 시리즈 없는 글에는 아무것도 안 뜸.

- [ ] **Step 10: 프로브 제거**

```bash
rm src/content/posts/_ko/__s1.md src/content/posts/_ko/__s2.md
pnpm build
```

Expected: 성공

- [ ] **Step 11: 커밋**

```bash
git add src/pages/series src/components/series "src/pages/posts/[...slug]/index.astro"
git commit -m "feat(series): 시리즈 라우트와 글 페이지 시리즈 UI 추가

- /series, /series/{slug} (편 순서 정렬)
- 시리즈 소속 글에만 상단 안내 박스와 이전/다음 편 내비 렌더
- 중복 seriesOrder는 빌드를 세운다"
```

---

### Task 9: 목차

**Files:**
- Create: `src/components/toc/InlineToc.astro`
- Create: `src/components/toc/FloatingToc.astro`
- Modify: `src/pages/posts/[...slug]/index.astro`

**Interfaces:**
- Consumes: Astro `render()`가 반환하는 `headings: { depth: number; slug: string; text: string }[]`, `t.toc.title` (Task 2), `--toc-width` (Task 1)
- Produces: 없음 (최종 소비자)

- [ ] **Step 1: `InlineToc.astro` 작성**

```astro
---
import type { MarkdownHeading } from "astro";
import { useTranslations } from "@/i18n";
import config from "@/config";

type Props = { headings: MarkdownHeading[] };

const { headings } = Astro.props;
const locale = Astro.currentLocale ?? config.site.lang;
const t = useTranslations(locale);

// h2, h3만 목차에 싣는다. h1은 글 제목, h4 이하는 너무 잘다.
const items = headings.filter(h => h.depth === 2 || h.depth === 3);
---

{
  items.length > 1 && (
    <details
      id="inline-toc"
      open
      class="border-border bg-muted/40 my-6 rounded-lg border p-4"
    >
      <summary class="hover:text-accent cursor-pointer text-sm font-semibold">
        {t.toc.title}
      </summary>
      <ul class="mt-3 space-y-1.5">
        {items.map(h => (
          <li class:list={["text-sm", h.depth === 3 && "ps-4"]}>
            <a
              href={`#${h.slug}`}
              class="text-muted-foreground hover:text-accent underline-offset-4 hover:underline"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </details>
  )
}

{/* 이 지점을 지나면 부유 목차가 나타난다 */}
<div id="toc-sentinel" aria-hidden="true"></div>
```

- [ ] **Step 2: `FloatingToc.astro` 작성**

본문 흐름에 참여하지 않고 우측 여백에 위치한다. 폭 예산상 `xl`(1280px) 미만에서는 렌더하지 않는다.

```astro
---
import type { MarkdownHeading } from "astro";
import { useTranslations } from "@/i18n";
import config from "@/config";

type Props = { headings: MarkdownHeading[] };

const { headings } = Astro.props;
const locale = Astro.currentLocale ?? config.site.lang;
const t = useTranslations(locale);

const items = headings.filter(h => h.depth === 2 || h.depth === 3);
---

{
  items.length > 1 && (
    <nav
      id="floating-toc"
      aria-label={t.toc.title}
      class="pointer-events-none fixed top-24 hidden w-(--toc-width) opacity-0
             transition-opacity duration-200 xl:block
             ltr:left-[calc(50%+var(--sidebar-width)/2+var(--content-width)/2+2rem)]
             rtl:right-[calc(50%+var(--sidebar-width)/2+var(--content-width)/2+2rem)]"
    >
      <p class="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
        {t.toc.title}
      </p>
      <ul class="border-border space-y-2 border-s">
        {items.map(h => (
          <li class:list={["text-xs leading-snug", h.depth === 3 && "ps-3"]}>
            <a
              href={`#${h.slug}`}
              data-toc-link={h.slug}
              class="text-muted-foreground hover:text-accent block ps-3 underline-offset-4 hover:underline"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

<script>
  let cleanup = () => {};

  function initToc() {
    cleanup();

    const toc = document.querySelector<HTMLElement>("#floating-toc");
    const sentinel = document.querySelector<HTMLElement>("#toc-sentinel");
    if (!toc || !sentinel) return;

    // 1) 인라인 목차를 지나쳤는지 감시해 부유 목차를 나타내고 감춘다.
    const reveal = new IntersectionObserver(
      ([entry]) => {
        const show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        toc.classList.toggle("opacity-0", !show);
        toc.classList.toggle("opacity-100", show);
        toc.classList.toggle("pointer-events-none", !show);
      },
      { rootMargin: "-80px 0px 0px 0px" }
    );
    reveal.observe(sentinel);

    // 2) 헤딩 스크롤 스파이.
    const links = new Map<string, HTMLAnchorElement>();
    toc.querySelectorAll<HTMLAnchorElement>("[data-toc-link]").forEach(a => {
      links.set(a.dataset.tocLink!, a);
    });

    const targets = [...links.keys()]
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const setActive = (id: string) => {
      links.forEach((a, key) => {
        const on = key === id;
        a.classList.toggle("text-accent", on);
        a.classList.toggle("font-semibold", on);
        a.classList.toggle("text-muted-foreground", !on);
      });
    };

    const spy = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );
    targets.forEach(el => spy.observe(el));

    cleanup = () => {
      reveal.disconnect();
      spy.disconnect();
    };
  }

  initToc();
  document.addEventListener("astro:before-swap", () => cleanup());
  document.addEventListener("astro:after-swap", initToc);
</script>
```

`left` 계산의 근거: body에 `lg:ps-(--sidebar-width)`가 걸려 본문 영역이 사이드바만큼 오른쪽으로 밀린 상태에서 중앙 정렬되므로, 본문의 오른쪽 끝은 `50% + sidebar/2 + content/2`다. 거기에 `2rem` 간격을 두고 목차를 놓는다. 폭 값은 전부 Task 1에서 정의한 토큰을 참조하며 숫자를 다시 적지 않는다.

- [ ] **Step 3: 글 페이지에 목차 연결**

`src/pages/posts/[...slug]/index.astro`의 **76행**을 바꾼다.

기존:

```ts
const { Content } = await render(post);
```

변경 후:

```ts
const { Content, headings } = await render(post);
```

import 추가:

```ts
import InlineToc from "@/components/toc/InlineToc.astro";
import FloatingToc from "@/components/toc/FloatingToc.astro";
```

Task 8에서 넣은 `<SeriesBox />` 바로 아래에 인라인 목차를 두고, 레이아웃 최상단(`<Layout>` 바로 안, `<Header />` 다음)에 부유 목차를 둔다.

```astro
<InlineToc {headings} />
```

```astro
<FloatingToc {headings} />
```

- [ ] **Step 4: 빌드 검증**

```bash
pnpm build
```

Expected: 성공

- [ ] **Step 5: 목차가 렌더되는지 확인**

헤딩이 2개 이상인 글을 찾아 검사한다.

```bash
f=$(grep -rl 'id="inline-toc"' dist/posts | head -1)
echo "검사 대상: $f"
grep -c 'id="floating-toc"' "$f"
grep -c 'id="toc-sentinel"' "$f"
```

Expected: `floating-toc` 1개, `toc-sentinel` 1개.

- [ ] **Step 6: 육안 확인 (가장 중요)**

```bash
pnpm preview
```

브라우저를 1400px 폭으로 두고 헤딩이 여러 개인 글을 연다.

확인할 것:
1. 처음에는 우측 목차가 안 보이고 본문 상단 인라인 목차만 있다.
2. 스크롤을 내려 인라인 목차를 지나치면 우측에 목차가 서서히 나타난다.
3. **우측 목차가 본문 글자를 가리지 않는다.** 겹치면 `left` 계산의 `384px`나 `2rem`을 조정한다.
4. 스크롤에 따라 현재 절이 하이라이트된다.
5. 위로 되돌아가면 우측 목차가 사라진다.
6. 창을 1279px로 줄이면 우측 목차가 사라지고 인라인 목차만 남는다.
7. 다른 글로 이동했다가 돌아와도 1~6이 그대로 동작한다 (리스너 누수 없음).

- [ ] **Step 7: 커밋**

```bash
git add src/components/toc "src/pages/posts/[...slug]/index.astro"
git commit -m "feat(toc): 인라인 목차와 부유 목차 추가

- 본문 상단 접이식 목차, 스크롤 시 우측에 부유 목차 등장
- IntersectionObserver 2개(센티널 + 스크롤 스파이), 외부 라이브러리 없음
- 1280px 미만에서는 부유 목차를 렌더하지 않아 본문을 가리지 않는다"
```

---

### Task 10: 홈 (포트폴리오 랜딩)

**Files:**
- Modify: `src/pages/index.astro` (hero + 카드 섹션 교체)
- Modify: `astro-paper.config.ts` (사이트 제목·작성자·소개)

**Interfaces:**
- Consumes: `getSeriesByCategory` (Task 3), `getSeriesPosts` (Task 5), `t.home.*` (Task 2)
- Produces: 없음

- [ ] **Step 1: 사이트 정보 채우기**

`astro-paper.config.ts`의 `site` 블록에서 아래 항목을 실제 값으로 바꾼다. 이 값들은 사이트 제목·메타태그·RSS에 쓰인다.

```ts
    title: "<블로그 제목>",
    description: "<한 줄 소개 — 사이드바와 메타 설명에 쓰임>",
    author: "<이름>",
    profile: "<개인 사이트나 GitHub 프로필 URL>",
```

`socials` 배열의 URL도 실제 계정으로 바꾼다.

- [ ] **Step 2: `src/pages/index.astro`의 hero 섹션 교체**

36행부터 시작하는 `<section id="hero">`를 아래로 바꾼다. 기존 `Socials` import는 그대로 쓴다.

```astro
    <section id="hero" class="border-border border-b pt-8 pb-10">
      <h1 class="text-3xl font-bold sm:text-4xl">
        {config.site.author}
      </h1>
      <p class="text-muted-foreground mt-3 max-w-xl leading-relaxed">
        {config.site.description}
      </p>
      <div class="mt-5">
        <Socials />
      </div>
    </section>
```

- [ ] **Step 3: 대표 시리즈 섹션 추가**

hero 아래, 기존 `featured` 섹션 위에 삽입한다.

이 파일에는 `locale`, `t`, `sortedPosts`, `getRelativeLocaleUrl`이 이미 정의·import되어 있다 (17–23행). 따라서 frontmatter에 아래 세 줄의 import와 한 개의 변수만 추가하면 된다.

```ts
import { getSeriesByCategory } from "@/series";
import { getSeriesPosts } from "@/utils/getSeriesPosts";
import { tplStr } from "@/i18n";
```

`const homePath = ...` 아래에 추가:

```ts
// sortedPosts는 이미 draft/예약 글이 걸러진 상태다.
const projectSeries = getSeriesByCategory("project").map(s => ({
  ...s,
  count: getSeriesPosts(sortedPosts, s.id).length,
}));
```

마크업:

```astro
    {
      projectSeries.length > 0 && (
        <section class="border-border border-b pt-10 pb-8">
          <h2 class="text-2xl font-semibold tracking-wide">
            {t.series.title}
          </h2>
          <ul class="mt-4 grid gap-4 sm:grid-cols-2">
            {projectSeries.map(s => (
              <li class="border-border rounded-lg border p-4">
                <a
                  href={getRelativeLocaleUrl(locale, `series/${s.id}`)}
                  class="text-accent font-semibold underline-offset-4 hover:underline"
                >
                  {s.label}
                </a>
                <p class="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                  {s.description}
                </p>
                <p class="text-muted-foreground mt-3 text-sm">
                  {tplStr(t.category.seriesCount, { count: s.count })}
                  {" · "}
                  {s.status === "ongoing" ? t.series.ongoing : t.series.completed}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )
    }
```

- [ ] **Step 4: 빌드 검증**

```bash
pnpm build
```

Expected: 성공

- [ ] **Step 5: 육안 확인**

```bash
pnpm preview
```

확인할 것: 홈 첫 화면이 이름 + 소개 + 소셜로 시작하고, 그 아래 시리즈 카드, 그 아래 추천/최근 글 순서로 이어진다.

- [ ] **Step 6: 커밋**

```bash
git add src/pages/index.astro astro-paper.config.ts
git commit -m "feat(home): 포트폴리오 랜딩으로 홈 재구성

- 소개 → 대표 시리즈 → 최근 글 순서
- 사이트 제목·작성자·소개·소셜 링크 설정"
```

---

### Task 11: 완료 기준 검증

**Files:**
- Create: `tests/routes.test.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: `CATEGORY_IDS`, `getSubcategoryIds` (Task 3), `SERIES_IDS` (Task 3), `dist/` 빌드 산출물
- Produces: 없음

- [ ] **Step 1: 라우트 검사 테스트 작성**

이전 시도에서 카테고리 링크가 전부 404였던 실패를 재발 방지한다. 기대 경로를 하드코딩하지 않고 단일 소스에서 파생시키는 것이 핵심이다.

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CATEGORY_IDS, getSubcategoryIds } from "@/categories";
import { SERIES_IDS } from "@/series";

const DIST = "dist";

beforeAll(() => {
  if (!existsSync(DIST)) {
    throw new Error("dist/가 없습니다. 먼저 `pnpm build`를 실행하세요.");
  }
});

const page = (...segments: string[]) =>
  join(DIST, ...segments, "index.html");

describe("카테고리 라우트", () => {
  it("모든 대분류 페이지가 생성된다", () => {
    for (const id of CATEGORY_IDS) {
      expect(existsSync(page("categories", id)), id).toBe(true);
    }
  });

  it("모든 소분류 페이지가 생성된다", () => {
    for (const id of CATEGORY_IDS) {
      for (const sub of getSubcategoryIds(id)) {
        expect(existsSync(page("categories", id, sub)), `${id}/${sub}`).toBe(
          true
        );
      }
    }
  });

  it("카테고리 목록 페이지가 생성된다", () => {
    expect(existsSync(page("categories"))).toBe(true);
  });
});

describe("시리즈 라우트", () => {
  it("모든 시리즈 페이지가 생성된다", () => {
    for (const id of SERIES_IDS) {
      expect(existsSync(page("series", id)), id).toBe(true);
    }
  });

  it("시리즈 목록 페이지가 생성된다", () => {
    expect(existsSync(page("series"))).toBe(true);
  });
});

describe("껍데기", () => {
  const home = () => readFileSync(page(), "utf-8");

  it("사이드바가 렌더된다", () => {
    expect(home()).toContain('id="site-sidebar"');
  });

  it("테마 버튼이 정확히 하나다", () => {
    expect(home().match(/id="theme-btn"/g)?.length).toBe(1);
  });

  it("showArchives가 켜져 있으면 아카이브 링크가 있다", () => {
    expect(home()).toMatch(/href="[^"]*archives[^"]*"/);
  });
});

describe("내부 링크", () => {
  it("카테고리·시리즈 링크가 모두 실제 페이지를 가리킨다", () => {
    const html = readFileSync(page(), "utf-8");
    const hrefs = [
      ...html.matchAll(/href="(\/(?:categories|series)\/[^"]*)"/g),
    ].map(m => m[1]);

    for (const href of hrefs) {
      const path = href.replace(/^\/|\/$/g, "");
      expect(existsSync(join(DIST, path, "index.html")), href).toBe(true);
    }
  });
});
```

- [ ] **Step 2: `package.json`에 스크립트 추가**

```json
    "test:routes": "vitest run tests/routes.test.ts",
    "verify": "pnpm build && pnpm test"
```

- [ ] **Step 3: 전체 검증 실행**

```bash
pnpm verify
```

Expected: 빌드 성공 + 모든 테스트 PASS

- [ ] **Step 4: 스펙 완료 기준 수동 점검**

스펙 11절의 10개 항목을 순서대로 확인하고 결과를 기록한다.

| # | 기준 | 확인 방법 |
|---|---|---|
| 1 | 빌드 통과 | `pnpm verify` |
| 2 | 잘못된 소분류 → 빌드 실패 | Task 4 Step 5 재현 |
| 3 | 중복 seriesOrder → 빌드 실패 | Task 8 Step 8 재현 |
| 4 | 현재 대분류가 펼쳐진 채 첫 렌더 | `curl -s .../categories/deep-dive/ \| grep '<details open'` |
| 5 | JS 없이 아코디언 동작 | 브라우저 개발자도구에서 JS 비활성화 후 클릭 |
| 6 | 1280px↑ 목차가 본문 안 가림 / 1280px↓ 미렌더 | 브라우저 폭 조절 |
| 7 | 5회 이동 후 리스너 중복 없음 | 개발자도구 → 요소 선택 → Event Listeners 탭에서 개수 확인 |
| 8 | showArchives 존중 | `pnpm test:routes` |
| 9 | 404 링크 없음 | `pnpm test:routes` |
| 10 | 대비 AA 만족 | 개발자도구 Lighthouse 접근성 감사, 라이트·다크 각각 |

- [ ] **Step 5: 발견된 문제 수정**

위 점검에서 실패한 항목이 있으면 해당 태스크로 돌아가 고치고 `pnpm verify`를 다시 돌린다. 전부 통과할 때까지 커밋하지 않는다.

- [ ] **Step 6: 커밋**

```bash
git add tests/routes.test.ts package.json
git commit -m "test: 빌드 산출물 라우트 검사 추가

- 카테고리·시리즈 경로를 단일 소스에서 파생시켜 검증
- 껍데기 렌더와 내부 링크 유효성 확인
- pnpm verify로 빌드+테스트 일괄 실행"
```

---

## 남은 정리 작업 (선택)

구현 완료 후 판단할 항목:

- `codex/layout-shell` 브랜치와 `.worktrees/layout-shell` 워크트리 삭제 (Task 6에서 스크립트 패턴을 참조한 뒤에는 불필요)
- `src/content/posts/_ko/` 안의 데모 글 18개 삭제 — 실제 글쓰기를 시작할 때 정리
- `docs/css.css`, `docs/html.html` 로컬 참조 파일 삭제 여부
