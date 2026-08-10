import { describe, it, expect } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import type { Page } from "astro";
import type { CollectionEntry } from "astro:content";
import Pagination from "@/components/Pagination.astro";
import { getPaginationItems, getPageBasePath } from "@/utils/pagination";

const paginationPage = (
  currentPage: number,
  lastPage: number
): Page<CollectionEntry<"posts">> =>
  ({
    data: [],
    start: (currentPage - 1) * 10,
    end: currentPage * 10 - 1,
    size: 10,
    total: lastPage * 10,
    currentPage,
    lastPage,
    url: {
      current: currentPage === 1 ? "/posts/" : `/posts/${currentPage}`,
      prev: currentPage > 1 ? `/posts/${currentPage - 1}` : undefined,
      next: currentPage < lastPage ? `/posts/${currentPage + 1}` : undefined,
      first: currentPage > 1 ? "/posts/" : undefined,
      last: currentPage < lastPage ? `/posts/${lastPage}` : undefined,
    },
  }) as Page<CollectionEntry<"posts">>;

const renderPagination = async (currentPage: number, lastPage: number) => {
  const container = await AstroContainer.create();

  return container.renderToString(Pagination, {
    props: { page: paginationPage(currentPage, lastPage) },
  });
};

describe("Pagination component", () => {
  it("marks the current first page as a non-link and hides unavailable previous control", async () => {
    const html = await renderPagination(1, 3);

    expect(html).toMatch(
      /<span\b[^>]*aria-current="page"[^>]*aria-label="Page 1, current page"[^>]*>\s*01\s*<\/span>/
    );
    expect(html).not.toMatch(
      /<a\b[^>]*href="\/posts\/"[^>]*>\s*01\s*<\/a>/
    );
    expect(html).toMatch(
      /<span\b[^>]*aria-hidden="true"[^>]*>\s*<svg[\s\S]*?<\/svg>\s*<\/span>/
    );
  });

  it("uses navigable first, middle, and last page URLs with localized labels", async () => {
    const html = await renderPagination(2, 3);

    expect(html).toMatch(/<a\b[^>]*href="\/posts\/"[^>]*aria-label="Go to previous page"/);
    expect(html).toMatch(/<a\b[^>]*href="\/posts\/3"[^>]*aria-label="Go to next page"/);
    expect(html).toMatch(/<a\b[^>]*href="\/posts\/"[^>]*aria-label="Go to page 1"[^>]*>\s*01\s*<\/a>/);
    expect(html).toMatch(/<span\b[^>]*aria-current="page"[^>]*>\s*02\s*<\/span>/);
    expect(html).toMatch(/<a\b[^>]*href="\/posts\/3"[^>]*aria-label="Go to page 3"[^>]*>\s*03\s*<\/a>/);
  });

  it("gives selectable numbered pages the selected-cell focus recipe", async () => {
    const html = await renderPagination(2, 3);
    const firstPageLink = html.match(
      /<a\b(?=[^>]*href="\/posts\/")(?=[^>]*aria-label="Go to page 1")[^>]*>/
    )?.[0];

    expect(firstPageLink).toContain("focus-visible:bg-accent-muted");
    expect(firstPageLink).toContain("focus-visible:text-accent");
    expect(firstPageLink).toContain("hover:bg-accent-muted");
    expect(firstPageLink).toContain("hover:text-accent");
  });

  it("hides unavailable next control on the last page", async () => {
    const html = await renderPagination(3, 3);

    expect(html).toMatch(
      /<span\b[^>]*aria-current="page"[^>]*>\s*03\s*<\/span>/
    );
    expect(html).toMatch(
      /<span\b[^>]*aria-hidden="true"[^>]*>\s*<svg[\s\S]*?<\/svg>\s*<\/span>\s*<\/nav>/
    );
  });
});

describe("getPaginationItems", () => {
  it("전체가 7페이지 이하면 전부 보여준다", () => {
    expect(getPaginationItems(1, 1)).toEqual([1]);
    expect(getPaginationItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("앞쪽에 있으면 뒤를 접는다", () => {
    expect(getPaginationItems(1, 20)).toEqual([1, 2, 3, 4, 5, "dots", 20]);
    expect(getPaginationItems(3, 20)).toEqual([1, 2, 3, 4, 5, "dots", 20]);
  });

  it("뒤쪽에 있으면 앞을 접는다", () => {
    expect(getPaginationItems(20, 20)).toEqual([
      1,
      "dots",
      16,
      17,
      18,
      19,
      20,
    ]);
  });

  it("가운데면 양쪽을 접는다", () => {
    expect(getPaginationItems(10, 20)).toEqual([
      1,
      "dots",
      9,
      10,
      11,
      "dots",
      20,
    ]);
  });

  it("항상 7칸을 넘지 않는다", () => {
    for (let last = 1; last <= 30; last++) {
      for (let cur = 1; cur <= last; cur++) {
        expect(getPaginationItems(cur, last).length).toBeLessThanOrEqual(7);
      }
    }
  });

  it("현재 페이지를 항상 포함한다", () => {
    for (let last = 1; last <= 30; last++) {
      for (let cur = 1; cur <= last; cur++) {
        expect(getPaginationItems(cur, last)).toContain(cur);
      }
    }
  });

  it("첫 페이지와 마지막 페이지를 항상 포함한다", () => {
    for (let last = 1; last <= 30; last++) {
      for (let cur = 1; cur <= last; cur++) {
        const items = getPaginationItems(cur, last);
        expect(items).toContain(1);
        expect(items).toContain(last);
      }
    }
  });
});

describe("getPageBasePath", () => {
  it("1페이지 주소에서는 그대로 돌려준다", () => {
    expect(getPageBasePath("/posts/", 1)).toBe("/posts");
    expect(getPageBasePath("/categories/etc/", 1)).toBe("/categories/etc");
  });

  it("2페이지 이후 주소에서는 번호를 떼어낸다", () => {
    expect(getPageBasePath("/posts/2", 2)).toBe("/posts");
    expect(getPageBasePath("/categories/etc/3/", 3)).toBe("/categories/etc");
    expect(getPageBasePath("/tags/unity/10", 10)).toBe("/tags/unity");
  });

  it("경로에 숫자가 들어 있어도 페이지 번호만 떼어낸다", () => {
    expect(getPageBasePath("/categories/2024-notes/2", 2)).toBe(
      "/categories/2024-notes"
    );
    expect(getPageBasePath("/categories/2024-notes/", 1)).toBe(
      "/categories/2024-notes"
    );
  });
});
