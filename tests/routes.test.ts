import { describe, it, expect, beforeAll } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, sep } from "node:path";
import { CATEGORY_IDS, getSubcategoryIds } from "@/categories";
import { SERIES_IDS } from "@/series";
import siteConfig from "../astro-paper.config";

const DIST = "dist";

beforeAll(() => {
  if (!existsSync(DIST)) {
    throw new Error("dist/가 없습니다. 먼저 `pnpm build`를 실행하세요.");
  }
});

const page = (...segments: string[]) =>
  join(DIST, ...segments, "index.html");

/**
 * dist/ 아래 모든 index.html뿐 아니라 모든 *.html을 재귀적으로 찾는다.
 * pagefind 산출물(dist/pagefind/**)은 우리가 만든 페이지가 아니므로 제외한다.
 */
const listHtmlFiles = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith(".html"))
    .map(entry => join(entry.parentPath, entry.name))
    .filter(file => !file.split(sep).includes("pagefind"));

describe("카테고리 라우트", () => {
  it("대분류 목록이 비어있지 않다", () => {
    expect(CATEGORY_IDS.length).toBeGreaterThan(0);
  });

  it("모든 대분류 페이지가 생성된다", () => {
    for (const id of CATEGORY_IDS) {
      expect(existsSync(page("categories", id)), id).toBe(true);
    }
  });

  it("모든 소분류 페이지가 생성된다", () => {
    for (const id of CATEGORY_IDS) {
      for (const sub of getSubcategoryIds(id)) {
        expect(existsSync(page("categories", id, sub)), `${id}/${sub}`).toBe(
          true
        );
      }
    }
  });

  it("카테고리 목록 페이지가 생성된다", () => {
    expect(existsSync(page("categories"))).toBe(true);
  });
});

describe("시리즈 라우트", () => {
  it("시리즈 목록이 비어있지 않다", () => {
    expect(SERIES_IDS.length).toBeGreaterThan(0);
  });

  it("모든 시리즈 페이지가 생성된다", () => {
    for (const id of SERIES_IDS) {
      expect(existsSync(page("series", id)), id).toBe(true);
    }
  });

  it("시리즈 목록 페이지가 생성된다", () => {
    expect(existsSync(page("series"))).toBe(true);
  });

  it("시리즈 인덱스가 네이티브 아코디언과 번호가 있는 글 링크를 렌더한다", () => {
    const html = readFileSync(page("series"), "utf-8");
    const accordions = [
      ...html.matchAll(
        /<details\b(?=[^>]*\bdata-series-accordion\b)[^>]*>([\s\S]*?)<\/details>/g
      ),
    ];

    expect(accordions).toHaveLength(SERIES_IDS.length);
    accordions.forEach(([markup]) => {
      expect(markup).toMatch(/<summary\b[^>]*>/);
      if (/href="\/posts\//.test(markup)) {
        expect(markup).toMatch(/>\s*01\s*</);
      } else {
        expect(markup).toContain("아직 글이 없습니다.");
      }
    });
    for (const id of SERIES_IDS) {
      expect(html).toContain(`href="/series/${id}/"`);
    }
  });

  it("시리즈 글 목록의 보이는 편 번호를 중복 낭독하지 않는다", () => {
    const seriesPostPages = listHtmlFiles(join(DIST, "posts"))
      .map(file => ({ file, html: readFileSync(file, "utf-8") }))
      .filter(({ html }) => html.includes("이 시리즈의 글"));

    expect(seriesPostPages.length).toBeGreaterThan(0);
    for (const { file, html } of seriesPostPages) {
      const related = [
        ...html.matchAll(/<aside\b[^>]*>[\s\S]*?<\/aside>/g),
      ]
        .map(([markup]) => markup)
        .find(markup => markup.includes("이 시리즈의 글"));
      const numbers = [
        ...(related ?? "").matchAll(
          /<span\b([^>]*)>\s*\d{2}\s*<\/span>/g
        ),
      ];

      expect(numbers.length, file).toBeGreaterThan(0);
      numbers.forEach(([, attributes]) => {
        expect(attributes).toMatch(/\baria-hidden="true"/);
      });
    }
  });
});

