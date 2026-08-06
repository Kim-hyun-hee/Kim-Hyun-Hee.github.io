import type { CategoryId } from "./categories";

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
    category: "project",
    status: "ongoing",
  },
} as const satisfies Record<
  string,
  {
    label: string;
    description: string;
    category: CategoryId;
    status: SeriesStatus;
  }
>;

export type SeriesId = keyof typeof SERIES;

export const SERIES_IDS = Object.keys(SERIES) as [SeriesId, ...SeriesId[]];

export type SeriesSummary = {
  id: SeriesId;
  label: string;
  description: string;
  status: SeriesStatus;
};

export function getSeriesByCategory(category: CategoryId): SeriesSummary[] {
  return SERIES_IDS.filter(id => SERIES[id].category === category).map(
    id => ({
      id,
      label: SERIES[id].label,
      description: SERIES[id].description,
      status: SERIES[id].status,
    })
  );
}
