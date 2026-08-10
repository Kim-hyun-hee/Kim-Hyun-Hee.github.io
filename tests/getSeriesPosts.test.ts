import { describe, it, expect } from "vitest";
import { getSeriesPosts, getSeriesPosition } from "@/utils/getSeriesPosts";

const part = (
  id: string,
  seriesOrder: number,
  series = "building-this-blog"
) => ({
  id,
  data: { series, seriesOrder },
});

describe("getSeriesPosts", () => {
  it("seriesOrder 오름차순으로 정렬한다", () => {
    const posts = [part("c", 3), part("a", 1), part("b", 2)];
    expect(getSeriesPosts(posts, "building-this-blog").map(p => p.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("다른 시리즈의 글은 제외한다", () => {
    const posts = [part("a", 1), part("x", 1, "s2")];
    expect(getSeriesPosts(posts, "building-this-blog").map(p => p.id)).toEqual([
      "a",
    ]);
  });

  it("seriesOrder가 중복되면 예외를 던진다", () => {
    const posts = [part("a", 1), part("b", 1)];
    expect(() => getSeriesPosts(posts, "building-this-blog")).toThrow(
      /중복된 seriesOrder/
    );
  });

  it("예외 메시지에 중복된 번호가 들어간다", () => {
    const posts = [part("a", 2), part("b", 2)];
    expect(() => getSeriesPosts(posts, "building-this-blog")).toThrow(/2/);
  });
});

describe("getSeriesPosition", () => {
  const posts = [part("a", 1), part("b", 2), part("c", 3)];

  it("현재 위치와 전체 편 수를 반환한다", () => {
    const pos = getSeriesPosition(posts, "building-this-blog", 2);
    expect(pos.current).toBe(2);
    expect(pos.total).toBe(3);
  });

  it("이전/다음 편을 반환한다", () => {
    const pos = getSeriesPosition(posts, "building-this-blog", 2);
    expect(pos.prev?.id).toBe("a");
    expect(pos.next?.id).toBe("c");
  });

  it("첫 편의 prev는 null이다", () => {
    expect(getSeriesPosition(posts, "building-this-blog", 1).prev).toBeNull();
  });

  it("마지막 편의 next는 null이다", () => {
    expect(getSeriesPosition(posts, "building-this-blog", 3).next).toBeNull();
  });

  it("존재하지 않는 순번을 요청하면 current는 null이고 total은 유지된다", () => {
    const pos = getSeriesPosition(posts, "building-this-blog", 99);
    expect(pos.current).toBeNull();
    expect(pos.total).toBe(3);
    expect(pos.prev).toBeNull();
    expect(pos.next).toBeNull();
  });
});
