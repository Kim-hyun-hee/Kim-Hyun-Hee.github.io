# 상자 전체를 클릭 가능하게 — LinkCard

작성일: 2026-08-09

## 1. 배경

시리즈·분류를 안내하는 상자가 네 곳에 있고 마크업이 같다.

```astro
<li class="border-border rounded-lg border p-4">
  <a href="…" class="… hover:underline">제목</a>
  <p>설명</p>
  <p>3편 · 연재 중</p>
</li>
```

| 위치 | 내용 |
|---|---|
| `components/home/HomeSeries.astro:42` | 홈의 시리즈 |
| `pages/categories/index.astro:32` | 분류 목록 |
| `pages/categories/[category]/index.astro:108` | 분류 페이지의 시리즈 |
| `pages/series/index.astro:31` | 시리즈 목록 |

두 가지가 아쉽다.

- **링크가 제목 글자에만 걸려 있다.** 상자 안 빈 곳이나 설명을 눌러도 아무 일이 없다
- **상자에 hover 상태가 없다.** 반응하는 것은 제목의 밑줄뿐이다

## 2. 결정

**hover에는 테두리 색만 바꾼다.** 회색 `--border`에서 포인트 `--accent`로. 배경을
깔거나 상자를 띄우지 않는다. 팔레트 규칙상 테두리는 포인트 색을 써도 되는
자리다.

**제목에 밑줄을 만들지 않는다.** 상자 테두리가 이미 신호이므로 밑줄이 겹치면
시끄럽다. 따라서 `hover:underline`과, 그것 때문에 있던 `decoration-accent`·
`underline-offset-4`도 함께 걷는다.

**키보드에도 같은 신호를 준다.** `focus-within:border-accent`. 밑줄을 없앤 만큼
Tab으로 이동하는 사용자가 아무 표시도 못 받는 상황을 막는다.

## 3. 클릭 방식 — stretched link

```astro
<li class="relative …">
  <a href="…" class="… after:absolute after:inset-0">제목</a>
  <slot />
</li>
```

링크는 제목에만 걸고, 가상 요소가 상자 전체를 덮어 어디를 눌러도 이동한다.
JS가 필요 없다.

**상자 전체를 `<a>`로 감싸지 않는 이유.** 그러면 설명과 편수까지 링크 이름에
섞여 스크린리더가 "SRP 파고들기 3편 연재 중 렌더링을 파고든 기록"처럼 통째로
읽는다. 제목만 링크로 두면 이름이 짧고 정확하다.

**받아들이는 대가.** 덮개가 텍스트 위에 있어 상자 안 글자를 드래그로 선택하기
어렵다. 이동이 목적인 상자이므로 감수한다.

## 4. LinkCard 컴포넌트

네 곳이 같은 상자이므로 규칙을 한 곳에 둔다. 값을 흩어두면 hover 색을 바꿀 때
네 군데를 고쳐야 하고 한 곳을 빠뜨리면 조용히 어긋난다. 다음 작업인 페이지네이션
버튼도 같은 hover 언어를 쓸 예정이라 더욱 그렇다.

`src/components/LinkCard.astro`:

```astro
---
type Props = {
  href: string;
  title: string;
  /** 홈의 시리즈 상자만 제목이 작다. */
  titleSize?: "base" | "lg";
};
---
<li
  class="border-border relative rounded-lg border p-4 transition-colors
         hover:border-accent focus-within:border-accent"
>
  <a
    href={href}
    class:list={[
      "text-foreground font-semibold after:absolute after:inset-0",
      { "text-lg": titleSize === "lg" },
    ]}
  >
    {title}
  </a>
  <slot />
</li>
```

설명과 메타 문단은 각 호출부가 슬롯으로 넘긴다. 네 곳의 여백이 조금씩 달라
(`mt-1` / `mt-1.5` / `mt-2` / `mt-4`) 컴포넌트가 정하지 않는다.

`titleSize`의 기본값은 `"lg"`다. 넷 중 셋이 그렇고, 홈만 `"base"`를 넘긴다.

## 5. 범위 밖

- **글 목록의 `Card.astro`** — 테두리 없는 목록 항목이다. 이번에 건드리지 않는다.
  한 페이지에 여덟 개가 쌓이면 상자가 무거워 보인다
- **페이지네이션** — 같은 hover 언어를 쓸 예정이나 별도 작업이다

## 6. 검증

`corepack pnpm build`(0 errors) / `test` / `lint`.

dev 서버에서 네 곳을 모두 연다 — 홈, `/categories`, `/categories/project`,
`/series`.

1. 상자 아무 곳이나 눌러 이동하는지
2. 마우스를 올리면 테두리만 보라로 바뀌고 **제목에 밑줄이 안 생기는지**
3. Tab으로 이동할 때도 테두리가 바뀌는지
4. 라이트·다크 양쪽
