# 소셜 링크 통합과 프로필 테두리

작성일: 2026-08-08
선행 문서: `2026-08-08-sidebar-profile-design.md`

## 1. 배경

세 가지를 함께 처리한다. 셋 다 작고, 앞의 둘은 사이드바 상단이라는 같은 자리를
건드린다.

**소셜 링크가 세 곳에서 렌더된다.** `Socials.astro` 하나를 푸터, 홈 히어로,
사이드바 하단이 각각 부른다. 지금 설정에는 깃허브 하나뿐이라 홈에 들어가면 같은
아이콘이 세 번 보인다.

**프로필 사진에 테두리가 없다.** 사이드바와 글 헤더 두 곳에 사진이 들어갔는데
배경과 경계가 흐릿하다.

**목록 페이지 제목이 화면 꼭대기에 붙는다.** `Main.astro`에 위 여백이 없다.

## 2. 소셜 링크

### 2.1 사이드바 프로필 아래로 모은다

| 자리 | 결정 |
|---|---|
| 사이드바 **프로필 아래** | 새 자리. 여기만 남긴다 |
| 사이드바 하단 `mt-auto` | `<Socials />` 제거. 검색·RSS 아이콘은 그대로 둔다 |
| 홈 히어로 | 제거 |
| 푸터 | 제거 |

사이드바 상단은 "누가 쓰는가"를 말하는 자리다. 사진·이름·직함 다음에 소셜
링크가 오는 것이 성격에 맞는다. 사이드바 하단은 검색·RSS라는 기능 묶음이므로
성격이 다르다.

깃허브 외의 링크(유튜브 등)는 지금 넣지 않는다. `astro-paper.config.ts`의
`socials` 배열에 한 줄 더하면 아이콘까지 자동으로 붙으므로 나중에 코드 수정 없이
추가할 수 있다. 아이콘은 `src/assets/icons/socials/{name}.svg`를 이름으로 찾는다.

### 2.2 푸터 정렬을 함께 정리한다

지금 푸터는 이렇다.

```astro
<div class="border-border flex flex-col items-center justify-between border-t py-6 sm:flex-row-reverse sm:py-4">
  <Socials />
  <div class="my-2 flex items-center whitespace-nowrap"><span>© …</span></div>
</div>
```

`justify-between`·`flex-col`·`sm:flex-row-reverse`는 **자식 둘을 양끝으로
벌리려고** 있는 클래스다. 하나만 남으면 전부 의미를 잃고, `flex-row-reverse` +
`justify-between` 조합 때문에 저작권이 데스크톱에서 오른쪽으로 붙는다.

가운데 정렬로 바꾸고 껍데기 `<div>`도 걷는다.

```astro
<div class="border-border flex items-center justify-center border-t py-6 sm:py-4">
  <span>© …</span>
</div>
```

## 3. 프로필 테두리

### 3.1 색

인용문과 같은 100도 방향의 그라데이션을 쓰되, **진한 쌍**을 쓴다.

```css
linear-gradient(100deg, var(--accent), var(--sky))
```

| | 라이트 | 다크 |
|---|---|---|
| `--accent` | `#7e82d8` | `#a5a8ea` |
| `--sky` | `#79c8ea` | `#8fd2f0` |

인용문이 쓰는 `--accent-muted` → `--sky-muted`(`#eceeff` → `#eaf8ff`)를 쓰지
않는 이유: 그 둘은 넓은 면에 까는 배경 틴트라 2~3px 테두리로는 라이트에서 흰
배경과 구분되지 않는다. 진한 쌍은 같은 색상계이므로 인용문과 한 계열로 읽히면서
테두리 구실을 한다.

`theme.css` 주석이 적어둔 `--sky`의 용도("`--accent`와 함께 그라데이션을 만든다")
그대로다. 팔레트 규칙상 테두리는 포인트 색을 써도 되는 자리다.

### 3.2 두께

| 자리 | 사진 | 테두리 |
|---|---|---|
| 사이드바 | 64px | 3px |
| 글 헤더 | 48px | 2px |

3px는 인용문 좌측 선(`border-s-[3px]`)과 같은 값이다.

### 3.3 구현 방식

`global.css`에 유틸리티 하나를 둔다. 이 저장소가 이미 `@utility max-w-app`,
`@utility app-layout`을 쓰는 방식이다.

```css
@utility profile-ring {
  background: linear-gradient(100deg, var(--accent), var(--sky));
}
```

호출부는 사진을 감싸는 `<div>`다.

```astro
<div class="profile-ring w-fit rounded-full p-[3px]">
  <Image … class="size-16 rounded-full" />
</div>
```

**CSS `border`를 쓰지 않는 이유.** `border`는 그라데이션을 받지 못한다.
`background-clip: border-box/padding-box` 기법도 있지만 안쪽 배경을 주변 색과
맞춰야 하는데 사이드바는 `--muted`, 글 헤더는 `--background`라 값이 갈린다.
사진이 불투명하므로 감싸서 padding만큼 그라데이션을 드러내는 편이 단순하다.

**`w-fit`은 사이드바에만 붙인다.** `<aside>`가 `flex flex-col`이라 자식이 기본으로
가로를 꽉 채운다(`align-items: stretch`). 붙이지 않으면 그라데이션이 216px짜리
띠가 되고 사진이 왼쪽에 박힌다. 글 헤더의 프로필 블록은 `flex items-center`라
그럴 일이 없다.

## 4. 목록 상단 여백

`src/components/Main.astro`의 `<main class="app-layout pb-4">`에 위 여백이 없어
제목이 화면 꼭대기에 붙는다. 글 페이지는 `BackButton`이 `mt-8 mb-2`로 위를
채우지만(`BackButton.astro:18`) 목록 페이지에는 그 요소가 없다.

`pt-8`을 넣어 같은 리듬을 준다. `Main.astro` 한 곳이므로 `/posts`, `/tags`,
`/archives`, `/search`, `/categories/*`가 모두 따라온다.

정확한 값은 실물을 보고 조정한다. 숫자만으로는 판단할 수 없다.

## 5. 엣지 케이스

| 경우 | 결과 |
|---|---|
| `socials` 배열이 비었을 때 | `Socials.astro`가 빈 `<div>`를 그린다. 사이드바에 빈 줄이 생기지만 설정에 항목이 있는 한 발생하지 않는다 |
| 좁은 화면(사이드바가 닫힌 상태) | 소셜 링크는 햄버거를 열어야 보인다. 푸터에서 뺐으므로 다른 경로는 없다 |
| 사진이 없을 때 | 해당 없음. `profile.png`는 저장소에 커밋되어 있다 |

## 6. 검증

`corepack pnpm build`(0 errors) / `test`(전부 통과) / `lint`(clean).

dev 서버에서 확인한다.

1. 홈에서 깃허브 아이콘이 **1개**인지 (지금은 3개)
2. 사이드바 프로필 아래에 소셜 링크가 있고, 하단에는 검색·RSS만 남았는지
3. 두 프로필 사진에 그라데이션 링이 보이는지 — 사이드바가 띠가 아니라 원인지
4. 푸터 저작권이 좁은 화면·넓은 화면 모두 가운데인지
5. 목록 페이지 제목 위에 여백이 생겼는지
6. 라이트·다크 양쪽

## 7. 범위 밖

- **유튜브 등 링크 추가** — 설정 한 줄이면 되므로 필요할 때 한다
- **`Main.astro`의 `pageDesc` italic** — 팔레트 정리 때 남은 잔재로 보이지만 이번
  범위가 아니다
- **#15 카테고리 페이지네이션, #2 공유 UI, #13 제목 고정** — 별도 작업
