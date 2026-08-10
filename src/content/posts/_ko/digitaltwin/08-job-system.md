---
title: "Job System으로 업데이트 병렬화하기"
description: "순회를 워커 스레드로 나누면서 만난 의존성 문제와 Burst 적용 결과."
pubDatetime: 2026-04-27T09:00:00+09:00
series: dod-digitaltwin-unity
seriesOrder: 8
tags:
  - Unity
  - 동시성
  - 성능
---

데이터가 연속으로 놓이고 나니 병렬화가 쉬워졌다. 나눌 구간이 명확했다.

## 읽기와 쓰기를 갈라놓기

같은 컴포넌트를 두 잡이 동시에 건드리면 안전 시스템이 막는다. 읽기 전용
표시를 정확히 붙이는 것부터 했다.

## Burst

수치 계산 루프에 붙였을 때 차이가 가장 컸다.

```csharp
[BurstCompile]
partial struct UpdateStateJob : IJobEntity { /* … */ }
```

## 다음 편

이제 남은 병목을 프로파일러로 다시 찾는다.
