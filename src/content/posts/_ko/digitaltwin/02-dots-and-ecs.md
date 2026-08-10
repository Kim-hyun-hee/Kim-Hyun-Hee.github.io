---
title: "DOTS와 ECS가 대신해주는 것"
description: "ECS를 쓰면 왜 빨라지는지, 엔티티·컴포넌트·시스템이 각각 무엇을 맡는지 정리한다."
pubDatetime: 2026-03-16T09:00:00+09:00
series: dod-digitaltwin-unity
seriesOrder: 2
tags:
  - Unity
  - DOD
  - ECS
---

앞 편에서 데이터를 재배치해야 한다는 결론이 나왔다. Unity의 DOTS는 그
재배치를 직접 손으로 하지 않아도 되게 해준다.

## 세 조각의 역할

엔티티는 ID일 뿐 데이터를 갖지 않는다. 컴포넌트가 값을 갖고, 시스템이
같은 컴포넌트 조합을 가진 엔티티들을 한꺼번에 훑는다.

## 청크와 아키타입

같은 컴포넌트 구성을 가진 엔티티는 같은 청크에 연속으로 담긴다. 이게
캐시 친화적인 순회가 공짜로 따라오는 이유다.

```csharp
partial struct TemperatureSystem : ISystem
{
    public void OnUpdate(ref SystemState state)
    {
        foreach (var (temp, color) in
                 SystemAPI.Query<RefRO<Temperature>, RefRW<BaseColor>>())
        {
            // 같은 청크 안에서 연속으로 읽힌다
        }
    }
}
```

## 다음 편

실제 설비 데이터를 어떤 컴포넌트로 쪼갤지 정한다.
