---
title: "좌측 고정 사이드바와 레이아웃 골격"
description: "분류가 항상 보이는 3단 레이아웃을 만들면서 정한 폭 기준과 반응형 처리."
pubDatetime: 2026-07-06T09:00:00+09:00
series: building-this-blog
seriesOrder: 3
tags:
  - 블로그
  - CSS
  - 레이아웃
---

분류를 코드로 고정했으니 그걸 항상 보이게 두고 싶었다. 좌측 사이드바가
그 자리다.

## 폭을 한 곳에서

사이드바·본문·목차 세 폭을 CSS 변수로 묶었다. 목차 위치 계산도 같은
값을 읽는다.

## 좁은 화면

사이드바는 접히고 상단 바가 대신 뜬다.

```css
:root {
  --sidebar-width: 256px;
  --content-width: 48rem;
}
```

## 다음 편

긴 글에 목차를 붙인다.
