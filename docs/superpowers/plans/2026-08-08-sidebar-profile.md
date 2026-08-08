# 사이드바 상단 프로필 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사이드바 상단에 프로필 사진을 넣고, 설명 자리를 직함으로 바꾼다.

**Architecture:** 직함 문자열을 `config.site.role`로 올려 사이드바와 글 헤더가 같은 값을 읽게 한다. 프로필 마크업은 두 화면이 각자 갖는다 — 방향·크기·링크가 달라 공통 컴포넌트로 묶으면 분기만 늘어난다.

**Tech Stack:** Astro 7, Tailwind CSS v4, `astro:assets`

## Global Constraints

- 패키지 매니저는 `corepack pnpm`. `pnpm`은 PATH에 없다. `npm`은 금지
- `corepack pnpm format`을 저장소 전체에 돌리지 않는다. 건드린 파일만 `corepack pnpm exec prettier --write <경로>`
- 포인트 색은 표시(선·테두리·밑줄)에만. 링크는 글씨 `--link` + 밑줄만 포인트 색
- 커밋 메시지와 코드 주석에 원본 스킨 이름·제작자명·플랫폼명을 쓰지 않는다
- 주석은 주변 코드처럼 최소로
- 검증 기준: `corepack pnpm build` 0 errors / `corepack pnpm test` 전부 통과 / `corepack pnpm lint` clean

---

### Task 1: 직함을 설정으로 올린다

**Files:**
- Modify: `src/types/config.ts` — `SiteConfig`(1-22행 부근), `ResolvedSiteConfig`(105-118행 부근)
- Modify: `astro-paper.config.ts` — `site` 블록
- Modify: `src/pages/posts/[...slug]/_components/PostHeader.astro` — 하드코딩된 직함

**Interfaces:**
- Produces: `config.site.role?: string`. Task 2의 `Sidebar.astro`가 읽는다

**주의:** `ResolvedSiteConfig`가 필드를 명시적으로 `Pick`한다. `SiteConfig`에만
추가하면 `config.site.role`이 타입에 잡히지 않는다. 두 군데 모두 고쳐야 한다.
`src/config.ts`는 `...userConfig.site` 스프레드라 손댈 필요가 없다.

- [ ] **Step 1: `SiteConfig`에 필드 추가**

`src/types/config.ts`의 `SiteConfig` 안, `author` 바로 아래에 넣는다:

```ts
  /** Default post author name */
  author: string;
  /** Author's role or job title, e.g. "Software Engineer" */
  role?: string;
  /** Author profile URL (used in structured data) */
  profile?: string;
```

- [ ] **Step 2: `ResolvedSiteConfig`의 Pick에 추가**

같은 파일의 `ResolvedSiteConfig`에서 마지막 `Pick`을 바꾼다:

```ts
> &
  Pick<SiteConfig, "role" | "profile" | "googleVerification">;
```

- [ ] **Step 3: 설정에 값 넣기**

`astro-paper.config.ts`의 `site` 블록에서 `author` 아래에 넣는다:

```ts
    role: "Software Engineer",
```

- [ ] **Step 4: PostHeader가 설정을 읽게 한다**

`src/pages/posts/[...slug]/_components/PostHeader.astro`의 프로필 블록에서
하드코딩을 바꾼다.

바꾸기 전:
```astro
      <p class="text-muted-foreground">Software Engineer</p>
```
바꾼 뒤:
```astro
      <p class="text-muted-foreground">{config.site.role}</p>
```

`config`는 이 파일에서 이미 import되어 있다.

- [ ] **Step 5: 빌드와 렌더 확인**

Run: `corepack pnpm build`
Expected: 0 errors

Run: `corepack pnpm astro dev stop; corepack pnpm dev`
그다음:
```bash
curl -s http://localhost:4321/posts/building-this-blog/07-post-footer/ | grep -c "Software Engineer"
```
Expected: `1` — 설정에서 읽어도 글 헤더에 그대로 나온다

- [ ] **Step 6: 커밋**

```bash
corepack pnpm exec prettier --write src/types/config.ts astro-paper.config.ts "src/pages/posts/[...slug]/_components/PostHeader.astro"
git add src/types/config.ts astro-paper.config.ts "src/pages/posts/[...slug]/_components/PostHeader.astro"
git commit -m "refactor(config): 직함 문자열을 site.role로 올린다"
```

---

### Task 2: 사이드바 상단에 프로필

**Files:**
- Modify: `src/components/layout/Sidebar.astro` — import 블록(1-14행), 상단 마크업(62-70행 부근)

**Interfaces:**
- Consumes: Task 1의 `config.site.role`. 이 파일은 17행에서 이미 `const { site, features } = config;`로 꺼내 쓰므로 `site.role`로 접근한다

