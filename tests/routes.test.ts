import { describe, it, expect, beforeAll } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, sep } from "node:path";
import { CATEGORY_IDS, getSubcategoryIds } from "@/categories";
import { SERIES_IDS } from "@/series";

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
});

describe("껍데기", () => {
  const home = () => readFileSync(page(), "utf-8");

  it("contains one localized skip link before the main content target", () => {
    const html = home();
    const skipLinks = [
      ...html.matchAll(
        /<body\b[^>]*>\s*<a\b[^>]*href="#main-content"[^>]*>([\s\S]*?)<\/a>/g
      ),
    ];

    expect(skipLinks).toHaveLength(1);
    expect(skipLinks[0][1].replace(/<[^>]+>/g, "").trim()).toBe(
      "본문으로 건너뛰기"
    );
    expect(skipLinks[0].index).toBeLessThan(html.indexOf('id="main-content"'));
  });

  it("사이드바가 렌더된다", () => {
    expect(home()).toContain('id="site-sidebar"');
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
