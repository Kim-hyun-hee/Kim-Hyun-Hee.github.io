---
title: "원본 테마와 계속 병합하며 살기"
description: "주석으로 표시만 남기는 것으로는 부족했다. 병합 표면을 실제로 줄인 방법."
pubDatetime: 2026-07-27T09:00:00+09:00
series: building-this-blog
seriesOrder: 6
tags:
  - 블로그
  - git
  - 유지보수
---

1편에서 원본 파일에 `[CUSTOM]` 표시를 남긴다고 했다. 몇 번 병합해 보니
표시만으로는 부족했다.

## 표시가 낡는다

파일을 계속 고치다 보면 주석이 현재 상태와 어긋난다. 특히 원본 요소를
**삭제**한 경우, "이것들을 다시 끼우세요" 식의 안내는 삭제를 되살린다.

## 파일을 분리하는 쪽이 낫다

검증 로직 50줄을 원본 설정 파일에서 별도 파일로 빼니 병합 시 충돌이
import 한 줄로 줄었다.

```ts
// content.config.ts 쪽에 남는 것은 이 정도
import { taxonomyFields, validateTaxonomy } from "@/taxonomySchema";
```

## 다음 편

글 하단을 정리한다. 시리즈 마지막 편.
