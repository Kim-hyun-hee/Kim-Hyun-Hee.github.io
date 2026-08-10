const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
const baseRoot = base === "" ? "/" : `${base}/`;

/**
 * Strip a locale prefix from a root-relative pathname.
 * e.g. with locale "en": "/en/posts/foo" → "/posts/foo", "/en" → "/"
 * Paths that don't start with the locale prefix are returned unchanged.
 */
export function stripLocale(pathname: string, locale: string): string {
  const prefix = `/${locale}`;
  if (pathname === prefix) return "/";
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  return pathname;
}

/**
 * Strip the configured Astro `base` prefix from an absolute pathname.
 * Returns a root-relative pathname.
 */
export function stripBase(pathname: string): string {
  if (base === "") {
    return pathname;
  }
  if (pathname === base) {
    return "/";
  }
  if (pathname.startsWith(baseRoot)) {
    const stripped = pathname.slice(base.length);
    return stripped === "" ? "/" : stripped;
  }
  return pathname;
}

/**
 * Split a pathname into route segments after stripping the Astro `base`
 * and locale prefix — the single source of truth for "where am I" used by
 * the sidebar nav and its active-state links.
 * e.g. with base "" and locale "ko": "/ko/categories/deep-dive/rendering/"
 * → ["categories", "deep-dive", "rendering"]
 */
/* [CUSTOM] 아래 함수는 업스트림에 없습니다. Sidebar/SidebarNav가 현재 경로를
   각자 파싱하지 않도록 한 곳으로 모은 것입니다. */
export function getPathSegments(pathname: string, locale: string): string[] {
  return stripLocale(stripBase(pathname), locale).split("/").filter(Boolean);
}

/**
 * Prefix an asset/file path with the configured Astro `base`.
 * Does not force a trailing slash for empty paths.
 */
export function getAssetPath(path: string): string {
  // Strip leading slash to avoid double-slash when concatenating with baseRoot
  const normalizedPath = path.replace(/^\/+/, "");

  if (!normalizedPath) {
    return base === "" ? "/" : base;
  }
  return baseRoot + normalizedPath;
}
