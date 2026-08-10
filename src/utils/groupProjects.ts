export type ProjectEntry = {
  data: {
    featured: boolean;
    order: number;
  };
};

export function groupProjects<T extends ProjectEntry>(projects: readonly T[]) {
  const byOrder = (a: T, b: T) => a.data.order - b.data.order;

  return {
    featured: projects
      .filter(project => project.data.featured)
      .toSorted(byOrder),
    other: projects.filter(project => !project.data.featured).toSorted(byOrder),
  };
}
