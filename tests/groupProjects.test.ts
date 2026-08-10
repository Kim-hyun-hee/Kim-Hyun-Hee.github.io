import { describe, expect, it } from "vitest";
import { groupProjects } from "@/utils/groupProjects";

type Project = {
  id: string;
  data: {
    title: string;
    featured: boolean;
    order: number;
  };
};

const project = (id: string, order: number, featured: boolean): Project => ({
  id,
  data: { title: id, order, featured },
});

describe("groupProjects", () => {
  it("featured 여부로 나누고 각 목록을 order 오름차순으로 정렬한다", () => {
    const result = groupProjects([
      project("other-second", 2, false),
      project("featured-first", 1, true),
      project("featured-third", 3, true),
      project("other-first", 0, false),
    ]);

    expect(result.featured.map(item => item.id)).toEqual([
      "featured-first",
      "featured-third",
    ]);
    expect(result.other.map(item => item.id)).toEqual([
      "other-first",
      "other-second",
    ]);
  });

  it("featured 프로젝트 수를 제한하지 않는다", () => {
    const projects = [1, 2, 3, 4, 5, 6].map(order =>
      project(`featured-${order}`, order, true)
    );

    expect(groupProjects(projects).featured).toHaveLength(6);
  });

  it("featured 프로젝트가 없어도 나머지 목록을 반환한다", () => {
    const result = groupProjects([
      project("later", 2, false),
      project("first", 1, false),
    ]);

    expect(result.featured).toEqual([]);
    expect(result.other.map(item => item.id)).toEqual(["first", "later"]);
  });

  it("입력 배열과 항목을 변경하지 않는다", () => {
    const projects = [
      project("second", 2, true),
      project("first", 1, true),
    ];
    const originalOrder = projects.map(item => item.id);
    const originalEntries = structuredClone(projects);

    groupProjects(projects);

    expect(projects.map(item => item.id)).toEqual(originalOrder);
    expect(projects).toEqual(originalEntries);
  });
});
