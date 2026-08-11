import { describe, it, expect, beforeAll } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, sep } from "node:path";
import { CATEGORY_IDS, getSubcategoryIds } from "@/categories";
import { SERIES_IDS } from "@/series";
import { useTranslations } from "@/i18n";
import { transformerFileName } from "../src/utils/transformers/fileName";
import siteConfig from "../astro-paper.config";

const DIST = "dist";
const PROJECTS = join("src", "content", "projects");

beforeAll(() => {
  if (!existsSync(DIST)) {
    throw new Error("dist/가 없습니다. 먼저 `pnpm build`를 실행하세요.");
  }
});

const page = (...segments: string[]) =>
  join(DIST, ...segments, "index.html");

const projectRecords = () =>
  readdirSync(PROJECTS, { recursive: true, encoding: "utf8" })
    .filter(filename => /\.(?:md|mdx)$/i.test(filename))
    .map(filename => {
      const source = readFileSync(join(PROJECTS, filename), "utf-8");
      const frontmatter =
        source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";

      return {
        id: filename.replaceAll(sep, "/").replace(/\.(?:md|mdx)$/i, ""),
        featured: /^featured:\s*true\s*$/m.test(frontmatter),
        order: Number(frontmatter.match(/^order:\s*(\d+)\s*$/m)?.[1]),
      };
    });

/**
 * dist/ 아래 모든 index.html뿐 아니라 모든 *.html을 재귀적으로 찾는다.
 * pagefind 산출물(dist/pagefind/**)은 우리가 만든 페이지가 아니므로 제외한다.
 */
const listHtmlFiles = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith(".html"))
    .map(entry => join(entry.parentPath, entry.name))
    .filter(file => !file.split(sep).includes("pagefind"));

