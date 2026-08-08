import type { UIStrings } from "../types";

export default {
  nav: {
    home: "Home",
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
    updatedAt: "Updated",
    sharePostIntro: "Share this post:",
    sharePostOn: "Share this post on {{platform}}",
    sharePostViaEmail: "Share this post via email",
    backToTop: "Back to top",
    goBack: "Go back",
    editPage: "Edit page",
    previousPost: "Previous Post",
    nextPost: "Next Post",
  },
  pagination: {
    prev: "Prev",
    next: "Next",
    page: "Page",
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
  },
  category: {
    desc: "Posts grouped by category.",
    allPosts: "All posts",
    seeMore: "See more",
    seriesCount: "{{count}} parts",
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
