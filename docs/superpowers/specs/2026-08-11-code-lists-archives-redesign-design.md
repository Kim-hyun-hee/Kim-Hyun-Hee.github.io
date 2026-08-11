# 코드 블록·글 목록·Archives 보정 설계

## 목표

현재 코드 블록의 헤더 정렬과 스크롤바 결함을 근본적으로 고치고, 모든 일반 글 목록을 하나의 편집형 C 레이아웃으로 통일한다. Series에는 날짜와 명확한 hover affordance를 추가하고, Archives는 전체 폭 연도 구조와 같은 글 행을 사용한다. Deep Dive의 세 소분류에는 실제 페이지네이션과 기본 썸네일을 확인할 공개 테스트 글을 각각 10개 추가한다.

## 범위

- 코드 블록 프레임, Copy 수명주기, 라이트·다크 표면, 언어 표시, scrollbar
- 공용 `Card`의 링크 범위, 날짜, taxonomy, 설명, 썸네일
- `Card`를 쓰는 홈·전체 글·태그·대분류·소분류·Archives
- `/series/` 아코디언 요약 hover와 펼친 글 날짜
- `/series/[slug]/` 전체 글 날짜
- Archives의 연도·월 헤더와 공용 글 행
- Deep Dive의 Rendering·Architecture·Memory 공개 테스트 글 30개

Callout, Pagination, About 프로젝트, Sidebar 구조, Series 순번·애니메이션, Shiki syntax foreground 역할은 이번 범위에서 바꾸지 않는다.

## 1. 코드 블록

### DOM과 수명주기

`pre.astro-code`는 세 개의 정상 흐름 영역을 갖는다.

1. `.code-frame-header`: 신호등, 선택적 파일명, Copy 버튼
2. 직접 자식 `code`: 유일한 스크롤 영역
3. `pre::after`: 언어를 표시하는 23px 하단 영역

헤더는 더 이상 absolute overlay가 아니다. 파일명 transformer가 헤더와 신호등·파일명을 생성하고, `setupCodeCopy()`가 Copy 버튼을 헤더에 추가한다. 파일명이 없는 헤더도 Copy 버튼을 포함하므로 헤더 자체에는 `aria-hidden`을 두지 않고 신호등만 장식으로 숨긴다. Copy 버튼 재초기화, 클립보드 동작, `Copied` 복구 타이머, `astro:before-swap` cleanup은 기존 계약을 유지한다.

직접 자식 `code`가 `tabindex="0"`과 접근성 이름을 가진다. 파일명이 있으면 `aria-labelledby`, 없으면 `aria-label="Code block"`을 사용한다. `pre`의 Shiki 초기 tabindex는 런타임에서 제거하고 cleanup 때 원래 값으로 복구한다.

### 치수와 표면

- 프레임 radius: 10px
- 헤더 높이: 38px
- 신호등: 10px, 빨강·노랑·초록
- 파일명·Copy·언어: 10–11px monospace
- 코드 본문 padding: 위 11px, 좌우 13px, 아래 8px
- 코드 스크롤 최대 높이: 550px
- 언어 하단 영역: 23px

라이트 표면:

- 본문 `#fafafa`
- 헤더 `#f0f0f1`
- 테두리 `#dedede`
- 줄 hover `#eeeeef`

다크 표면:

- 본문 `#1f1f20`
- 헤더 `#272729`
- 테두리 `#3a3a3d`
- 헤더 구분선 `#343436`
- 줄 hover `#29292b`

다크 Shiki foreground 역할은 유지하고 background 두 값만 `#1f1f20`으로 바꾼다. 라이트 background는 `#fafafa`를 유지한다.

### scrollbar와 언어

WebKit scrollbar는 15px 축을 유지하되 button을 숨기고 track/corner를 투명하게 만든다. thumb는 7px가 보이도록 4px 안쪽 테두리와 10px radius를 사용한다. 가로는 왼쪽→오른쪽, 세로는 위→아래 gradient다.

라이트 thumb:

- `#3a9da5`
- `#a97ac0`
- `#dd6577`
- `#d39a78`

다크 thumb:

- `#24a8b4`
- `#b072d1`
- `#e93c58`
- `#efb993`

Firefox fallback은 각 모드의 보라색 thumb와 transparent track을 사용한다. 언어 표시는 기존 `data-language`를 CSS `content: attr(data-language)`로 읽으며 라이트 `#8387d3`, 다크 `#e58d7d`를 사용한다. line number는 추가하지 않는다.

## 2. 공용 글 목록

### 공용 데이터

`Card.astro`가 모든 일반 글 행의 단일 구현이다. taxonomy 문자열은 다음 규칙으로 만든다.

- category + subcategory: `Deep Dive > Rendering`
- category만 존재: `Troubleshooting`
- category 없음: taxonomy 생략

날짜는 기존 `Datetime` compact 형식인 `YYYY.MM.DD`를 사용한다. 읽기 시간은 표시하지 않는다.

### C 레이아웃

각 `li[data-post-row]` 안에는 글 URL 하나만 가리키는 전체 폭 anchor가 있다. anchor가 thumbnail과 본문을 묶으므로 제목뿐 아니라 행의 padding과 썸네일을 포함한 전체 영역을 클릭할 수 있다. 제목 hover underline은 제거한다. hover와 focus-visible은 기존 accent-muted→transparent 그라데이션을 공유한다.

