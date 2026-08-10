---
title: "카테고리와 시리즈를 코드로 고정하기"
description: "분류 목록을 파일 하나에 두고, 거기 없는 값을 쓰면 빌드가 실패하게 만든 과정."
pubDatetime: 2026-06-29T09:00:00+09:00
series: building-this-blog
seriesOrder: 2
tags:
  - 블로그
  - Astro
  - TypeScript
---

새 카테고리를 만드는 비용이 0이면 늘어난다. 그래서 비용을 만들었다 —
파일을 열어 고쳐야만 추가되게.

## 단일 소스

카테고리 트리를 객체 하나로 두고, 라우팅·사이드바·스키마 검증이 전부
여기서 파생되게 했다.

## 스키마에서 막기

프론트매터의 분류 값을 열거형으로 검증하면 오타는 빌드 시점에 잡힌다.

```ts
export const CATEGORIES = {
  "deep-dive": {
    label: "Deep Dive",
    subcategories: { rendering: "Rendering" },
  },
} as const;
```

## 다음 편

구조가 정해졌으니 화면을 얹는다.
