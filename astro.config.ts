import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import rehypeCallouts from "rehype-callouts";
import rehypeWrapTables from "./src/utils/rehypeWrapTables";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import config from "./astro-paper.config";

const isLegacyProjectRedirect = (page: string) => {
  const segments = new URL(page).pathname.split("/").filter(Boolean);
  return segments.at(-2) === "categories" && segments.at(-1) === "project";
};

export default defineConfig({
  site: config.site.url,
  integrations: [
    mdx(),
    sitemap({
      filter: page =>
        (config.features?.showArchives !== false ||
          !new URL(page).pathname.endsWith("/archives/")) &&
        !isLegacyProjectRedirect(page),
    }),
  ],
  // [CUSTOM] 업스트림은 ["en"] / "en" 입니다. 기본 로케일만 ko로 바꿨고
  // prefixDefaultLocale: false는 그대로라 URL에 로케일 접두어가 붙지 않습니다.
  i18n: {
    locales: ["ko"],
    defaultLocale: "ko",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkToc,
        [remarkCollapse, { test: "Table of contents" }],
      ],
      rehypePlugins: [rehypeCallouts, rehypeWrapTables],
    }),
    shikiConfig: {
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  // [CUSTOM] 업스트림은 Google Sans Code 하나만 등록합니다. 그 폰트에 한글
  // 글리프가 없어 아래 둘로 교체했습니다. SUIT는 저장소에 담아 local provider로,
  // JetBrains Mono는 google provider로 받습니다(빌드 시 내려받아 self-host).
  // OG 이미지 생성(satori)이 WOFF2를 못 읽어서 ttf 포맷을 함께 요청합니다.
  fonts: [
    {
      name: "SUIT Variable",
      cssVariable: "--font-suit",
      provider: fontProviders.local(),
      fallbacks: ["system-ui", "sans-serif"],
      options: {
        variants: [
          {
            weight: "400 800",
            style: "normal",
            src: ["./src/assets/fonts/SUIT-Variable.woff2"],
          },
        ],
      },
    },
    {
      name: "JetBrains Mono",
      cssVariable: "--font-jetbrains-mono",
      provider: fontProviders.google(),
      fallbacks: ["monospace"],
      weights: [400, 500, 700],
      styles: ["normal", "italic"],
      // "ttf" is included (in addition to the brief's "woff2") because the
      // OG image routes (src/pages/og.png.ts, src/pages/posts/[...slug]/index.png.ts)
      // render text via satori, which does not support WOFF2 font data.
      formats: ["woff2", "ttf"],
    },
  ],
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
});