const builtStyles = () =>
  readdirSync(join(DIST, "_astro"), { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith(".css"))
    .map(entry => readFileSync(join(entry.parentPath, entry.name), "utf-8"))
    .join("");

const builtScripts = () =>
  readdirSync(join(DIST, "_astro"), { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith(".js"))
    .map(entry => readFileSync(join(entry.parentPath, entry.name), "utf-8"))
    .join("");

const readHtml = (file: string) => readFileSync(file, "utf-8");
const hasPostRows = (file: string) => readHtml(file).includes("data-post-row");
const hasListFlow = (file: string) => {
  const html = readHtml(file);
  return html.includes("data-list-header") && html.includes("data-post-list");
};

const findBuiltPage = (
  files: string[],
  matches: (file: string) => boolean,
  label: string
) => {
  const file = files.find(matches);

  expect(file, label).toBeDefined();
  return file!;
};

const tagListing = () =>
  findBuiltPage(
    listHtmlFiles(join(DIST, "tags")),
    file => file !== page("tags") && hasPostRows(file),
    "at least one built tag listing with post rows"
  );

const directCategoryListing = () =>
  findBuiltPage(
    CATEGORY_IDS.map(id => page("categories", id)).filter(existsSync),
    file => hasListFlow(file) && hasPostRows(file),
    "at least one direct category listing with post rows"
  );

const leafCategoryListing = () =>
  findBuiltPage(
    CATEGORY_IDS.flatMap(category =>
      getSubcategoryIds(category).map(subcategory =>
        page("categories", category, subcategory)
      )
    ).filter(existsSync),
    file => hasListFlow(file) && hasPostRows(file),
    "at least one leaf category listing with post rows"
  );

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

  it("Deep Dive 테스트 글이 소분류별 개수와 페이지네이션을 채운다", () => {
    const expected = {
      rendering: 13,
      architecture: 10,
      memory: 10,
    } as const;

    for (const [subcategory, count] of Object.entries(expected)) {
      const files = [
        page("categories", "deep-dive", subcategory),
        page("categories", "deep-dive", subcategory, "2"),
      ];
      files.forEach(file => expect(existsSync(file), file).toBe(true));
      const html = files.map(readHtml).join("");
      const rows = [
        ...html.matchAll(/<li\b[^>]*data-post-row[^>]*>([\s\S]*?)<\/li>/g),
      ];
      const testRows = rows.filter(([, row]) => row.includes("[테스트]"));

      expect(rows).toHaveLength(count);
      expect(testRows).toHaveLength(10);
      testRows.forEach(([, row]) => {
        expect(row).toContain("data-default-post-thumbnail");
        expect(row).toContain(`Deep Dive &gt; ${
          subcategory === "rendering"
            ? "Rendering"
            : subcategory === "architecture"
              ? "Architecture"
              : "Memory"
        }`);
      });
    }
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
      const summary = markup.match(/<summary\b[^>]*>/)?.[0];
      expect(summary).toContain(
        "hover:bg-[linear-gradient(90deg,var(--accent-muted),transparent)]"
      );
      expect(summary).toContain(
        "focus-visible:bg-[linear-gradient(90deg,var(--accent-muted),transparent)]"
      );
      if (/href="\/posts\//.test(markup)) {
        expect(markup).toMatch(/>\s*01\s*</);
        const rows = [
          ...markup.matchAll(/<a\b[^>]*href="\/posts\/[^"]+"[^>]*>([\s\S]*?)<\/a>/g),
        ];
        expect(rows.length).toBeGreaterThan(0);
        rows.forEach(([, row]) => {
          expect(row).toMatch(
            /data-series-post-date[\s\S]*?<time\b[^>]*>\s*\d{4}\.\d{2}\.\d{2}\s*<\/time>/
          );
        });
      } else {
        expect(markup).toContain("아직 글이 없습니다.");
      }
    });
    for (const id of SERIES_IDS) {
      expect(html).toContain(`href="/series/${id}/"`);
    }
  });

  it("시리즈 상세 목록도 각 글의 전체 날짜를 렌더한다", () => {
    for (const id of SERIES_IDS) {
      const html = readFileSync(page("series", id), "utf-8");
      const rows = [
        ...html.matchAll(/<a\b[^>]*href="\/posts\/[^"]+"[^>]*>([\s\S]*?)<\/a>/g),
      ];

      rows.forEach(([, row]) => {
        expect(row).toMatch(
          /data-series-post-date[\s\S]*?<time\b[^>]*>\s*\d{4}\.\d{2}\.\d{2}\s*<\/time>/
        );
      });
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

describe("About projects", () => {
  const about = () => readFileSync(page("about"), "utf-8");

  it("renders Markdown prose before the collection-backed projects section", () => {
    const html = about();
    const prose = html.indexOf("data-about-prose");
    const projects = html.indexOf('id="projects"');
    const records = projectRecords();

    expect(prose).toBeGreaterThanOrEqual(0);
    expect(projects).toBeGreaterThan(prose);
    expect(html.match(/data-featured-project/g)).toHaveLength(
      records.filter(record => record.featured).length
    );
    expect(html.match(/data-project-row/g)).toHaveLength(
      records.filter(record => !record.featured).length
    );
  });

  it("renders every project once with unique ordered h3 headings", () => {
    const html = about();
    const projects = html.slice(html.indexOf('<section id="projects"'));
    const records = projectRecords();
    const byOrder = (a: (typeof records)[number], b: (typeof records)[number]) =>
      a.order - b.order;
    const expectedHeadingIds = [
      ...records.filter(record => record.featured).sort(byOrder),
      ...records.filter(record => !record.featured).sort(byOrder),
    ].map(record => `project-${record.id}`);
    const markerHeadingIds = [
      ...projects.matchAll(
        /<(?:article|li)\b(?=[^>]*\bdata-(?:featured-project|project-row)\b)(?=[^>]*\baria-labelledby="([^"]+)")[^>]*>/g
      ),
    ].map(([, id]) => id);
    const headings = [
      ...projects.matchAll(/<h3\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h3>/g),
    ];
    const headingIds = headings.map(([, id]) => id);

    expect(records.length).toBeGreaterThan(0);
    expect(markerHeadingIds).toEqual(expectedHeadingIds);
    expect(headingIds).toEqual(expectedHeadingIds);
    expect(new Set(headingIds)).toHaveLength(records.length);
    for (const [, , heading] of headings) {
      expect(heading.replace(/<[^>]+>/g, "").trim()).not.toBe("");
    }
  });

  it("uses a valid heading outline for project records", () => {
    const html = about();
    const projects = html.slice(html.indexOf('<section id="projects"'));

    expect(html).toMatch(/<h1\b[^>]*>About<\/h1>/);
    expect(projects).toMatch(/<h2\b[^>]*>Projects<\/h2>/);
    expect(projects.match(/<h3\b/g)).toHaveLength(projectRecords().length);
  });

  it("links the quiet profile action to the configured GitHub and omits email", () => {
    const html = about();
    const github =
      siteConfig.socials?.find(
        social => social.name.toLowerCase() === "github"
      )?.url ?? siteConfig.site.profile;
    const profileAction = html.match(
      /<a\b(?=[^>]*data-about-profile)[^>]*>/
    )?.[0];

    expect(github).toBeDefined();
    expect(profileAction).toContain(`href="${github}"`);
    expect(profileAction).toContain(
      `aria-label="${siteConfig.site.author}의 GitHub 프로필 보기"`
    );
    expect(html).not.toMatch(/href="mailto:/i);
    expect(html).not.toContain(">Contact<");
  });
});

describe("post title transitions", () => {
  it("does not give post list or article headings a view-transition name", () => {
    const list = readFileSync(page("posts"), "utf-8");
    const firstPost = list.match(
      /<a\b(?=[^>]*href="(?<href>\/posts\/[^"]+\/)")[^>]*>[\s\S]*?(?<heading><h[23]\b[^>]*>)/
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
    return [
      { file: page(), heading: "h3" },
      { file: page("posts"), heading: "h2" },
      { file: tagListing(), heading: "h2" },
      { file: directCategoryListing(), heading: "h2" },
      { file: leafCategoryListing(), heading: "h2" },
      { file: page("archives"), heading: "h4" },
    ];
  };

  it("renders the thumbnail-first whole-link row in every shared consumer", () => {
    for (const { file, heading } of representativeLists()) {
      const html = readFileSync(file, "utf-8");
      const rows = [
        ...html.matchAll(
          /<li\b(?=[^>]*\bdata-post-row\b)([^>]*)>([\s\S]*?)<\/li>/g
        ),
      ];

      expect(rows.length, file).toBeGreaterThan(0);
      for (const [, attributes, row] of rows) {
        const thumbnail = row.indexOf("data-post-thumbnail");
        const title = row.indexOf(`<${heading}`);
        const date = row.search(
          /<time\b[^>]*datetime="[^"]+"[^>]*>\s*\d{4}\.\d{2}\.\d{2}\s*<\/time>/
        );
        const taxonomy = row.indexOf("data-post-taxonomy");
        const description = row.lastIndexOf("<p");
        const links = [
          ...row.matchAll(/<a\b[^>]*href="(\/posts\/[^"]+)"/g),
        ];

        expect(thumbnail, file).toBeGreaterThanOrEqual(0);
        expect(title, file).toBeGreaterThan(thumbnail);
        expect(date, file).toBeGreaterThan(title);
        expect(links, file).toHaveLength(1);
        expect([...row.matchAll(/data-post-taxonomy/g)].length, file).toBeLessThanOrEqual(1);
        expect(description, file).toBeGreaterThan(
          taxonomy >= 0 ? taxonomy : date
        );
        expect(row, file).toContain("data-post-meta");
        expect(row, file).toContain("data-post-link");
        expect(row, file).toContain(
          "hover:bg-[linear-gradient(90deg,var(--accent-muted),transparent)]"
        );
        expect(row, file).not.toMatch(/min read|minute|분 읽기/i);
        expect(attributes, file).toContain("border-b-border");
      }
    }
  });

  it("shows parent and child taxonomy together on a Deep Dive row", () => {
    const html = readFileSync(leafCategoryListing(), "utf-8");
    const row = [
      ...html.matchAll(
        /<li\b[^>]*data-post-row[^>]*>([\s\S]*?)<\/li>/g
      ),
    ].find(([, markup]) => markup.includes("data-post-taxonomy"))?.[1];

    expect(row).toBeDefined();
    expect(row).toMatch(
      /Deep Dive\s*&gt;\s*(Rendering|Architecture|Memory)/
    );
  });

  it("keeps the post-header date in the default long format", () => {
    const list = readFileSync(page("posts"), "utf-8");
    const href = list.match(/href="(\/posts\/[^"]+\/)"/)?.[1];

    expect(href).toBeDefined();
    const article = readFileSync(
      join(DIST, href!.replace(/^\/|\/$/g, ""), "index.html"),
      "utf-8"
    );
    const header = [
      ...article.matchAll(/<header\b[^>]*>([\s\S]*?)<\/header>/g),
    ].find(([, markup]) => markup.includes("<h1"))?.[1];

    expect(header).toMatch(
      /<time\b[^>]*>\s*\d{4}년 \d{1,2}월 \d{1,2}일\s*<\/time>/
    );
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
    tagListing(),
    directCategoryListing(),
    leafCategoryListing(),
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

  it("does not render an empty description for a leaf category", () => {
    const html = readHtml(leafCategoryListing());
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

describe("Archives", () => {
  const archive = () => readFileSync(page("archives"), "utf-8");

  it("shows a text-only English Archives link in every supported locale", () => {
    const sidebar = archive().match(
      /<aside\b[^>]*id="site-sidebar"[^>]*>([\s\S]*?)<\/aside>/
    )?.[1];
    const archivesLink = sidebar?.match(
      /<a\b(?=[^>]*href="\/archives\/")[^>]*>([\s\S]*?)<\/a>/
    );

    expect(useTranslations("ko").nav.archives).toBe("Archives");
    expect(useTranslations("en").nav.archives).toBe("Archives");
    expect(archivesLink?.[1].replace(/<[^>]+>/g, "").trim()).toBe(
      "Archives"
    );
    expect(archivesLink?.[0]).toContain('aria-current="page"');
    expect(archivesLink?.[1]).not.toMatch(/<svg\b/);
  });

  it("groups real archive rows by descending year and month with matching totals", () => {
    const html = archive();
    const yearMatches = [
      ...html.matchAll(
        /<section\b(?=[^>]*\bdata-archive-year="(\d{4})")(?=[^>]*\bdata-post-count="(\d+)")[^>]*>/g
      ),
    ];
    const years = yearMatches.map((match, index) => ({
      year: match[1],
      count: Number(match[2]),
      markup: html.slice(
        match.index,
        yearMatches[index + 1]?.index ?? html.length
      ),
    }));
    const months = [
      ...html.matchAll(
        /<section\b(?=[^>]*\bdata-archive-parent-year="(\d{4})")(?=[^>]*\bdata-archive-month="(\d{1,2})")(?=[^>]*\bdata-post-count="(\d+)")[^>]*>([\s\S]*?)<\/section>/g
      ),
    ].map(([, year, month, count, markup]) => ({
      year,
      month: Number(month),
      count: Number(count),
      markup,
    }));

    expect(years.length).toBeGreaterThan(0);
    expect(months.length).toBeGreaterThan(0);
    expect(html).toMatch(/<h1\b/);
    expect(html).toMatch(
      /data-archive-year-header[^>]*class="[^"]*border-t-accent[^"]*border-t-2/
    );
    expect(html).not.toMatch(
      /data-archive-year-header[^>]*class="[^"]*\bbg-/
    );
    expect(years.map(({ year }) => Number(year))).toEqual(
      [...years.map(({ year }) => Number(year))].sort((a, b) => b - a)
    );

    for (const year of years) {
      const yearMonths = months.filter(month => month.year === year.year);
      const yearHeader = year.markup.slice(
        0,
        year.markup.indexOf("data-archive-parent-year")
      );
      const yearCountText = yearHeader.match(
        /<p\b(?=[^>]*\bdata-post-count\b)[^>]*>([^<]+)<\/p>/
      )?.[1];

      expect(yearMonths.length, year.year).toBeGreaterThan(0);
      expect(yearHeader).toMatch(
        new RegExp(`<h2\\b[^>]*>\\s*${year.year}\\s*<\\/h2>`)
      );
      expect(yearCountText).toContain(String(year.count));
      expect(yearCountText?.trim()).not.toBe(String(year.count));
      expect(yearMonths.map(({ month }) => month)).toEqual(
        [...yearMonths.map(({ month }) => month)].sort((a, b) => b - a)
      );
      expect(year.count).toBe(
        yearMonths.reduce((total, month) => total + month.count, 0)
      );
    }

    for (const month of months) {
      expect(month.markup).toMatch(/<h3\b/);
      expect(
        month.markup.match(/<li\b(?=[^>]*\bdata-post-row\b)[^>]*>/g)
          ?.length
      ).toBe(month.count);
      expect(month.markup).toMatch(/<h4\b[\s\S]*?<time\b/);
      const countText = month.markup.match(
        /<p\b(?=[^>]*\bdata-post-count\b)[^>]*>([^<]+)<\/p>/
      )?.[1];

      expect(countText).toContain(String(month.count));
      expect(countText?.trim()).not.toBe(String(month.count));
    }
  });
});

describe("dark site color tokens", () => {
  it("keeps the approved light tokens and emits the Horizon dark accent family", () => {
    const css = builtStyles();
    const light = css.match(/:root,\[data-theme=light\]\{([^}]*)\}/)?.[1] ?? "";
    const dark = css.match(/\[data-theme=dark\]\{([^}]*)\}/)?.[1] ?? "";

    expect(light).toContain("--accent:#8387d3");
    expect(light).toContain("--sky:#8fb4dd");
    expect(dark).toContain("--accent:#e58d7d");
    expect(dark).toContain("--sky:#efb993");
    expect(dark).toContain("--accent-foreground:#1c1e26");
    expect(dark).toContain("--accent-muted:#302321");
    expect(dark).toContain("--sky-muted:#302820");
  });
});

describe("markdown elements", () => {
  const specimen = () =>
    readFileSync(
      page("posts", "customizing-astropaper-theme-color-schemes"),
      "utf-8"
    );
  const prose = (html: string) =>
    html.match(/<article\b(?=[^>]*\bapp-prose\b)[^>]*>([\s\S]*?)<\/article>/)?.[1] ??
    "";

  it("keeps a rich Markdown specimen semantic while emitting the restrained prose styles", () => {
    const html = specimen();
    const article = prose(html);
    const css = builtStyles();

    expect(article).toMatch(/<h2\b[^>]*\bid="[^"]+"[^>]*>/);
    expect(article).toMatch(/<a\b[^>]*href="https?:\/\/[^\"]+"[^>]*>/);
    expect(article).toMatch(/<blockquote\b[^>]*>/);
    expect(article).toMatch(/<div\b[^>]*\bdata-responsive-table[^>]*>/);
    expect(article).toMatch(/<table\b[^>]*>/);
    expect(article).not.toMatch(/\bheading-link\b/);

    expect(css).toMatch(
      /\.app-prose a\{(?=[^}]*color:inherit)(?=[^}]*text-decoration-color:var\(--accent\))/
    );
    expect(css).toMatch(
      /\.app-prose a:focus-visible\{(?=[^}]*outline-width:2px)(?=[^}]*outline-color:var\(--accent\))/
    );
    expect(css).toMatch(
      /\.app-prose \[data-responsive-table\],\.app-prose \[data-markdown-table\]\{(?=[^}]*border-radius:)(?=[^}]*border[^}]*width:1px)/
    );
    expect(css).toMatch(
      /\.app-prose table (?:th|td),\.app-prose table (?:th|td)\{[^}]*border[^}]*width:0/
    );
    expect(css).toMatch(
      /(?:^|})table\{(?=[^}]*border-collapse:collapse)/
    );
    expect(css).not.toMatch(
      /\.app-prose table\{[^}]*border-collapse:separate/
    );
    expect(css).toMatch(
      /\.app-prose table tbody tr:not\(:last-child\)\{(?=[^}]*border-bottom-width:1px)(?=[^}]*border-color:var\(--border\))/
    );
  });

  it("wraps raw Markdown tables without changing native table display semantics", () => {
    const defaultResponsive = prose(
      readFileSync(page("posts", "how-to-configure-astropaper-theme"), "utf-8")
    );
    const rawMarkdown = prose(readFileSync(page("posts", "astro-paper-2"), "utf-8"));
    const css = builtStyles();

    expect(defaultResponsive).toMatch(
      /<div\b(?=[^>]*\bdata-responsive-table\b)[^>]*>[\s\S]*?<table\b/
    );
    expect(defaultResponsive).not.toMatch(/\bdata-markdown-table\b/);
    expect(rawMarkdown).toMatch(
      /<div\b(?=[^>]*\bdata-markdown-table\b)[^>]*>\s*<table\b/
    );
    expect(rawMarkdown).not.toMatch(/\bdata-responsive-table\b/);
    expect(css).toMatch(
      /\.app-prose \[data-responsive-table\],\.app-prose \[data-markdown-table\]\{(?=[^}]*border-radius:)(?=[^}]*border[^}]*width:1px)/
    );
    expect(css).toMatch(
      /\.app-prose \[data-markdown-table\]\{[^}]*overflow-x:auto/
    );
    expect(css).not.toMatch(
      /\.app-prose(?:>| )table\{[^}]*(?:display:block|overflow-x:auto)/
    );
  });
});

