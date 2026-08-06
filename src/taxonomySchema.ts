/**
 * [CUSTOM] 업스트림에 없는 파일 — 이 저장소에서 추가했습니다.
 *
 * 분류 체계(대분류·소분류·시리즈)의 스키마 조각과 교차 검증 규칙.
 *
 * 이 로직을 `src/content.config.ts`에 인라인으로 두지 않고 여기로 뺀
 * 이유는 병합 충돌 면적 때문입니다. content.config.ts는 업스트림이
 * 계속 손대는 파일이라, 거기에 50줄짜리 검증 블록이 들어가 있으면
 * 업스트림 변경을 받을 때마다 통째로 충돌합니다. 여기 두면
 * content.config.ts 쪽 변경은 import 한 줄, 필드 한 줄, superRefine
 * 한 줄로 끝나고, 충돌이 나도 무엇이 우리 것인지 즉시 알 수 있습니다.
 *
 * 관련 설계: docs/superpowers/specs/2026-08-06-blog-redesign-design.md §4.3
 */
import { z } from "astro/zod";
import {
  CATEGORY_IDS,
  getSubcategoryIds,
  hasSubcategories,
  isValidSubcategory,
} from "@/categories";
import { SERIES, SERIES_IDS } from "@/series";

/**
 * 글 frontmatter에 추가되는 분류 필드.
 * `content.config.ts`의 posts 스키마에 펼쳐 넣습니다.
 */
export const taxonomyFields = {
  category: z.enum(CATEGORY_IDS),
  subcategory: z.string().optional(),
  series: z.enum(SERIES_IDS).optional(),
  seriesOrder: z.number().int().positive().optional(),
};

/** `taxonomyFields`를 포함한 객체라면 무엇이든 검증할 수 있는 최소 형태. */
type TaxonomyInput = {
  category: (typeof CATEGORY_IDS)[number];
  subcategory?: string;
  series?: (typeof SERIES_IDS)[number];
  seriesOrder?: number;
};

/**
 * 필드 하나만으로는 판단할 수 없는 규칙 다섯 가지를 검사합니다.
 * zod의 `.superRefine()`에 그대로 넘겨 쓰면 됩니다.
 *
 * 여기서 걸러내지 못하는 것이 하나 있습니다 — 같은 시리즈 안에서
 * `seriesOrder`가 중복되는 경우입니다. superRefine은 글을 하나씩만 보기
 * 때문에 다른 글의 값을 알 수 없습니다. 그 검사는 `getSeriesPosts()`가
 * 빌드 중에 예외를 던지는 방식으로 대신합니다.
 */
export function validateTaxonomy(
  data: TaxonomyInput,
  ctx: z.RefinementCtx
): void {
  const needsSub = hasSubcategories(data.category);

  // 1) 소분류를 가진 대분류에는 subcategory가 반드시 있어야 한다.
  if (needsSub && !data.subcategory) {
    ctx.addIssue({
      code: "custom",
      path: ["subcategory"],
      message: `"${data.category}"에는 subcategory가 필요합니다. 가능: ${getSubcategoryIds(
        data.category
      ).join(", ")}`,
    });
  }

  // 2) subcategory는 그 대분류에 실제로 속한 값이어야 한다.
  if (
    needsSub &&
    data.subcategory &&
    !isValidSubcategory(data.category, data.subcategory)
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["subcategory"],
      message: `"${data.subcategory}"는 "${data.category}"의 소분류가 아닙니다. 가능: ${getSubcategoryIds(
        data.category
      ).join(", ")}`,
    });
  }

  // 3) 소분류가 없는 대분류에는 subcategory를 달 수 없다.
  if (!needsSub && data.subcategory) {
    ctx.addIssue({
      code: "custom",
      path: ["subcategory"],
      message: `"${data.category}"는 subcategory를 갖지 않습니다.`,
    });
  }

  // 4) series와 seriesOrder는 항상 함께 온다.
  if (Boolean(data.series) !== Boolean(data.seriesOrder)) {
    ctx.addIssue({
      code: "custom",
      path: ["seriesOrder"],
      message: "series와 seriesOrder는 함께 지정해야 합니다.",
    });
  }

  // 5) 글의 category와 시리즈가 선언한 category가 어긋나면 안 된다.
  //    이걸 놓치면 글이 두 대분류에 동시에 나타난다.
  if (data.series && SERIES[data.series].category !== data.category) {
    ctx.addIssue({
      code: "custom",
      path: ["series"],
      message: `"${data.series}" 시리즈는 "${SERIES[data.series].category}" 대분류에 속하는데, 이 글의 category는 "${data.category}"입니다.`,
    });
  }
}
