---
title: "화면 밖 설비를 지우기"
description: "프러스텀 컬링을 잡으로 돌려 그릴 후보 자체를 줄인 과정."
pubDatetime: 2026-04-06T09:00:00+09:00
series: dod-digitaltwin-unity
seriesOrder: 5
tags:
  - Unity
  - 렌더링
  - 성능
---

공장 전체를 한 화면에 담는 일은 드물다. 대부분의 시점에서 설비의 절반
이상은 화면 밖에 있다.

## 컬링을 어디서 할 것인가

엔진에 맡기지 않고 직접 잡으로 돌렸다. 인스턴싱 버퍼를 채우기 전에
걸러야 의미가 있기 때문이다.

## 경계 구가 먼저

정확한 판정보다 싼 판정이 먼저다. AABB 대신 경계 구로 1차를 거른다.

```csharp
[BurstCompile]
struct FrustumCullJob : IJobParallelFor { /* … */ }
```

## 다음 편

가까운 설비와 먼 설비를 같은 디테일로 그릴 필요는 없다.
