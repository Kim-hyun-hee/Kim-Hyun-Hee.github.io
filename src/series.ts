export type SeriesStatus = "ongoing" | "completed";

/** Series metadata is defined independently from categories. */
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
