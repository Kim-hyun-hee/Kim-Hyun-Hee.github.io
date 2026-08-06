# 블로그 리디자인 설계 — 포트폴리오 겸 개발 블로그

작성일: 2026-08-06
대상 저장소: `astro-paper` (AstroPaper v6.1, Astro v7)

## 1. 배경

현재 저장소는 AstroPaper 테마의 stock 상태다. 설정(`astro-paper.config.ts`)의 제목·작성자가 테마 기본값이고, 글도 전부 테마 데모 글이다. 실 콘텐츠 제약이 없는 시점이라 정보 구조부터 새로 설계할 수 있다.

이전에 `codex/layout-shell` 브랜치에서 사이드바 레이아웃을 시도했으나 폐기한다. 폐기 사유는 결과물의 품질이 아니라 **유지보수 구조**다: `Header.astro`(195줄)를 통째로 재작성해 업스트림 업데이트 시 병합 충돌이 확정적이었고, `features.showArchives` 기능이 조용히 죽었으며, 카테고리 링크 5개가 전부 존재하지 않는 태그를 가리켜 404였다. 이 설계는 그 세 가지를 구조적으로 방지하는 것을 목표에 포함한다.

## 2. 목표

1. 좌측 고정 사이드바 기반의 정보 구조를 도입한다.
2. 포트폴리오와 개발 블로그를 한 사이트에서 겸한다.
3. 색·폰트를 기존에 쓰던 블로그 기준으로 맞춰 이질감을 줄인다.
4. **업스트림 AstroPaper 업데이트를 계속 받을 수 있는 구조를 유지한다.**

4번이 나머지 셋과 동등한 무게를 갖는다. 설계 판단이 갈릴 때 이 기준을 우선한다.

## 3. 정보 구조

### 3.1 카테고리

대분류 5개, 소분류는 일부 대분류만 갖는다.

| 대분류 | 소분류 | 비고 |
|---|---|---|
| Deep Dive | Rendering, Architecture, Memory | |
| Project | 없음 | 시리즈가 소분류 자리를 대신한다 |
| Troubleshooting | 없음 | 태그로만 분류 |
| Study | CS 기초, Language, Tools & Framework | |
| Etc | 없음 | 잡담·회고·커리어 |

### 3.2 시리즈

**시리즈와 소분류는 다른 축이다.** 소분류는 "무엇에 관한 글인가"(집합, 순서 없음, 최신순 정렬)에 답하고, 시리즈는 "어떤 순서로 읽는가"(순서 있음, 완결 개념 있음, 편 순서 정렬)에 답한다.

연재물을 소분류로 두면 최신순 정렬 때문에 1편이 목록 맨 아래로 밀린다. 포트폴리오 용도에서 이는 치명적이다 — 프로젝트 글은 처음부터 순서대로 읽히는 흐름이 되어야 한다.

**적용 범위: 프로젝트 1개 = 시리즈 1개.** Project 대분류에만 시리즈를 쓰고 다른 대분류는 소분류만 쓴다. 이렇게 하면 개념이 겹치지 않는다.

초기 시리즈: `dod-digitaltwin-unity` (DOD-DigitalTwin-Unity)

### 3.3 태그

카테고리와 별개로 유지한다. 카테고리는 `category`/`subcategory` 필드가, 태그는 기존 `tags` 배열이 담당한다. 결과적으로 `/tags/`에는 실제 기술 태그(`BRG`, `SRP Batcher`, `Addressable`)만 남아 지금보다 깨끗해진다.

## 4. 콘텐츠 모델

### 4.1 `src/categories.ts` (신규)

카테고리의 단일 소스. 사이드바·라우팅·스키마 검증이 모두 여기서 파생된다. 카테고리를 추가하거나 이름을 바꿀 때 이 파일만 고친다.

```ts
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
export const CATEGORY_IDS = Object.keys(CATEGORIES) as [CategoryId, ...CategoryId[]];
```

`subcategories: null`은 "소분류를 갖지 않는 대분류"를 뜻한다. 빈 객체(`{}`)와 구분되며, 검증 로직이 이 값으로 분기한다.

### 4.2 `src/series.ts` (신규)

```ts
export const SERIES = {
  "dod-digitaltwin-unity": {
    label: "DOD로 만드는 디지털트윈",
    description: "Unity에서 데이터 지향 설계로 설비 6,400개를 그리기까지",
    category: "project",
    status: "ongoing",
  },
} as const;

export type SeriesId = keyof typeof SERIES;
export const SERIES_IDS = Object.keys(SERIES) as [SeriesId, ...SeriesId[]];
```