describe("callouts", () => {
  it("keeps plugin callout markup while applying centered local overrides", () => {
    const html = readFileSync(
      page("posts", "adding-new-posts-in-astropaper-theme"),
      "utf-8"
    );
    const css = builtStyles();

    expect(html).toMatch(
      /<div\b(?=[^>]*\bclass="callout")(?=[^>]*\bdata-callout="note")(?=[^>]*\bdata-collapsible="false")[^>]*>[\s\S]*?<div class="callout-title">[\s\S]*?<div class="callout-title-text">/
    );
    expect(html).toMatch(
      /<details\b(?=[^>]*\bclass="callout")(?=[^>]*\bdata-collapsible="true")[^>]*>[\s\S]*?<summary class="callout-title">[\s\S]*?<div class="callout-fold-icon"/
    );

    expect(css).toMatch(
      /\.callout\{(?=[^}]*padding:14px 16px)(?=[^}]*border-radius:8px)(?=[^}]*line-height:1\.55)/
    );
    expect(css).toMatch(
      /\.callout-title\{(?=[^}]*min-height:20px)(?=[^}]*align-items:center)(?=[^}]*gap:7px)(?=[^}]*line-height:1\.4)/
    );
    expect(css).toMatch(/\.callout-title-text\{[^}]*margin:0/);
    expect(css).toMatch(
      /\.callout-fold-icon\{(?=[^}]*display:flex)(?=[^}]*align-items:center)/
    );
    expect(css).toMatch(
      /\.callout-content\{(?=[^}]*margin-top:7px)(?=[^}]*padding-inline-start:25px)/
    );
    expect(css).toMatch(
      /\.callout-content>:first-child\{[^}]*margin-top:0/
    );
    expect(css).toMatch(
      /\.callout-content>:last-child\{[^}]*margin-bottom:0/
    );
  });
});

