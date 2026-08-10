export type SeriesStatus = "ongoing" | "completed";

/**
 * 시리즈 단일 소스.
 * 프로젝트 하나가 시리즈 하나에 1:1 대응한다. 시리즈 제목을 글마다 반복
 * 기입하지 않아도 되고, 오타로 시리즈가 둘로 쪼개지는 것을 막는다.
 */
export const SERIES = {
  "dod-digitaltwin-unity": {
    label: "DOD로 만드는 디지털트윈",
    description: "Unity에서 데이터 지향 설계로 설비 6,400개를 그리기까지",
    status: "ongoing",
  },
  "building-this-blog": {
    label: "이 블로그를 만든 기록",
    description: "정적 사이트 테마를 포크해 내 정보 구조로 뜯어고치기까지",
    status: "ongoing",
  },
} as const satisfies Record<
  string,
  {
    label: string;
    description: string;
    status: SeriesStatus;
  }
>;

export type SeriesId = keyof typeof SERIES;

export const SERIES_IDS = Object.keys(SERIES) as [SeriesId, ...SeriesId[]];
