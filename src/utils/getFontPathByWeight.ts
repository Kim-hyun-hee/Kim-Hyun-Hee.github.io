import type { FontData } from "astro:assets";

export function getFontPathByWeight(
  fonts: FontData[],
  weight: number,
  options?: {
    style?: "normal" | "italic";
    format?: string;
  }
): string | undefined {
  const style = options?.style ?? "normal";
  const format = options?.format ?? "truetype";

  // [CUSTOM] 아래 candidates 검색은 업스트림 동작을 고친 것입니다. 업스트림은
  // weight/style이 맞는 첫 항목을 바로 반환해서, 그 항목의 src에 요청한 포맷이
  // 없으면 뒤에 있는 쓸 수 있는 항목을 놓쳤습니다. 코드 폰트를 woff2와 ttf
  // 두 포맷으로 요청하면서 실제로 문제가 됐습니다(OG 이미지 생성이 ttf 필요).
  // 업스트림에 PR로 올릴 만한 수정입니다.
  //
  // A provider can resolve one (weight, style) pair into several separate
  // font entries, one per requested format, rather than a single entry with
  // multiple `src` formats. Search all matching entries for the requested
  // format before falling back, otherwise an earlier entry in an
  // unsupported format (e.g. woff2) would be picked over a later, usable one.
  const candidates = fonts.filter(
    font => font.weight === String(weight) && font.style === style
  );

  for (const font of candidates) {
    const src = font.src.find(file => file.format === format);
    if (src) return src.url;
  }

  return candidates[0]?.src[0]?.url;
}
