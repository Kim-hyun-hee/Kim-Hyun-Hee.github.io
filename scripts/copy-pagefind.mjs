import { cpSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function copyPagefind(source, target) {
  if (!existsSync(source)) {
    throw new Error("dist/pagefind does not exist; run Pagefind before copying");
  }

  cpSync(source, target, { recursive: true, force: true });
}

const source = new URL("../dist/pagefind", import.meta.url);
const target = new URL("../public/pagefind", import.meta.url);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  copyPagefind(source, target);
}
