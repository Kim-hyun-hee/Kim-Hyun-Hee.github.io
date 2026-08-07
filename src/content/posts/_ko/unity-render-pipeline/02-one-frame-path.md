---
title: "컬링부터 드로우까지, 한 프레임의 경로"
description: "프레임 디버거로 한 프레임을 끊어 보면서 각 단계가 어떤 커맨드로 나가는지 따라간다."
pubDatetime: 2026-06-01T09:00:00+09:00
category: deep-dive
subcategory: rendering
tags:
  - Unity
  - 렌더링
  - SRP
---

SRP에서는 그리는 순서를 C#이 정한다. 그 순서가 실제로 어떤 커맨드가
되는지 프레임 디버거로 확인한다.

## 컬링 결과 안에 든 것

`CullingResults`는 보이는 렌더러 목록만이 아니라 그림자에 기여하는
라이트 목록까지 함께 들고 있다.

## 필터가 패스를 고른다

`ShaderTagId`가 셰이더의 어떤 패스를 쓸지 결정한다. 이 태그가 없는
셰이더는 조용히 그려지지 않는다.

```csharp
var shaderTagId = new ShaderTagId("SRPDefaultUnlit");
```

## 정리

각 단계가 어떤 커맨드로 나가는지 알면, 프레임 디버거의 항목 하나하나가
내 코드의 어느 줄에서 나왔는지 짚을 수 있게 된다.
