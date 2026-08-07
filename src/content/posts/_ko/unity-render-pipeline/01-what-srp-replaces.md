---
title: "SRP는 무엇을 대신해주는가"
description: "빌트인 파이프라인이 감춰두고 하던 일을 SRP는 C# 쪽으로 꺼내놓는다. 그 경계가 정확히 어디인지 짚는다."
pubDatetime: 2026-05-25T09:00:00+09:00
category: deep-dive
subcategory: rendering
tags:
  - Unity
  - 렌더링
  - SRP
---

Unity의 빌트인 렌더 파이프라인은 편하다. 카메라를 놓으면 그려진다.
문제는 그 안에서 무슨 일이 일어나는지 볼 방법이 거의 없다는 것이다.
드로우 순서를 바꾸고 싶거나, 특정 패스를 빼고 싶거나, 왜 이 오브젝트만
배칭이 깨지는지 알고 싶을 때 손댈 지점이 없다.

SRP(Scriptable Render Pipeline)는 그 내부를 C# 코드로 옮겨놓은 것이다.
"더 빠른 파이프라인"이 아니라 **누가 결정하느냐가 바뀐 것**에 가깝다.

## 빌트인이 감춰두고 하던 일

한 프레임을 그린다는 건 대략 이런 순서다.

1. 카메라마다 무엇이 보이는지 판정한다 (컬링)
2. 보이는 것들을 어떤 순서로 그릴지 정한다 (정렬)
3. 그림자 맵을 굽는다
4. 불투명 물체를 그린다
5. 스카이박스, 반투명 물체, 후처리를 얹는다

빌트인에서 이 순서는 엔진 안에 고정돼 있다. 개입할 수 있는 지점은
카메라의 렌더 순서, 레이어 마스크, `OnRenderImage` 같은 몇 개의 훅뿐이다.
그 훅들 사이에서 실제로 어떤 커맨드가 GPU로 나가는지는 프레임 디버거로
결과만 볼 수 있다.

SRP에서는 위 다섯 단계를 내가 쓴다. 정확히는, 엔진이 제공하는 조각
(`Cull`, `DrawRenderers`, `DrawSkybox`)을 내가 원하는 순서로 호출한다.

## 경계는 어디인가

전부 다 C#으로 내려온 건 아니다. 경계를 헷갈리면 SRP를 오해하게 된다.

**C#이 결정하는 것** — 언제 무엇을 컬링할지, 어떤 필터로 어떤 셰이더
패스를 그릴지, 렌더 타깃을 언제 바꿀지, 정렬 기준을 무엇으로 둘지.

**엔진이 여전히 하는 것** — 실제 컬링 연산, 배칭 판정, 커맨드 버퍼를
그래픽스 API 호출로 변환하는 일. 이건 네이티브에 남아 있다.

그래서 SRP 코드는 대체로 "무엇을 어떤 순서로"를 기술하고, 무거운 계산은
넘긴다.

```csharp
protected override void Render(ScriptableRenderContext ctx, Camera[] cameras)
{
    foreach (var cam in cameras)
    {
        cam.TryGetCullingParameters(out var cp);
        var cullResults = ctx.Cull(ref cp);          // 판정은 엔진이

        var sorting  = new SortingSettings(cam) { criteria = SortingCriteria.CommonOpaque };
        var drawing  = new DrawingSettings(shaderTagId, sorting);
        var filter   = new FilteringSettings(RenderQueueRange.opaque);

        ctx.DrawRenderers(cullResults, ref drawing, ref filter);  // 순서는 내가
        ctx.DrawSkybox(cam);
        ctx.Submit();                                 // 여기서 실제로 나간다
    }
}
```

`Submit()` 전까지는 아무것도 GPU로 가지 않는다. 그 전까지 쌓는 건
전부 명령 목록이다. 이 지연 구조가 SRP를 읽을 때 처음 헷갈리는 지점이다.

## URP와 HDRP의 위치

URP와 HDRP는 SRP로 만든 파이프라인이다. SRP 자체는 프레임워크고, 저 둘은
그 위에 지어진 완성품이다. 그래서 "URP를 쓴다"와 "SRP를 쓴다"는 층위가
다른 말이다.

직접 파이프라인을 짜는 경우는 흔치 않다. 다만 URP를 쓰면서 렌더 피처를
추가하거나 패스 순서를 바꾸려면 결국 이 구조를 알아야 한다.

## 정리

SRP는 파이프라인을 빠르게 해주는 물건이 아니라, 어디서 무슨 일이
일어나는지 볼 수 있게 해주는 물건이다. 컬링에서 드로우까지 한 프레임이
지나는 실제 경로는 따로 정리해뒀다.