describe("껍데기", () => {
  const home = () => readFileSync(page(), "utf-8");

  const sidebar = () =>
    home().match(/<aside\b[^>]*id="site-sidebar"[^>]*>([\s\S]*?)<\/aside>/)?.[1] ??
    "";

  it("renders footer copyright spacing", () => {
    const html = home();
    const footer = html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/)?.[1] ?? "";
    const text = footer
      .replace(/<[^>]+>/g, "")
      .replace(/&#169;/g, "©")
      .replace(/&middot;/g, "·")
      .replace(/\s+/g, " ")
      .trim();

    const expectedPrefix =
      "© " + new Date().getFullYear() + " " + siteConfig.site.title + " ·";
    expect(text).toContain(expectedPrefix);
  });

  it("contains one localized skip link before the main content target", () => {
    const html = home();
    const targetLinks = [
      ...html.matchAll(/<a\b[^>]*href="#main-content"[^>]*>[\s\S]*?<\/a>/g),
    ];
    const shellLinks = [
      ...html.matchAll(
        /<body\b[^>]*>\s*<a\b[^>]*href="#main-content"[^>]*>([\s\S]*?)<\/a>/g
      ),
    ];

    expect(targetLinks).toHaveLength(1);
    expect(shellLinks).toHaveLength(1);
    expect(shellLinks[0][1].replace(/<[^>]+>/g, "").trim()).toBe(
      "본문으로 건너뛰기"
    );
    expect(shellLinks[0].index).toBeLessThan(html.indexOf('id="main-content"'));
  });

  it("사이드바가 렌더된다", () => {
    expect(home()).toContain('id="site-sidebar"');
  });

  it("exposes Series navigation without the retired Project category", () => {
    expect(sidebar()).toMatch(/<a\b[^>]*href="\/series\/"[^>]*>\s*Series\s*<\/a>/);
    expect(sidebar()).not.toContain(">Project<");
  });

  it("테마 버튼이 정확히 하나다", () => {
    expect(home().match(/id="theme-btn"/g)?.length).toBe(1);
  });

  it("showArchives가 켜져 있으면 아카이브 링크가 있다", () => {
    expect(home()).toMatch(/href="[^"]*archives[^"]*"/);
  });
});

describe("내부 링크", () => {
  const htmlFiles = listHtmlFiles(DIST);

  it("스캔 대상 HTML 페이지가 하나 이상 존재한다", () => {
    expect(htmlFiles.length, "dist/ 아래 *.html을 찾지 못했습니다").toBeGreaterThan(
      0
    );
  });

  it("모든 페이지에서 카테고리·시리즈 링크가 실제 페이지를 가리킨다", () => {
    // 홈만 보면 안 된다 — /series/{id} 링크는 카테고리 페이지의 시리즈 카드
    // 분기 등 다른 페이지에서만 나타날 수도 있다. dist/ 전체를 스캔해야
    // "링크는 있는데 검사 대상이 아니어서 놓친다"를 막을 수 있다.
    const linksBySource: { file: string; href: string }[] = [];
    for (const file of htmlFiles) {
      const html = readFileSync(file, "utf-8");
      const hrefs = [
        ...html.matchAll(/href="(\/(?:categories|series)\/[^"]*)"/g),
      ].map(m => m[1]);
      for (const href of hrefs) {
        linksBySource.push({ file, href });
      }
    }

    // 정규식이 마크업 변경으로 더 이상 매치하지 않으면 아래 for 루프는 그냥
    // 통과해 버린다 — 검사가 아무것도 안 하고 초록불만 켜는 상태. 그걸
    // 막기 위해 "뭔가는 추출됐다"를 먼저 단언한다.
    expect(
      linksBySource.length,
      "카테고리·시리즈 href를 하나도 추출하지 못했습니다 (정규식이 마크업과 더 이상 맞지 않을 수 있습니다)"
    ).toBeGreaterThan(0);

    for (const { file, href } of linksBySource) {
      const path = href.replace(/^\/|\/$/g, "");
      expect(
        existsSync(join(DIST, path, "index.html")),
        `${file}에서 발견된 링크 ${href}가 실제 페이지를 가리키지 않습니다`
      ).toBe(true);
    }
  });
});

describe("legacy Project category route", () => {
  it("builds a redirect document to Series", () => {
    const legacy = readFileSync(page("categories", "project"), "utf-8");

    expect(legacy).toMatch(/http-equiv="refresh"[^>]*url=\/series\//i);
  });

  it("keeps the redirect out of the sitemap while retaining Series", () => {
    const sitemap = readFileSync(join(DIST, "sitemap-0.xml"), "utf-8");

    expect(sitemap).not.toContain("/categories/project/");
    expect(sitemap).toContain("/series/");
  });
});

describe("About taxonomy links", () => {
  const about = () => readFileSync(page("about"), "utf-8");

  it("links directly to Series without exposing the retired Project category", () => {
    expect(about()).toMatch(/<a\b[^>]*href="\/series\/"[^>]*>Series<\/a>/);
    expect(about()).not.toContain('href="/categories/project/"');
    expect(about()).not.toContain(">Project<");
  });
});

describe("post title transitions", () => {
  it("does not give post list or article headings a view-transition name", () => {
    const list = readFileSync(page("posts"), "utf-8");
    const firstPost = list.match(
      /<a href="(?<href>\/posts\/[^"]+\/)"[^>]*>\s*(?<heading><h[23]\b[^>]*>)/
    );

    expect(firstPost?.groups?.href).toBeDefined();
    expect(firstPost?.groups?.heading).toBeDefined();

    const articlePath = join(
      DIST,
      firstPost!.groups!.href.replace(/^\/|\/$/g, ""),
      "index.html"
    );
    const article = readFileSync(articlePath, "utf-8");
    const articleHeading = article.match(/<h1\b[^>]*>/);

    expect(firstPost!.groups!.heading).not.toMatch(
      /data-astro-transition-scope/i
    );
    expect(article).toContain('<article id="article"');
    expect(articleHeading).not.toBeNull();
    expect(articleHeading![0]).not.toMatch(/view-transition-name/i);
    expect(list).toContain(
      '<meta name="astro-view-transitions-enabled" content="true">'
    );
  });
});

