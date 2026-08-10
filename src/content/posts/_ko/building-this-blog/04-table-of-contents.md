---
title: "목차: 인라인에서 sticky로"
description: "본문 위 목차로 시작했다가 우측 고정 방식으로 바꾼 이유와 스크롤 스파이 구현."
pubDatetime: 2026-07-13T09:00:00+09:00
series: building-this-blog
seriesOrder: 4
tags:
  - 블로그
  - JavaScript
  - 접근성
---

처음에는 본문 맨 위에 목차를 넣었다. 스크롤을 내리면 사라져서 쓸모가
없었다.

## 처음부터 보이게

우측에 sticky로 두고 처음부터 노출하는 쪽으로 바꿨다. 나타났다 사라지는
연출은 오히려 방해였다.

## 현재 위치 표시

`IntersectionObserver`로 보이는 제목을 추적한다.

```js
const io = new IntersectionObserver(onIntersect, {
  rootMargin: "0px 0px -70%",
});
```

## 다음 편

색을 정한다. 정확히는 색을 쓰지 않기로 정한다.
