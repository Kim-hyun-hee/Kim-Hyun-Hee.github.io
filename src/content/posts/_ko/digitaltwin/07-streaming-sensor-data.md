---
title: "실시간 센서 값을 ECS로 흘려보내기"
description: "외부에서 들어오는 초당 수천 건의 갱신을 메인 스레드를 막지 않고 반영하기."
pubDatetime: 2026-04-20T09:00:00+09:00
series: dod-digitaltwin-unity
seriesOrder: 7
tags:
  - Unity
  - ECS
  - 동시성
---

센서 데이터는 네트워크에서 비동기로 들어온다. 받는 쪽과 쓰는 쪽의 박자가
다르다는 게 핵심 문제였다.

## 이중 버퍼

수신 스레드는 뒤 버퍼에 쓰고, 프레임 경계에서 교체한다. 락을 프레임당
한 번으로 줄인다.

## ID를 엔티티로 바꾸기

들어오는 건 설비 ID다. 매번 조회하지 않도록 매핑을 한 번만 만든다.

```csharp
var map = new NativeHashMap<int, Entity>(capacity, Allocator.Persistent);
```

## 다음 편

읽어 들인 값을 반영하는 계산을 병렬로 돌린다.