`status`는 `"ongoing" | "completed"`. 시리즈 제목을 글마다 반복 기입하지 않아도 되고, 오타로 시리즈가 둘로 쪼개지는 사고를 막는다.

### 4.3 스키마 확장 — `src/content.config.ts` (수정)

기존 `posts` 컬렉션 스키마에 필드 4개를 추가한다.

```ts
category: z.enum(CATEGORY_IDS),
subcategory: z.string().optional(),
series: z.enum(SERIES_IDS).optional(),
seriesOrder: z.number().int().positive().optional(),
```

여기에 `.superRefine()`으로 교차 검증을 붙인다. 이것이 이 모델의 핵심 값어치다.

| 규칙 | 위반 시 |
|---|---|
| 소분류를 가진 대분류에는 `subcategory` 필수 | 빌드 실패 |
| `subcategory`는 해당 대분류에 속한 값이어야 함 | 빌드 실패 (가능한 값 목록 출력) |
| 소분류가 없는 대분류에 `subcategory` 지정 금지 | 빌드 실패 |
| `series`와 `seriesOrder`는 항상 함께 | 빌드 실패 |

오타 예시:

```
[content] posts → deep-dive/brg-draw-call.md
  subcategory: "rendring"는 "deep-dive"의 소분류가 아닙니다.
              가능: rendering, architecture, memory
```

**조용히 404가 되는 경로가 생기지 않는다.** 이전 브랜치가 무너진 지점을 이 검증이 막는다.

### 4.4 검증의 한계와 보완

`superRefine`은 글 하나씩만 검사하므로 **같은 시리즈에 `seriesOrder: 3`이 두 개 있는 상황은 잡지 못한다.** 이는 `/series/[slug]` 페이지의 `getStaticPaths`에서 중복을 발견하면 예외를 던져 빌드를 세우는 방식으로 보완한다.

`seriesOrder`를 날짜순 자동 정렬이 아닌 수동 번호로 두는 이유는 나중에 글 사이에 끼워 넣을 수 있어야 하기 때문이다.

### 4.5 frontmatter 예시

```yaml
# Deep Dive — 소분류 필수
category: deep-dive
subcategory: rendering
tags: [BRG, SRP Batcher]

# Project 연재 — 소분류 없음, 시리즈 필수
category: project
series: dod-digitaltwin-unity
seriesOrder: 3
tags: [Unity, DOTS]

# Troubleshooting — 둘 다 없음
category: troubleshooting
tags: [Addressable, iOS]
```

## 5. 라우팅

| 경로 | 내용 |
|---|---|
| `/` | 포트폴리오 랜딩 |
| `/categories` | 대분류 5개 개요 |
| `/categories/{category}` | 대분류 페이지 — 아래 세 가지로 분기 |
| `/categories/{category}/{subcategory}` | 소분류 글 목록, 페이지네이션 |
| `/series` | 시리즈 목록 |
| `/series/{slug}` | 시리즈 글 목록, **편 순서 정렬** |
| `/posts/{slug}`, `/posts/{page}` | 기존 유지 |
| `/tags`, `/tags/{tag}` | 기존 유지 |
| `/archives`, `/search`, `/about` | 기존 유지 |

대분류 페이지(`/categories/{category}`)는 대분류의 성격에 따라 세 가지로 분기한다.

| 대분류 | 표시 내용 |
|---|---|
| Deep Dive, Study | 소분류별로 묶어 각 소분류의 최근 글 몇 개 + "더 보기" 링크 |
| Project | **시리즈 카드 목록** (글 목록이 아님). 각 카드는 시리즈 제목·편 수·진행 상태를 보여주고 `/series/{slug}`로 이동한다 |
| Troubleshooting, Etc | 글 목록을 최신순으로 바로 나열, 페이지네이션 |

`/categories/` 접두어를 두는 이유는 `/deep-dive` 같은 최상위 경로가 향후 예약어(`/about` 등)와 충돌할 위험을 없애기 위함이다.

## 6. 레이아웃

### 6.1 전체 골격

데스크톱(≥1024px)은 좌측 고정 사이드바 + 본문. 상단바는 없다. 모바일은 상단바(햄버거) + 본문이고 사이드바는 오버레이로 열린다.

사이드바가 프로필·카테고리 트리·검색·테마 토글·소셜/RSS를 모두 갖는다. 데스크톱에서 상단바가 없으므로 세로 공간을 뺏기지 않고, "글을 다 읽은 뒤 내비게이션에 닿으려면 맨 위로 올라가야 하는" 문제가 구조적으로 사라진다.

### 6.2 사이드바 아코디언

