# 소셜 링크 통합과 프로필 테두리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 소셜 링크를 사이드바 프로필 아래 한 곳으로 모으고, 두 프로필 사진에 그라데이션 테두리를 두르고, 목록 페이지 상단 여백을 준다.

**Architecture:** 셋 다 기존 파일 수정이다. 새 컴포넌트는 만들지 않는다. 그라데이션만 `global.css`의 `@utility`로 한 곳에 두고 두 호출부가 부른다.

**Tech Stack:** Astro 7, Tailwind CSS v4 (`@utility`), `astro:assets`

## Global Constraints

- 패키지 매니저는 `corepack pnpm`. `npm` 금지
- `corepack pnpm format`을 저장소 전체에 돌리지 않는다. 건드린 파일만 지정
- 포인트 색은 표시(선·테두리·밑줄)에만. 테두리는 허용되는 자리다
- 커밋 메시지와 코드 주석에 원본 스킨 이름·제작자명·플랫폼명을 쓰지 않는다
- 주석은 주변 코드처럼 최소로
- 검증 기준: build 0 errors / test 전부 통과 / lint clean

---

### Task 1: 소셜 링크를 사이드바 프로필 아래로

**Files:**
- Modify: `src/components/layout/Sidebar.astro` — 프로필 아래에 추가, 하단에서 제거
- Modify: `src/components/home/HomeHero.astro:21-23` — 제거
- Modify: `src/components/Footer.astro:22-31` — 제거 + 정렬 정리

**Interfaces:**
- `Socials.astro`는 수정하지 않는다. 호출부만 옮긴다

- [ ] **Step 1: 사이드바 프로필 아래에 추가**

`src/components/layout/Sidebar.astro`에서 직함 문단 바로 다음에 넣는다.

```astro
  {
    site.role && (
      <p class="text-muted-foreground mt-1.5 text-sm leading-relaxed">
        {site.role}
      </p>
    )
  }

  <div class="mt-3 -ms-2">
    <Socials />
  </div>
```

`-ms-2`는 `Socials` 안의 링크가 `p-2` 패딩을 갖고 있어 생기는 왼쪽 여백을
상쇄한다. 아이콘의 시각적 왼쪽 끝을 이름·직함과 같은 선에 맞춘다.

- [ ] **Step 2: 사이드바 하단에서 제거**

같은 파일 아래쪽의 `mt-auto` 블록에서 `<Socials />`와 감싼 `<div class="mt-4">`를
지운다. 검색·RSS 아이콘 묶음은 남긴다.

지우기 전:
```astro
    <div class="mt-4">
      <Socials />
    </div>
  </div>
</aside>
```
지운 뒤:
```astro
  </div>
</aside>
```

- [ ] **Step 3: 홈 히어로에서 제거**

`src/components/home/HomeHero.astro`에서 지운다.

지우기 전:
```astro
  <div class="mt-4">
    <Socials />
  </div>
</section>
```
지운 뒤:
```astro
</section>
```

파일 맨 위의 `import Socials from "@/components/Socials.astro";`도 함께 지운다.

- [ ] **Step 4: 푸터에서 제거하고 정렬 정리**

`src/components/Footer.astro`에서 바꾼다.

바꾸기 전:
```astro
  <div
    class="border-border flex flex-col items-center justify-between border-t py-6 sm:flex-row-reverse sm:py-4"
  >
    <Socials />
    <div class="my-2 flex items-center whitespace-nowrap">
      <span>
        &#169; {currentYear} {site.title} &middot; {t.footer.allRightsReserved}
      </span>
    </div>
  </div>
```

바꾼 뒤:
```astro
  <div
    class="border-border flex items-center justify-center border-t py-6 sm:py-4"
  >
    <span class="whitespace-nowrap">
      &#169; {currentYear} {site.title} &middot; {t.footer.allRightsReserved}
    </span>
  </div>
```

`import Socials from "./Socials.astro";`도 지운다.

- [ ] **Step 5: 빌드와 개수 확인**

Run: `corepack pnpm build`
Expected: 0 errors

Run: `corepack pnpm astro dev stop; corepack pnpm dev`
그다음:
```bash
curl -s http://localhost:4321/ | grep -c 'github.com/Kim-hyun-hee'
```
Expected: `1` — 홈에서 깃허브 링크가 하나여야 한다. 참고로 `site.profile`도
같은 URL이지만 그것은 JSON-LD 안의 값이라 이 grep에 잡히면 2가 될 수 있다.
2가 나오면 `grep -o 'href="https://github.com/Kim-hyun-hee"' | wc -l`로 다시
세어 **href가 하나**인지 확인한다.

- [ ] **Step 6: 커밋**

```bash
corepack pnpm exec prettier --write src/components/layout/Sidebar.astro src/components/home/HomeHero.astro src/components/Footer.astro
git add src/components/layout/Sidebar.astro src/components/home/HomeHero.astro src/components/Footer.astro
git commit -m "refactor(sidebar): 소셜 링크를 프로필 아래 한 곳으로 모은다"
```

---

### Task 2: 프로필 그라데이션 테두리

**Files:**
- Modify: `src/styles/global.css` — `@utility profile-ring` 추가
- Modify: `src/components/layout/Sidebar.astro` — 사진을 감싼다
- Modify: `src/pages/posts/[...slug]/_components/PostHeader.astro` — 사진을 감싼다

