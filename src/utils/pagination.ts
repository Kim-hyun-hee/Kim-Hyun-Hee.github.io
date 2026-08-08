/** 페이지네이션에 그릴 항목. 숫자는 페이지 번호, "dots"는 접힌 구간. */
export type PaginationItem = number | "dots";

/** 한 번에 보여줄 최대 칸 수. 첫·마지막·현재와 접힘 표시가 모두 들어가야 한다. */
const MAX_ITEMS = 7;

/**
 * 페이지 번호 목록을 만든다. 첫 페이지, 마지막 페이지, 현재 페이지는 항상
 * 포함하고 나머지를 "dots"로 접어 MAX_ITEMS를 넘지 않게 한다.
 */
export function getPaginationItems(
  current: number,
  lastPage: number
): PaginationItem[] {
  if (lastPage <= MAX_ITEMS) {
    return Array.from({ length: lastPage }, (_, i) => i + 1);
  }

  // 앞쪽: 1..5 … last
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "dots", lastPage];
  }

  // 뒤쪽: 1 … last-4..last
  if (current >= lastPage - 3) {
    return [
      1,
      "dots",
      lastPage - 4,
      lastPage - 3,
      lastPage - 2,
      lastPage - 1,
      lastPage,
    ];
  }

  // 가운데: 1 … cur-1 cur cur+1 … last
  return [1, "dots", current - 1, current, current + 1, "dots", lastPage];
}

/**
 * 현재 주소에서 페이지 번호를 뗀 기본 경로를 얻는다.
 *
 * Astro의 paginate()는 1페이지를 번호 없는 주소에, 2페이지부터 `/2` 형태로
 * 만든다. 번호별 링크를 만들려면 그 앞부분이 필요하다.
 *
 * 경로 안에 숫자가 들어간 분류(`/categories/2024-notes/`)도 있으므로 무조건
 * 마지막 조각을 떼면 안 된다. 현재 페이지 번호와 일치할 때만 뗀다.
 */
export function getPageBasePath(
  currentUrl: string,
  currentPage: number
): string {
  const trimmed = currentUrl.replace(/\/+$/, "");
  if (currentPage <= 1) return trimmed;

  const suffix = `/${currentPage}`;
  return trimmed.endsWith(suffix) ? trimmed.slice(0, -suffix.length) : trimmed;
}
