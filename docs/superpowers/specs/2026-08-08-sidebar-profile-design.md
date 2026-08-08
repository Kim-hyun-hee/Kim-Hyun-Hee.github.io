# 사이드바 상단 프로필

작성일: 2026-08-08
선행 문서: `2026-08-08-post-header-design.md`

## 1. 배경

사이드바 상단은 지금 두 줄이다.

```
Dev groot                 ← 홈 링크
Unity 그래픽스·DOD         ← site.description
────────────────────────
분류 전체보기
```

글 헤더에 프로필을 넣고 나니 사이드바 상단이 상대적으로 빈약해 보인다. 같은
사진을 여기에도 쓴다.

## 2. 설계

### 2.1 배치

세로로 쌓되 좌측 정렬한다.

```
╭─────╮
│  ◕  │       64px 원형
╰─────╯
Dev groot
Software Engineer
────────────────────────
분류 전체보기
```

가운데 정렬을 쓰지 않는 이유: 사이드바의 나머지(분류 목록, Tags, About,
아카이브)가 전부 좌측 정렬이라 상단만 가운데로 두면 맞춤선이 둘로 갈린다.

가로 배치(글 헤더와 같은 모양)를 쓰지 않는 이유: 사이드바 폭이 256px, 패딩을
빼면 216px다. 48px 사진과 여백을 빼면 글자에 156px가 남아 `Software Engineer`가
잘릴 수 있다. "상단을 키운다"는 목적에도 맞지 않는다.

### 2.2 문구

이름 아래는 `site.description`이 아니라 **직함**을 쓴다.

사이드바는 "누가 쓰는가", 본문은 "무엇을 쓰는가"로 역할을 나눈다.
`site.description`은 홈 히어로와 `<meta name="description">` 기본값으로 계속
쓰이므로 값 자체가 사라지지는 않는다.

### 2.3 직함 문자열의 자리

`"Software Engineer"`를 `astro-paper.config.ts`의 `site.role`로 올린다.

`types/config.ts`는 **두 군데**를 고쳐야 한다.

1. `SiteConfig`에 `role?: string` 추가
2. `ResolvedSiteConfig`의 `Pick<SiteConfig, "profile" | "googleVerification">`에
   `"role"` 추가

`ResolvedSiteConfig`가 필드를 명시적으로 `Pick`하므로 1번만 하면
`config.site.role`이 타입에 잡히지 않는다. `src/config.ts`는 `...userConfig.site`
스프레드라 손댈 필요가 없다.

`2026-08-08-post-header-design.md` §7에서는 같은 문자열을 컴포넌트에 직접 쓰기로
했고, 그때는 그것이 맞았다 — 소비자가 하나뿐인데 설정·타입·컴포넌트 세 파일을
건드릴 이유가 없었다. **소비자가 둘이 되면서 답이 바뀐다.** 두 파일에 같은
문자열이 흩어지면 바꿀 때 한쪽을 빠뜨린다. `title`·`author`·`description`이
이미 사는 곳으로 보낸다.

`PostHeader.astro`의 하드코딩도 `config.site.role`로 바꾼다.

### 2.4 공통 컴포넌트를 만들지 않는다

글 헤더의 프로필과 사이드바의 프로필을 `AuthorCard` 하나로 묶지 않는다.

| | 글 헤더 | 사이드바 |
|---|---|---|
| 방향 | 가로 | 세로 |
| 사진 | 48px | 64px |
| 이름 | 링크 아님 | 홈 링크 |

세 가지가 모두 다르므로 공통 컴포넌트는 `layout`·`size`·`href` prop을 받아
내부가 분기로 채워진다. 호출부 둘을 위해 분기 셋을 만드는 것은 손해다. 각
화면의 마크업은 6줄 남짓이라 중복이 더 싸다.

`2026-08-08-post-header-design.md` §3.2에서 "두 화면의 요구가 다 보이는 시점에
정한다"고 미뤄둔 판단이 이것이다.

### 2.5 사진은 링크가 아니다

사진을 홈 링크로 감싸지 않는다. 바로 아래 이름이 이미 홈 링크라, 감싸면 같은
곳으로 가는 링크가 연달아 둘이 된다. 스크린리더 사용자에게는 중복 이동
지점이다.

`alt=""`로 둔다. 이름이 바로 아래 텍스트로 있어 대체 텍스트는 같은 정보를 두 번
읽게 만든다.

## 3. 변경 파일

| 파일 | 변경 |
|---|---|
| `astro-paper.config.ts` | `site.role` 추가 |
| `src/types/config.ts` | `SiteConfig`에 `role?: string`, `ResolvedSiteConfig`의 `Pick`에 `"role"` |
| `src/components/layout/Sidebar.astro` | 상단에 사진 추가, 설명 → 직함 |
| `src/pages/posts/[...slug]/_components/PostHeader.astro` | 하드코딩 → `config.site.role` |

## 4. 엣지 케이스

| 경우 | 결과 |
|---|---|
| `role`이 설정에 없을 때 | 직함 줄을 그리지 않는다. 사진과 이름만 나온다 |
| 사이드바가 화면보다 길 때 | `overflow-y-auto`가 이미 걸려 있어 스크롤된다 |
| lg 미만 (사이드바가 열리는 모드) | 같은 마크업이다. 상단이 커진 만큼 아래가 밀릴 뿐 |

## 5. 검증

`corepack pnpm build`(0 errors) / `test`(전부 통과) / `lint`(clean).

dev 서버에서 확인한다.

1. 사이드바 상단에 64px 원형 사진, 이름, 직함이 좌측 맞춤선에 정렬되는지
2. 글 헤더의 직함이 여전히 나오는지 (설정에서 읽어오도록 바뀌었다)
3. 홈 히어로와 `<meta name="description">`에 `site.description`이 남아 있는지
4. 창을 좁혀 사이드바를 열었을 때 상단이 잘리지 않고 스크롤되는지
5. 라이트·다크 양쪽

## 6. 범위 밖

- **#3 깃허브 링크 정리** — `Socials`가 사이드바 하단·푸터·홈 히어로 세 곳에서
  렌더된다. 별도 작업이다
- **글 헤더 프로필의 모양** — 이번에는 문자열 출처만 바꾼다
