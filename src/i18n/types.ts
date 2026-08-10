export interface UIStrings {
  nav: {
    posts: string;
    allByCategory: string;
    tags: string;
    about: string;
    archives: string;
    search: string;
    categories: string;
    series: string;
  };
  post: {
    publishedAt: string;
    backToTop: string;
    goBack: string;
    // previousPost/nextPost: 시간순 이전/다음 글 이동은 삭제됐지만 나중에
    // 되살릴 수 있어 의도적으로 남겨둔다. 지금은 호출부가 없다.
    previousPost: string;
    nextPost: string;
  };
  // 상단 바 문구. h1을 복사하지 않고 "여기가 어디인지"를 말한다.
  bar: {
    allPosts: string;
    category: string;
    postsIn: string;
    series: string;
    tag: string;
  };
  home: {
    featured: string;
    recentPosts: string;
    allPosts: string;
  };
  footer: {
    copyright: string;
    allRightsReserved: string;
  };
  pages: {
    tagTitle: string;
    tagDesc: string;

    tagsTitle: string;
    tagsDesc: string;

    postsTitle: string;
    postsDesc: string;

    archivesTitle: string;
    archivesDesc: string;

    searchTitle: string;
    searchDesc: string;
  };
  a11y: {
    skipToContent: string;
    openMenu: string;
    closeMenu: string;
    toggleTheme: string;
    toggleSubcategories: string;
    searchPlaceholder: string;
    noResults: string;
    goToPreviousPage: string;
    goToNextPage: string;
    paginationGoTo: string;
    paginationCurrent: string;
  };
  category: {
    desc: string;
    seeMore: string;
    postCount: string;
    otherPosts: string;
  };
  series: {
    title: string;
    desc: string;
    badge: string;
    ongoing: string;
    completed: string;
    prevPart: string;
    nextPart: string;
    inThisSeries: string;
    empty: string;
    count: string;
    viewAll: string;
  };
  toc: {
    title: string;
  };
  notFound: {
    title: string;
    message: string;
    goHome: string;
  };
}
