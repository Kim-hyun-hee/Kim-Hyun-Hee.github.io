---
title: "LOD를 데이터로 다루기"
description: "LOD Group 컴포넌트 대신 거리 하나로 단계를 정하는 방식으로 바꾼 이유."
pubDatetime: 2026-04-13T09:00:00+09:00
series: dod-digitaltwin-unity
seriesOrder: 6
tags:
  - Unity
  - 렌더링
  - DOD
---

기본 LOD 시스템은 오브젝트마다 컴포넌트를 요구한다. 엔티티 쪽에서는
거리 값 하나로 충분했다.

## 단계를 바이트 하나로

거리를 구간으로 나눠 0~2를 넣는다. 이 값이 곧 인스턴싱 버퍼를 가르는
기준이 된다.

## 히스테리시스

경계에서 단계가 떨리는 문제는 전환 거리를 방향별로 다르게 줘서 잡았다.

```csharp
byte NextLevel(float dist, byte cur) =>
    dist > Up[cur] ? (byte)(cur + 1) : dist < Down[cur] ? (byte)(cur - 1) : cur;
```

## 다음 편

지금까지는 정적인 그림이었다. 실시간 값을 흘려보낸다.