데스크톱:

- 좌측 4:3 thumbnail 112px
- 우측 제목, 날짜·taxonomy meta, 설명
- 열 간격 20px

작은 화면:

- thumbnail 82px, 필요하면 320px에서 72px까지 축소
- 설명은 최대 두 줄 또는 매우 좁은 화면에서 숨김
- 제목과 meta는 줄바꿈 가능

메타는 `YYYY.MM.DD · 대분류 > 소분류` 순서이며 `text-muted-foreground` 계열을 사용한다. 포인트색을 쓰지 않는다.

### 실제 이미지와 기본 썸네일

`ogImage`가 있으면 해당 이미지를 4:3 영역에 `object-fit: cover`로 렌더링한다. 제목을 반복 낭독하지 않도록 목록 썸네일은 빈 alt를 갖는 장식 이미지다.

`ogImage`가 없으면 `DefaultPostThumbnail.astro`의 인라인 SVG를 사용한다. SVG에는 `Dev groot.` 워드마크를 표시한다. 라이트는 밝은 무채색 배경과 보라 `#8387d3` 마침표, 다크는 중립 `#272729` 배경과 연어 `#e58d7d` 마침표를 사용한다. 별도 라이트·다크 파일을 만들지 않고 사이트 CSS 변수에 반응하는 하나의 컴포넌트로 유지한다.

## 3. Series

`/series/`의 접힌 summary 전체에 일반 글 행과 같은 accent-muted→transparent hover/focus-visible gradient를 준다. 펼침 상태의 화살표 배경은 바꾸지 않고 회전과 색상 계약을 유지한다.

펼친 아코디언의 각 글에는 기존 두 자리 순번과 제목을 유지하고 `YYYY.MM.DD`를 muted meta로 추가한다. `/series/[slug]/` 전체 목록도 같은 날짜를 추가한다. Series 전용 번호 구조 때문에 일반 `Card`로 강제 통합하지 않는다. 홈의 요약 Series와 본문 아래 관련 Series 목록은 이번 날짜 추가 범위가 아니다.

기존 native `details` 의미, 부드러운 열기·닫기 애니메이션, reduced-motion, cleanup/re-init 계약은 유지한다.

## 4. Archives

연도는 본문 전체 폭을 쓰고 배경색 band는 사용하지 않는다. 각 연도 시작에 2px accent 상단선을 두고 같은 행에서 연도와 연도별 글 수를 양끝에 표시한다. 월 제목과 월별 글 수는 그 아래에 둔다.

월 내부 글은 `Card variant="h4"`를 그대로 사용해 일반 목록과 동일한 C 레이아웃, 전체 taxonomy, 날짜, 썸네일, 전체 행 링크를 얻는다. heading outline은 `h1 Archives → h2 year → h3 month → h4 post`를 유지한다.

## 5. Deep Dive 테스트 글

다음 경로에 Markdown 글을 각각 10개 추가한다.

- `src/content/posts/_ko/deep-dive/rendering/`
- `src/content/posts/_ko/deep-dive/architecture/`
- `src/content/posts/_ko/deep-dive/memory/`

각 글은 `draft: false`, 해당 category/subcategory, 고유한 과거 `pubDatetime`, 설명, 테스트 tag를 갖는다. 제목과 본문은 테스트용 예시임을 명확히 표시한다. Series 필드와 `ogImage`는 생략하여 분류 목록·페이지네이션·기본 썸네일을 실제로 검증한다.

정확히 30개를 추가하며 기존 Rendering 글 3개는 수정하지 않는다. 최종 기대치는 Rendering 13개, Architecture 10개, Memory 10개다.

## 6. 접근성과 반응형

- 전체 행 anchor는 키보드 focus-visible outline과 hover 동등 배경을 갖는다.
- 썸네일은 장식으로 처리하고 제목 heading과 링크 이름은 보존한다.
- code scrollport는 키보드로 초점을 받을 수 있다.
- Copy 버튼은 헤더 안에서 독립된 button이며 잘리지 않는다.
- Series summary의 native keyboard 동작을 유지한다.
- 320px에서 Card, Series, Archives, code frame이 수평 페이지 overflow를 만들지 않는다.

## 7. 검증

TDD로 다음 회귀를 먼저 재현한다.

- Copy 버튼이 헤더 밖/absolute 위치에 생성되는 상태
- scrollbar button·track/corner 계약과 gradient 축 누락
- 다크 background의 이전 `#1c1e26`
- 일반 목록의 부분 링크와 제목 underline
- subcategory만 표시되는 taxonomy
- `ogImage` 부재 시 thumbnail 없음
- Series 날짜와 summary hover 없음
- Archives 연도 background band 또는 잘못된 heading outline
- Deep Dive 세 소분류의 추가 글 수 부족

Focused GREEN 후 `format:check`, ESLint, 전체 Vitest, Astro check, production build, generated HTML/CSS audit, `git diff --check`를 실행한다. 실제 브라우저가 연결되지 않으면 생성 CSS와 320px 폭 계산을 기록하되, 사용자가 제공한 스크린샷 증상과 승인된 visual companion 시안을 기준으로 DOM 구조를 우선 바로잡는다.

