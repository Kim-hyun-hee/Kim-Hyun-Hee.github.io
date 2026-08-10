import { getViteConfig } from "astro/config";
import { fileURLToPath } from "node:url";

const currentViteTestConfig = {
  resolve: {
    alias: [
      {
        find: "@/astro-paper.config",
        replacement: fileURLToPath(
          new URL("./astro-paper.config.ts", import.meta.url)
        ),
      },
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
    ],
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
};

export default getViteConfig(currentViteTestConfig, {
  configFile: false,
  i18n: {
    locales: ["ko"],
    defaultLocale: "ko",
    routing: { prefixDefaultLocale: false },
  },
});
