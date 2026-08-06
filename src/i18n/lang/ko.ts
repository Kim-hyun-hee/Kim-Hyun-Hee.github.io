import type { UIStrings } from "../types";

export default {
  nav: {
    home: "홈",
    posts: "글",
    tags: "태그",
    about: "소개",
    archives: "아카이브",
    search: "검색",
    categories: "카테고리",
    series: "시리즈",
  },
  post: {
    publishedAt: "작성일",
    updatedAt: "수정일",
    sharePostIntro: "이 글 공유하기:",
    sharePostOn: "{{platform}}에 공유",
    sharePostViaEmail: "메일로 공유",
    tagLabel: "태그",
    backToTop: "맨 위로",
    goBack: "뒤로",
    editPage: "이 글 수정",
    previousPost: "이전 글",
    nextPost: "다음 글",
  },
  pagination: {
    prev: "이전",
    next: "다음",
    page: "페이지",
  },
  home: {
    featured: "추천 글",
    recentPosts: "최근 글",
    allPosts: "전체 글",
  },
  footer: {
    copyright: "저작권",
    allRightsReserved: "All rights reserved.",
  },
  pages: {
    tagTitle: "태그",
    tagDesc: "이 태그가 달린 글",

    tagsTitle: "태그",
    tagsDesc: "글에 사용된 모든 태그입니다.",

    postsTitle: "글",
    postsDesc: "지금까지 쓴 글입니다.",

    archivesTitle: "아카이브",
    archivesDesc: "날짜별로 모아 본 글입니다.",

    searchTitle: "검색",
    searchDesc: "글 검색 ...",
  },
  category: {
    desc: "글을 분류별로 모아 봅니다.",
    allPosts: "전체 보기",
    seeMore: "더 보기",
    seriesCount: "{{count}}편",
    postCount: "{{count}}개의 글",
  },
  series: {
    title: "시리즈",
    desc: "여러 편으로 이어지는 글입니다.",
    part: "{{total}}편 중 {{current}}편",
    ongoing: "연재 중",
    completed: "완결",
    prevPart: "이전 편",
    nextPart: "다음 편",
    inThisSeries: "이 시리즈의 글",
    empty: "아직 글이 없습니다.",
  },
  toc: {
    title: "목차",
  },
  a11y: {
    skipToContent: "본문으로 건너뛰기",
    openMenu: "메뉴 열기",
    closeMenu: "메뉴 닫기",
    toggleTheme: "테마 전환",
    searchPlaceholder: "글 검색...",
    noResults: "검색 결과가 없습니다",
    goToPreviousPage: "이전 페이지로",
    goToNextPage: "다음 페이지로",
  },
  notFound: {
    title: "404 Not Found",
    message: "페이지를 찾을 수 없습니다",
    goHome: "홈으로 돌아가기",
  },
} satisfies UIStrings;