- [ ] **Step 1: import 두 줄 추가**

`src/components/layout/Sidebar.astro` 맨 위 import 블록에 넣는다:

```ts
import { Image } from "astro:assets";
import profileImage from "@/assets/images/profile.png";
```

- [ ] **Step 2: 상단 마크업 교체**

62-70행의 블로그명 링크와 설명 문단을 찾는다.

바꾸기 전:
```astro
  <a
    href={getRelativeLocaleUrl(locale, "")}
    class="decoration-accent text-lg font-bold underline-offset-4 hover:underline"
  >
    {site.title}
  </a>
  <p class="text-muted-foreground mt-1.5 text-sm leading-relaxed">
    {site.description}
  </p>
```

바꾼 뒤:
```astro
  <Image
    src={profileImage}
    alt=""
    width={128}
    height={128}
    class="size-16 rounded-full"
  />
  <a
    href={getRelativeLocaleUrl(locale, "")}
    class="decoration-accent mt-3 text-lg font-bold underline-offset-4 hover:underline"
  >
    {site.title}
  </a>
  {
    site.role && (
      <p class="text-muted-foreground mt-1.5 text-sm leading-relaxed">
        {site.role}
      </p>
    )
  }
```

세 가지를 그대로 지킨다.

- 사진을 `<a>`로 감싸지 않는다. 바로 아래 이름이 이미 홈 링크라 감싸면 같은
  곳으로 가는 링크가 연달아 둘이 된다
- `alt=""` — 이름이 바로 아래 텍스트로 있어 대체 텍스트는 같은 정보를 두 번
  읽게 만든다
- `width`/`height`는 128인데 표시 크기는 `size-16`(64px)이다. 2배 해상도를
  넘겨 고밀도 화면에서 흐려지지 않게 한다

`<aside>`가 `flex flex-col`이므로 자식은 세로로 쌓이고 좌측 정렬이 유지된다.
정렬 클래스를 따로 붙이지 않는다.

- [ ] **Step 3: 빌드·테스트·린트**

Run: `corepack pnpm build`
Expected: 0 errors

Run: `corepack pnpm test`
Expected: 전부 통과

Run: `corepack pnpm lint`
Expected: 출력 없음

- [ ] **Step 4: 커밋**

```bash
corepack pnpm exec prettier --write src/components/layout/Sidebar.astro
git add src/components/layout/Sidebar.astro
git commit -m "feat(sidebar): 상단에 프로필 사진을 넣고 설명을 직함으로 바꾼다"
```

---

### Task 3: 실물 검증

**Files:** 없음 (확인만 한다. 문제가 나오면 해당 Task로 돌아간다)

- [ ] **Step 1: dev 서버 재시작**

```bash
corepack pnpm astro dev stop; corepack pnpm dev
```

PowerShell에서는 `&&`가 아니라 `;`다.

- [ ] **Step 2: 사이드바 상단 확인**

브라우저에서 http://localhost:4321 을 연다.

- 64px 원형 사진이 나오는지
- 사진 → `Dev groot` → `Software Engineer` 순으로 쌓이는지
- 셋의 왼쪽 끝이 아래 분류 목록과 같은 선에 맞는지
- `Unity 그래픽스·DOD`가 사이드바에서 사라졌는지

- [ ] **Step 3: 설명이 다른 자리에 남았는지 확인**

```bash
curl -s http://localhost:4321/ | grep -c "Unity 그래픽스"
```
Expected: 2 이상 — 홈 히어로와 `<meta name="description">`에 남아 있어야 한다.
0이면 사이드바 말고 다른 곳까지 지운 것이므로 Task 2를 되돌아본다.

- [ ] **Step 4: 글 헤더 확인**

글 하나를 열어 프로필 줄의 `Software Engineer`가 그대로인지 본다. Task 1에서
출처가 설정으로 바뀌었을 뿐 화면은 같아야 한다.

- [ ] **Step 5: 좁은 화면**

창을 1024px 미만으로 줄이고 햄버거로 사이드바를 연다.

- 상단이 커진 만큼 아래가 밀릴 뿐 잘리지 않는지
- 내용이 길면 스크롤되는지 (`overflow-y-auto`가 이미 걸려 있다)

- [ ] **Step 6: 라이트·다크 양쪽**

우하단 토글로 두 테마를 본다. 원형 사진 가장자리가 두 배경에서 모두 자연스러운지
확인한다.

- [ ] **Step 7: 최종 확인**

```bash
corepack pnpm build && corepack pnpm test && corepack pnpm lint
git status --short
```

Expected: build 0 errors, test 전부 통과, lint 출력 없음, 워킹트리에 커밋 안 된
변경 없음 (`docs/HANDOFF.md`는 untracked로 남는 것이 정상 — 커밋하지 않는다)