describe("code blocks", () => {
  it("keeps each frame header before its code and marks filename-less frames decorative", () => {
    const html = readFileSync(
      page("posts", "adding-new-posts-in-astropaper-theme"),
      "utf-8"
    );
    const css = builtStyles();
    const codeBlock = (language: string) =>
      [...html.matchAll(/<pre\b[^>]*>[\s\S]*?<\/pre>/g)].find(block =>
        block[0].includes(`data-language="${language}"`)
      )?.[0] ?? "";

    const named = codeBlock("ts");
    const unnamed = codeBlock("bash");

    expect(named).toMatch(
      /^<pre\b[^>]*><span class="code-frame-header"><span class="code-frame-light code-frame-light-red" aria-hidden="true"><\/span><span class="code-frame-light code-frame-light-yellow" aria-hidden="true"><\/span><span class="code-frame-light code-frame-light-green" aria-hidden="true"><\/span><span class="code-frame-title">src\/content\.config\.ts<\/span><\/span><code>/
    );
    expect(unnamed).toMatch(
      /^<pre\b[^>]*><span class="code-frame-header"><span class="code-frame-light code-frame-light-red" aria-hidden="true"><\/span><span class="code-frame-light code-frame-light-yellow" aria-hidden="true"><\/span><span class="code-frame-light code-frame-light-green" aria-hidden="true"><\/span><\/span><code>/
    );
    expect((named.match(/class="code-frame-header"/g) ?? []).length).toBe(1);
    expect((named.match(/class="code-frame-light /g) ?? []).length).toBe(3);
    expect((named.match(/class="code-frame-title"/g) ?? []).length).toBe(1);
    expect((unnamed.match(/class="code-frame-header"/g) ?? []).length).toBe(1);
    expect((unnamed.match(/class="code-frame-light /g) ?? []).length).toBe(3);
    expect((unnamed.match(/class="code-frame-title"/g) ?? []).length).toBe(0);
    const blocks = [...html.matchAll(/<pre\b[^>]*class="[^"]*astro-code[^"]*"[^>]*>/g)];
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.every(([pre]) => /\bdata-language="[^"]+"/.test(pre))).toBe(
      true
    );
    expect(builtScripts()).toContain("copy-code");
    expect(html).not.toMatch(/\bline-number\b/);
    expect(css).not.toMatch(/counter-(?:reset|increment)/);
    expect(css).toMatch(/\.code-frame-light-red\{[^}]*background-color:#f5655b/);
    expect(css).toMatch(
      /\.code-frame-light-yellow\{[^}]*background-color:#f6bd3b/
    );
    expect(css).toMatch(
      /\.code-frame-light-green\{[^}]*background-color:#43c645/
    );
  });

  it("keeps both-axis scrolling inside the adaptive 550px frame", () => {
    const css = builtStyles();
    const scrollportRule = css.match(/\.astro-code>code\{[^}]*\}/)?.[0];

    expect(css).toMatch(
      /\.astro-code\{(?=[^}]*overflow:hidden!important)(?=[^}]*padding:0)/
    );
    expect(css).toMatch(
      /\.astro-code\{[^}]*background-color:var\(--shiki-light-bg\)/
    );
    expect(css).toMatch(
      /\.astro-code>code\{(?=[^}]*display:block)(?=[^}]*max-height:550px)(?=[^}]*padding:11px 13px 8px)(?=[^}]*overflow:auto)/
    );
    expect(css).toMatch(
      /html\[data-theme=dark\] \.astro-code\{(?=[^}]*background-color:var\(--shiki-dark-bg\))/
    );
    expect(css).toMatch(
      /\.astro-code>code::-webkit-scrollbar\{(?=[^}]*width:15px)(?=[^}]*height:15px)/
    );
    expect(css).toMatch(
      /\.astro-code>code::-webkit-scrollbar-thumb\{(?=[^}]*background:linear-gradient\(135deg,#3a9da5,#a97ac0,#dd6577,#d39a78\))(?=[^}]*border:5px solid #fafafa)(?=[^}]*border-radius:10px)/
    );
    expect(css).toMatch(
      /\.astro-code>code::-webkit-scrollbar-thumb:horizontal\{[^}]*linear-gradient\(90deg,#3a9da5,#a97ac0,#dd6577,#d39a78\)/
    );
    expect(css).toMatch(
      /\.astro-code>code::-webkit-scrollbar-thumb:vertical\{[^}]*linear-gradient\(#3a9da5,#a97ac0,#dd6577,#d39a78\)/
    );
    expect(css).toMatch(
      /\[data-theme=dark\] \.astro-code>code::-webkit-scrollbar-thumb\{[^}]*border-color:#1f1f20/
    );
    expect(css).toMatch(
      /::-webkit-scrollbar-button\{(?=[^}]*width:0)(?=[^}]*height:0)(?=[^}]*display:none)/
    );
    expect(css).toMatch(/::-webkit-scrollbar-track\{[^}]*background:0 0/);
    expect(css).toMatch(/::-webkit-scrollbar-corner\{[^}]*background:0 0/);
    expect(scrollportRule).toBeDefined();
    expect(scrollportRule).toContain("scrollbar-color:auto");
    expect(css).toMatch(
      /\.astro-code>code:focus-visible\{(?=[^}]*outline[^}]*var\(--accent\))/
    );
    expect(css).toMatch(
      /\.astro-code\{(?=[^}]*border-color:#dedede)(?=[^}]*border-radius:10px)(?=[^}]*background-color:var\(--shiki-light-bg\))(?=[^}]*box-shadow:0 8px 24px)/
    );
    expect(css).toMatch(
      /html\[data-theme=dark\] \.astro-code\{(?=[^}]*border-color:#3a3a3d)(?=[^}]*background-color:var\(--shiki-dark-bg\))(?=[^}]*box-shadow:0 8px 24px)/
    );
    expect(css).toMatch(
      /\.code-frame-header\{(?=[^}]*height:38px)(?=[^}]*position:relative)(?=[^}]*background-color:#f0f0f1)/
    );
    expect(css).toMatch(
      /html\[data-theme=dark\] \.code-frame-header\{(?=[^}]*border-color:#343436)(?=[^}]*background-color:#272729)/
    );
    expect(css).toMatch(/\.code-frame-light\{[^}]*width:10px[^}]*height:10px/);
    expect(css).toMatch(/\.astro-code \.code-frame-title\{[^}]*font-size:11px/);
    expect(css).not.toMatch(/\.astro-code>code\{[^}]*margin-bottom:/);
    expect(css).toMatch(
      /\.astro-code>code \.line:hover\{[^}]*background-color:#eeeeef/
    );
    expect(css).toMatch(
      /html\[data-theme=dark\] \.astro-code>code \.line:hover\{[^}]*background-color:#29292b/
    );
    expect(css).toMatch(
      /\.astro-code:after\{(?=[^}]*content:attr\(data-language\))(?=[^}]*height:23px)(?=[^}]*color:#8387d3)(?=[^}]*font-size:11px)/
    );
    expect(css).toMatch(
      /html\[data-theme=dark\] \.astro-code:after\{[^}]*color:#e58d7d/
    );
  });

  it("reserves a clipped filename lane beside copy control at narrow widths", () => {
    const html = readFileSync(
      page("posts", "adding-new-posts-in-astropaper-theme"),
      "utf-8"
    );
    const css = builtStyles();

    expect(html).toContain("src/content/posts/sample-post.md");
    expect(css).toMatch(
      /\.astro-code \.code-frame-title\{(?=[^}]*min-width:0)(?=[^}]*white-space:nowrap)(?=[^}]*overflow:hidden)(?=[^}]*text-overflow:ellipsis)/
    );
  });

  it("does not duplicate a frame when the filename transformer is reapplied", () => {
    type FrameNode = {
      type: string;
      tagName: string;
      properties: { class?: string[] };
      children: FrameNode[];
    };
    const node: { properties: Record<string, string>; children: FrameNode[] } = {
      properties: {},
      children: [
        {
          type: "element",
          tagName: "code",
          properties: {},
          children: [],
        },
      ],
    };
    const transformer = transformerFileName();
    const context = {
      options: { meta: { __raw: 'file="src/content/posts/sample-post.md"' } },
      addClassToHast: () => {},
    };

    transformer.pre.call(context, node);
    transformer.pre.call(context, node);

    const header = node.children.filter(
      child => child.properties.class?.[0] === "code-frame-header"
    );
    const title = header[0]?.children.filter(
      child => child.properties.class?.[0] === "code-frame-title"
    );

    expect(header).toHaveLength(1);
    expect(header[0]?.children).toHaveLength(4);
    expect(title).toHaveLength(1);
  });
});
