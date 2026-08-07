---
title: "SRP Batcher가 빠른 진짜 이유"
description: "드로우콜을 합치는 게 아니다. 무엇을 줄이는 최적화인지 정확히 짚는다."
pubDatetime: 2026-06-08T09:00:00+09:00
category: deep-dive
subcategory: rendering
tags:
  - Unity
  - 렌더링
  - 성능
---

SRP Batcher를 켜면 드로우콜 수가 그대로인데 빨라진다. 이름 때문에
오해하기 쉬운 지점이다.

## 줄이는 것은 상수 버퍼 갱신

드로우콜을 합치는 게 아니라, 머티리얼 프로퍼티를 GPU에 다시 올리는
작업을 건너뛴다.

## 배칭이 깨지는 조건

머티리얼이 달라도 셰이더 배리언트가 같으면 유지된다. 반대로
`MaterialPropertyBlock`을 쓰면 깨진다.

```hlsl
CBUFFER_START(UnityPerMaterial)
    float4 _BaseColor;
CBUFFER_END
```

## 정리

이름이 Batcher라서 드로우콜을 합친다고 오해하기 쉽지만, 실제로 줄이는
것은 상수 버퍼 갱신이다. 배칭이 깨지는 조건도 이 기준으로 보면 설명된다.