**Interfaces:**
- Produces: `.profile-ring` 유틸리티. 배경만 정의하고 모양·두께는 호출부가 정한다

- [ ] **Step 1: 유틸리티 추가**

`src/styles/global.css`의 `@utility app-layout { … }` 다음에 넣는다.

```css
/* 프로필 사진 테두리. border는 그라데이션을 받지 못하므로 감싼 요소의
   배경을 padding만큼 드러내 링을 만든다. */
@utility profile-ring {
  background: linear-gradient(100deg, var(--accent), var(--sky));
}
```

- [ ] **Step 2: 사이드바 사진 감싸기**

`src/components/layout/Sidebar.astro`에서 `<Image>`를 감싼다.

바꾸기 전:
```astro
  <Image
    src={profileImage}
    alt=""
    width={128}
    height={128}
    class="size-16 rounded-full"
  />
```

바꾼 뒤:
```astro
  <div class="profile-ring w-fit rounded-full p-[3px]">
    <Image
      src={profileImage}
      alt=""
      width={128}
      height={128}
      class="block size-16 rounded-full"
    />
  </div>
```

`w-fit`이 없으면 `<aside class="flex flex-col">`의 `align-items: stretch` 때문에
그라데이션이 사이드바 폭을 꽉 채운 띠가 된다. `block`은 인라인 이미지 아래
생기는 여백을 없앤다.

- [ ] **Step 3: 글 헤더 사진 감싸기**

`src/pages/posts/[...slug]/_components/PostHeader.astro`에서 `<Image>`를 감싼다.

바꾸기 전:
```astro
    <Image
      src={profileImage}
      alt=""
      width={96}
      height={96}
      class="size-12 rounded-full"
    />
```

바꾼 뒤:
```astro
    <div class="profile-ring rounded-full p-[2px]">
      <Image
        src={profileImage}
        alt=""
        width={96}
        height={96}
        class="block size-12 rounded-full"
      />
    </div>
```

여기는 부모가 `flex items-center`라 `w-fit`이 필요 없다.

- [ ] **Step 4: 빌드·테스트·린트**

Run: `corepack pnpm build`
Expected: 0 errors

Run: `corepack pnpm test`
Expected: 전부 통과

Run: `corepack pnpm lint`
Expected: 출력 없음

- [ ] **Step 5: 컴파일된 CSS 확인**

```bash
grep -oh "profile-ring{[^}]*}" dist/_astro/*.css
```
Expected: `linear-gradient(100deg,var(--accent),var(--sky))`가 들어간 규칙이 나온다.
안 나오면 `@utility` 이름이 마크업의 클래스명과 다르거나 어느 호출부도 그 클래스를
쓰지 않는 것이다.

- [ ] **Step 6: 커밋**

```bash
corepack pnpm exec prettier --write src/styles/global.css src/components/layout/Sidebar.astro "src/pages/posts/[...slug]/_components/PostHeader.astro"
git add src/styles/global.css src/components/layout/Sidebar.astro "src/pages/posts/[...slug]/_components/PostHeader.astro"
git commit -m "feat(profile): 프로필 사진에 그라데이션 테두리를 두른다"
```

---

### Task 3: 목록 상단 여백

**Files:**
- Modify: `src/components/Main.astro:22-25`

- [ ] **Step 1: 위 여백 추가**

`src/components/Main.astro`의 `<main>` 클래스를 바꾼다.

바꾸기 전:
```astro
  class:list={["app-layout pb-4", className]}
```
바꾼 뒤:
```astro
  class:list={["app-layout pt-8 pb-4", className]}
```

- [ ] **Step 2: 빌드와 확인**

Run: `corepack pnpm build`
Expected: 0 errors

dev 서버에서 `/posts`, `/tags`, `/archives`를 열어 제목 위 여백을 본다. 글
페이지의 "뒤로" 버튼 위 여백(`mt-8`)과 비슷한 리듬이면 맞다. 너무 넓거나 좁으면
`pt-6` 또는 `pt-10`으로 조정한다.

- [ ] **Step 3: 커밋**

```bash
corepack pnpm exec prettier --write src/components/Main.astro
git add src/components/Main.astro
git commit -m "style(list): 목록 페이지 제목 위에 여백을 준다"
```

---

### Task 4: 실물 검증

**Files:** 없음 (확인만 한다)

- [ ] **Step 1: dev 서버 재시작**

```bash
corepack pnpm astro dev stop; corepack pnpm dev
```

- [ ] **Step 2: 여섯 가지 확인**

1. 홈에서 깃허브 아이콘이 1개
2. 사이드바 프로필 아래에 소셜 링크, 하단에는 검색·RSS만
3. 두 프로필 사진에 그라데이션 링. 사이드바 쪽이 띠가 아니라 **원**인지
4. 푸터 저작권이 좁은 화면·넓은 화면 모두 가운데
5. 목록 페이지 제목 위 여백
6. 라이트·다크 양쪽에서 링이 보이는지

- [ ] **Step 3: 최종 확인**

```bash
corepack pnpm build && corepack pnpm test && corepack pnpm lint
git status --short
```

Expected: 전부 통과, 워킹트리에 커밋 안 된 변경 없음 (`docs/HANDOFF.md`는
untracked로 남는 것이 정상 — 커밋하지 않는다)