describe("ruled post rows", () => {
  const representativeLists = () => {
    const tag = listHtmlFiles(join(DIST, "tags")).find(
      file => file !== page("tags")
    );
    const category = page("categories", "etc");

    expect(tag).toBeDefined();
    expect(existsSync(category)).toBe(true);

    return [
      page(),
      page("posts"),
      tag!,
      category,
    ];
  };

  it("renders shared semantic rows with dates before linked headings", () => {
    for (const file of representativeLists()) {
      const html = readFileSync(file, "utf-8");
      const rows = [
        ...html.matchAll(
          /<li\b(?=[^>]*\bdata-post-row\b)[^>]*>([\s\S]*?)<\/li>/g
        ),
      ];

      expect(rows.length, file).toBeGreaterThan(0);
      for (const [, row] of rows) {
        const date = row.indexOf("<time");
        const heading = row.search(/<h[23]\b/);
        const link = row.match(/<a\b[^>]*href="(\/posts\/[^\"]+)"/);

        expect(date, file).toBeGreaterThanOrEqual(0);
        expect(heading, file).toBeGreaterThan(date);
        expect(link?.[1], file).toBeDefined();
      }
    }
  });
});

describe("list section flow", () => {
  const mainContent = (file: string) =>
    readFileSync(file, "utf-8").match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ??
    "";

  const paginationNav = (file: string) =>
    mainContent(file).match(
      /<div\b[^>]*data-list-pagination[^>]*>([\s\S]*?<nav\b[^>]*aria-label="Pagination Navigation"[^>]*>[\s\S]*?<\/nav>)[\s\S]*?<\/div>/
    )?.[1];

  const listPages = () => [
    page("posts"),
    page("tags", "astro"),
    page("categories", "etc"),
    page("categories", "deep-dive", "architecture"),
  ];

  it("keeps each listing header before its post rows", () => {
    for (const file of listPages()) {
      const html = readFileSync(file, "utf-8");
      const header = html.indexOf("data-list-header");
      const list = html.indexOf("data-post-list");

      expect(header, file).toBeGreaterThanOrEqual(0);
      expect(list, file).toBeGreaterThan(header);
    }
  });

  it("keeps rendered pagination after the post list inside main content", () => {
    const main = mainContent(page("posts"));
    const list = main.indexOf("data-post-list");
    const pagination = main.indexOf("data-list-pagination");

    expect(list).toBeGreaterThanOrEqual(0);
    expect(pagination).toBeGreaterThan(list);
  });

  it("keeps multi-page navigation in the list flow with working post-page URLs", () => {
    const firstPage = page("posts");
    const secondPage = page("posts", "2");
    const firstNav = paginationNav(firstPage);
    const secondNav = paginationNav(secondPage);
    const iconHrefs = (nav: string) =>
      [
        ...nav.matchAll(
          /<a\b[^>]*href="([^"]+)"[^>]*>\s*<svg\b[\s\S]*?<\/svg>\s*<\/a>/g
        ),
      ].map(([, href]) => href);

    expect(existsSync(secondPage)).toBe(true);
    expect(firstNav).toBeDefined();
    expect(firstNav).toMatch(/<span\b[^>]*aria-current="page"[^>]*>01<\/span>/);
    expect(iconHrefs(firstNav!)).toEqual(["/posts/2"]);
    expect(secondNav).toBeDefined();
    expect(secondNav).toMatch(/<span\b[^>]*aria-current="page"[^>]*>02<\/span>/);
    expect(iconHrefs(secondNav!)).toEqual(["/posts/", "/posts/3"]);
  });

  it("omits pagination markup for a single-page listing", () => {
    const main = mainContent(page("tags", "astro"));

    expect(main).toContain("data-post-list");
    expect(main).not.toContain("data-list-pagination");
    expect(main).not.toMatch(/<nav\b[^>]*aria-label="Pagination Navigation"/);
  });

  it("does not render an empty description for a leaf category", () => {
    const html = readFileSync(
      page("categories", "deep-dive", "architecture"),
      "utf-8"
    );
    const header = html.match(
      /<header\b[^>]*data-list-header[^>]*>([\s\S]*?)<\/header>/
    )?.[1];

    expect(header).toBeDefined();
    expect(header).toMatch(/<h1\b/);
    expect(header).not.toMatch(/<p\b[^>]*>\s*<\/p>/);
  });
});

describe("home All posts action", () => {
  it("renders one direct post-list action after the home post sections", () => {
    const html = readFileSync(page(), "utf-8");
    const actions = [
      ...html.matchAll(
        /<a\b(?=[^>]*\bdata-all-posts\b)[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g
      ),
    ];

    expect(actions).toHaveLength(1);
    expect(actions[0][1]).toBe("/posts/");
    expect(html.indexOf("data-all-posts-region")).toBeGreaterThan(
      html.lastIndexOf("data-post-row")
    );
  });
});
