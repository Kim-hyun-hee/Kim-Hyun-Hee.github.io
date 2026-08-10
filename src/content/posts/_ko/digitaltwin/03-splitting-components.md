---
title: "설비 데이터를 컴포넌트로 쪼개기"
description: "무엇을 한 컴포넌트에 묶고 무엇을 떼어낼지, 순회 빈도를 기준으로 나눈 기록."
pubDatetime: 2026-03-23T09:00:00+09:00
series: dod-digitaltwin-unity
seriesOrder: 3
tags:
  - Unity
  - DOD
  - ECS
---

컴포넌트를 잘게 쪼갤수록 좋은 건 아니다. 기준은 "얼마나 자주 함께
읽히는가"였다.

## 매 프레임 읽는 것과 아닌 것

위치는 거의 바뀌지 않고 센서 값은 매 프레임 바뀐다. 둘을 한 컴포넌트에
두면 안 바뀌는 값까지 캐시 라인을 차지한다.

## 최종 구성

정적 정보, 실시간 값, 표시 상태 세 갈래로 나눴다.

```csharp
struct EquipmentId   : IComponentData { public int Value; }      // 거의 안 읽음
struct SensorReading : IComponentData { public float Temp, Psi; } // 매 프레임
struct DisplayState  : IComponentData { public byte Level; }      // 매 프레임
```

## 다음 편

이제 이걸 화면에 그린다. 드로우콜부터 줄인다.