대분류 5개가 기본 노출되고, 클릭하면 소분류가 펼쳐진다. **현재 보고 있는 글이 속한 대분류는 서버 렌더 시점에 펼쳐진 상태로 출력한다.**

`<details>` / `<summary>` 요소로 구현한다. 토글이 브라우저 기본 동작이므로 JavaScript가 필요 없고, 키보드 접근성이 따라온다. 현재 대분류에만 `open` 속성을 서버에서 부여하므로 첫 페인트부터 올바른 상태이며 깜빡임이 없다.

소분류가 없는 Troubleshooting·Etc는 `<details>`가 아닌 일반 링크로 렌더한다 (펼침 화살표가 뜨지 않는다).

JavaScript는 **모바일 사이드바 열고 닫기 하나**에만 쓴다.

### 6.3 목차

다음 3단계로 동작한다.

1. 본문 상단에 인라인 목차 블록(`<details open>`)
2. 스크롤이 인라인 목차를 지나치면 우측 여백에 목차가 페이드인
3. 스크롤 스파이로 현재 절 하이라이트
4. 위로 되돌아오면 우측 목차는 사라진다

우측 목차는 레이아웃 흐름에 참여하지 않고 **본문 바깥 여백에 위치한다.** 본문을 밀어내지도, 가리지도 않는다. 본문 폭(`max-w-3xl`, 768px)은 그대로 유지되며 코드블록이 좁아지지 않는다.

폭 예산: `240(사이드바) + 768(본문) + 32(간격) + 224(목차) = 1264px`. Tailwind `xl`(1280px)에서 16px 여유가 있다. **1280px 미만에서는 우측 목차를 렌더하지 않고 인라인 목차만 남긴다.** 이 규칙이 "가리지 않음"을 보장한다.

구현: Astro `render()`가 반환하는 `headings` 배열 하나를 `InlineToc`와 `FloatingToc`가 공유한다. 스크립트는 `IntersectionObserver` 두 개 — 인라인 목차 통과를 감시하는 센티널, 헤딩 스크롤 스파이. 외부 라이브러리를 쓰지 않는다.

### 6.4 시리즈 UI

상단 메뉴에 "시리즈" 항목을 넣지 않는다. 순증 UI는 두 가지뿐이다.

1. 시리즈 소속 글에만 뜨는 본문 상단 박스 — 시리즈 제목, `3/8편`, 접힌 전체 목록
2. `/series/{slug}` 페이지

추가로 글 하단에 이전 편/다음 편 내비게이션을 둔다. 시리즈가 없는 글에는 아무것도 렌더하지 않으므로 Troubleshooting·Etc에서는 존재감이 0이다.

### 6.5 홈 (포트폴리오 랜딩)

위에서부터: 소개(직무 한 줄 + 2~3문장) → 대표 프로젝트/시리즈 카드 → 최근 글 목록.

### 6.6 스크립트 생명주기

Astro의 뷰 트랜지션에서 이벤트 리스너가 누적되지 않도록, 모든 클라이언트 스크립트는 `AbortController`로 리스너를 등록하고 `astro:before-swap`에서 `abort()`, `astro:after-swap`에서 재초기화한다.

이 패턴은 폐기하는 `codex/layout-shell` 브랜치의 `Header.astro` 스크립트에서 가져온다. AstroPaper 원본(`toggleNav()`)은 `astro:after-swap`마다 리스너를 다시 등록하기만 하므로 페이지를 이동할수록 리스너가 쌓인다.

## 7. 디자인 토큰

### 7.1 색

차분한 무채색을 기조로 하고, 라이트 테마의 배경 계열만 아주 미세하게 차갑게(파랑 쪽으로) 기울인다.

**라이트**

| 토큰 | 값 | 역할 |
|---|---|---|
| `--background` | `#fdfdfe` | 배경 |
| `--foreground` | `#1e1f21` | 본문 |
| `--accent` | `#353638` | 강조·링크 |
| `--accent-foreground` | `#ffffff` | 강조 위 텍스트 |
| `--muted` | `#f1f3f7` | 표면·코드블록 |
| `--muted-foreground` | `#66666e` | 보조 텍스트 |
| `--border` | `#e2e5ec` | 테두리 |

**다크**

| 토큰 | 값 | 역할 |
|---|---|---|
| `--background` | `#1e1f21` | 배경 |
| `--foreground` | `#f4f4f6` | 본문 |
| `--accent` | `#5db0d7` | 강조·링크 |
| `--accent-foreground` | `#1e1f21` | 강조 위 텍스트 |
| `--muted` | `#292a2d` | 표면·코드블록 |
| `--muted-foreground` | `#9999a1` | 보조 텍스트 |
| `--border` | `#353638` | 테두리 |

