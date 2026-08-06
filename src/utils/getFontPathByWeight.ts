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
