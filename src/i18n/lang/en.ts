import type { UIStrings } from "../types";

export default {
  nav: {
    posts: "Posts",
    allByCategory: "All posts",
    tags: "Tags",
    about: "About",
    archives: "Archives",
    search: "Search",
    categories: "Categories",
    series: "Series",
  },
  post: {
    publishedAt: "Published at",
    backToTop: "Back to top",
    goBack: "Go back",
    previousPost: "Previous Post",
    nextPost: "Next Post",
  },
  bar: {
    allPosts: "All posts",
    category: "Category: {{name}}",
    postsIn: "Posts in {{name}}",
    series: "Series: {{name}}",
    tag: "Tagged {{name}}",
  },
  home: {
    featured: "Featured",
    recentPosts: "Recent Posts",
    allPosts: "All Posts",
  },
  footer: {
    copyright: "Copyright",
    allRightsReserved: "All rights reserved.",
  },
  pages: {
    tagTitle: "Tag",
    tagDesc: "All the articles with the tag",

    tagsTitle: "Tags",
    tagsDesc: "All the tags used in posts.",

    postsTitle: "Posts",
    postsDesc: "All the articles I've posted.",

    archivesTitle: "Archives",
    archivesDesc: "All the articles I've archived.",

    searchTitle: "Search",
    searchDesc: "Search any article ...",
  },
  a11y: {
    skipToContent: "Skip to content",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    toggleTheme: "Toggle theme",
    toggleSubcategories: "Toggle subcategories",
    searchPlaceholder: "Search posts...",
    noResults: "No results found",
    goToPreviousPage: "Go to previous page",
    goToNextPage: "Go to next page",
    paginationGoTo: "Go to page {{page}}",
    paginationCurrent: "Page {{page}}, current page",
  },
  category: {
    desc: "Posts grouped by category.",
    seeMore: "See more",
    postCount: "{{count}} posts",
    otherPosts: "More in '{{label}}'",
  },
  series: {
    title: "Series",
    desc: "Multi-part writeups.",
    badge: "Part {{current}} of {{total}}",
    ongoing: "Ongoing",
    completed: "Completed",
    prevPart: "Previous part",
    nextPart: "Next part",
    inThisSeries: "In this series",
    empty: "No posts yet.",
    count: "{{count}} parts",
    viewAll: "View all",
  },
  archives: {
    yearPostCount: "{{count}} posts total",
    monthPostCount: "{{count}} posts",
  },
  toc: {
    title: "Table of contents",
  },
  notFound: {
    title: "404 Not Found",
    message: "Page Not Found",
    goHome: "Go back home",
  },
} satisfies UIStrings;
