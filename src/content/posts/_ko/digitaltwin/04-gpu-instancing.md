---
title: "GPU 인스턴싱으로 드로우콜 6,400에서 12로"
description: "같은 메시를 6,400번 그리는 일을 한 번의 명령으로 바꾸기까지."
pubDatetime: 2026-03-30T09:00:00+09:00
series: dod-digitaltwin-unity
seriesOrder: 4
tags:
  - Unity
  - 렌더링
  - 성능
---

설비 모델은 몇 종류 되지 않는다. 같은 메시를 위치만 바꿔 6,400번 그리는
상황이라면 인스턴싱이 정확히 들어맞는다.

## 인스턴스별로 다른 값

색은 설비마다 다르다. 머티리얼을 나누는 대신 인스턴스 버퍼로 넘긴다.

## 측정

드로우콜이 메시 종류 수만큼으로 줄었다.

```csharp
Graphics.RenderMeshInstanced(rp, mesh, 0, instanceData);
```

## 다음 편

안 보이는 설비까지 그릴 이유는 없다. 컬링으로 넘어간다.