라이트의 강조색은 먹색, 다크는 파랑이라는 비대칭이 있다. 의도한 결과이며 유지한다.

**링크 표시: 밑줄만.** 굵게 처리하지 않고 색도 강조색 그대로 쓴다. 라이트에서 링크(`#353638`)와 본문(`#1e1f21`)은 색으로 거의 구분되지 않으므로 밑줄이 유일한 단서다. 조용한 인상을 위해 의도한 선택이다.

적용 위치는 `src/styles/theme.css` 하나다. 이 파일은 전체가 토큰 정의라 값 교체가 자연스럽고 업스트림과 충돌하더라도 해결이 자명하다.

### 7.2 폰트

기존에 쓰던 블로그는 본문에 **SUIT**(OFL 라이선스 한글 산세리프)를 쓰고 있었고, 코드블록은 웹폰트가 아닌 시스템 monospace(`Consolas` / `SF Mono`)로 렌더되어 보는 사람의 OS마다 다르게 보였다.

결정:

| 용도 | 폰트 | 토큰 |
|---|---|---|
| 본문·UI | SUIT | `--font-app` |
| 코드 | JetBrains Mono | `--font-mono` |

본문은 쓰던 폰트를 유지하고, 코드는 OS 의존성을 없애면서 `l`/`1`/`I`, `O`/`0` 구분이 확실한 쪽을 택한다. 현재 `--font-app`에 물려 있는 Google Sans Code는 한글 글리프가 없어 한국어 본문에서 자간이 깨지므로 교체가 필수다.

두 폰트 모두 Astro Fonts API의 `local` provider로 self-host한다. 외부 요청이 발생하지 않는다.

### 7.3 폭

| 토큰 | 값 |
|---|---|
| `--sidebar-width` | `240px` |
| `--toc-width` | `224px` |
| 본문 최대 폭 | `max-w-3xl` (768px, 기존 `max-w-app` 유지) |

사이드바 폭은 CSS 변수 하나로 단일화한다. 이전 브랜치는 `Layout.astro`의 `lg:ps-64`와 `Header.astro`의 `w-64`가 별개 매직넘버로 존재해 한쪽만 고치면 어긋나는 구조였다.

## 8. 파일 구조와 업스트림 전략

원칙: **기존 파일은 조립 지점만 건드리고, 내용은 전부 신규 파일에 둔다.**

### 8.1 `Header.astro` 처리

`index.astro` 등 여러 페이지가 `<Header />`를 import하고 있다. 이 import를 유지하기 위해 `Header.astro`를 조립부로 축소한다.

```astro
---
import Sidebar from "./layout/Sidebar.astro";
import TopBar from "./layout/TopBar.astro";
---
<Sidebar />
<TopBar />
```

페이지 파일을 하나도 수정하지 않아도 되고, `Header.astro`의 diff가 195줄에서 6줄로 줄어든다. 업스트림이 Header를 변경해 충돌이 발생해도 우리 쪽 내용이 6줄이라 판단이 즉시 가능하다.

원본 Header가 담당하던 기능(skip-to-content, 내비게이션, 테마 토글, 검색, 아카이브 링크)은 전부 `Sidebar`/`TopBar` 신규 파일로 옮긴다. **`features.showArchives` 플래그를 존중하는 아카이브 링크를 반드시 포함한다** — 이전 브랜치에서 누락되어 기능이 죽었던 항목이다.

### 8.2 파일 목록

**신규**

```
src/categories.ts
src/series.ts
src/i18n/lang/ko.ts
src/components/layout/Sidebar.astro
src/components/layout/SidebarNav.astro
src/components/layout/TopBar.astro
src/components/toc/InlineToc.astro
src/components/toc/FloatingToc.astro
src/components/series/SeriesBox.astro
src/components/series/SeriesNav.astro
src/utils/getPostsByCategory.ts
src/utils/getSeriesPosts.ts
src/pages/categories/index.astro
src/pages/categories/[category]/index.astro
src/pages/categories/[category]/[subcategory]/[...page].astro
src/pages/series/index.astro
src/pages/series/[slug].astro
public/fonts/  (SUIT, JetBrains Mono)
```

**수정 (최소 라인)**

| 파일 | 변경 |
|---|---|
| `src/content.config.ts` | 필드 4개 + `superRefine` |
| `src/components/Header.astro` | 6줄 조립부로 축소 |
| `src/styles/theme.css` | 색 토큰 값 교체, 폰트·폭 토큰 추가 |
| `src/styles/global.css` | 폭 변수 참조 |
| `src/layouts/Layout.astro` | body에 사이드바 오프셋 |
| `astro.config.ts` | Fonts API에 SUIT / JetBrains Mono 등록 |
| `astro-paper.config.ts` | `lang: "ko"`, `timezone: "Asia/Seoul"`, 사이트 제목·작성자·소개 |
| `src/content/posts/` | 글을 `_ko/` 하위로 이동 (9.1 참고, URL 불변) |

**무손상**

`Card`, `Footer`, `Pagination`, `Tag`, `Datetime`, `Breadcrumb`, `Main`, `LinkButton`, `Socials`, `ResponsiveTable`, `posts/[...slug]/**`, `tags/**`, `archives/**`, `search.astro`

## 9. 언어

**한국어 단일로 시작한다.** `site.lang`을 `"ko"`로 바꾸고 UI 문자열 파일 `src/i18n/lang/ko.ts`를 추가한다.

영어 추가와 관련해 세 가지를 구분한다.

| 항목 | 지금 필요한 작업 |
|---|---|
| UI 문구 다국어 | 없음. `src/i18n/lang/`가 이미 처리하며 `en.ts`는 이미 존재한다 |
| URL 로케일 접두어 (`/en/posts/…`) | 없음. `getRelativeLocaleUrl`이 코드 전반에 이미 쓰이므로 나중에 config에 locale을 추가하면 된다 |
| 글 파일의 언어별 분리 | **폴더 구조를 지금 정해야 한다 (아래)** |

### 9.1 콘텐츠 폴더 — `_ko/`를 지금 쓴다

`src/utils/getPostPaths.ts`의 `getPostPathSegments()`는 하위 디렉토리를 글 URL에 포함시킨다. `adding-new-post.mdx`에도 문서화된 동작이며, **밑줄로 시작하는 폴더만 URL에서 제외된다.**

따라서 글을 `src/content/posts/`에 평평하게 두었다가 나중에 `posts/ko/`로 옮기면 모든 글 주소가 `/posts/{slug}` → `/posts/ko/{slug}`로 바뀌어 기존 링크와 검색 색인이 깨진다.

**결정: 처음부터 `src/content/posts/_ko/`에 글을 둔다.** 밑줄 접두어 덕분에 URL은 `/posts/{slug}`로 유지되고, 나중에 `_en/`을 추가해도 한국어 URL은 변하지 않는다. 지금 드는 비용은 폴더 이름 하나뿐이다.

영어를 실제로 붙일 때 추가로 필요한 작업(이번 범위 밖): 로케일별 컬렉션 필터링, `/en/**` 라우트, `categories.ts`/`series.ts`의 `label`을 다국어 객체로 전환.

## 10. 범위 밖

- **영어 콘텐츠 추가** — 9.1의 폴더 구조만 지금 잡고, 실제 다국어 라우팅·번역은 하지 않는다
- **발행 잔디 (포스팅 활동 히트맵)** — 잔디 형태의 글 작성 빈도 시각화는 이번에 만들지 않는다
- 자동 번역 파이프라인
- 댓글(giscus) 설정 변경
- 검색 엔진 교체 (pagefind 유지)
- 기존 데모 글의 카테고리 분류 — 데모 글은 삭제하거나 `etc`로 보내며, 실제 글 작성은 이 작업 범위 밖이다
- 프로젝트 쇼케이스 전용 컬렉션 (`projects`) — 프로젝트 = 연재 글 묶음으로 충분하므로 도입하지 않는다

## 11. 완료 기준

1. `pnpm build`가 통과한다 (`astro check` 0 errors 포함).
2. 잘못된 `subcategory`를 가진 글을 추가하면 빌드가 실패하고, 오류 메시지에 가능한 값 목록이 출력된다.
3. 같은 시리즈에 중복 `seriesOrder`가 있으면 빌드가 실패한다.
4. 사이드바에서 현재 글이 속한 대분류가 펼쳐진 상태로 첫 렌더된다 (JavaScript 비활성 상태에서도).
5. JavaScript를 끈 상태에서 사이드바 아코디언 토글이 동작한다.
6. 1280px 이상에서 우측 목차가 본문을 가리지 않고, 1280px 미만에서는 렌더되지 않는다.
7. 페이지를 5회 이동한 뒤에도 스크롤/리사이즈 리스너가 중복 등록되지 않는다.
8. `features.showArchives`가 `true`일 때 사이드바에 아카이브 링크가 존재한다.
9. 생성된 모든 카테고리·시리즈 링크가 실제 페이지를 가리킨다 (404 없음).
10. 라이트·다크 양쪽에서 본문·링크·보조 텍스트가 WCAG AA(4.5:1)를 만족한다.
