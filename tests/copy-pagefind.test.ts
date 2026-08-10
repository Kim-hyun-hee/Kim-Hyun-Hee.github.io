import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { copyPagefind } from "../scripts/copy-pagefind.mjs";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, { recursive: true, force: true })));
});

describe("copyPagefind", () => {
  it("copies the generated Pagefind tree into the public directory", async () => {
    const directory = await mkdtemp(join(tmpdir(), "astro-paper-pagefind-"));
    temporaryDirectories.push(directory);
    const source = join(directory, "dist", "pagefind");
    const target = join(directory, "public", "pagefind");
    await mkdir(join(source, "nested"), { recursive: true });
    await writeFile(join(source, "pagefind.js"), "entry");
    await writeFile(join(source, "nested", "index.js"), "nested");

    copyPagefind(source, target);

    await expect(readFile(join(target, "pagefind.js"), "utf8")).resolves.toBe("entry");
    await expect(readFile(join(target, "nested", "index.js"), "utf8")).resolves.toBe("nested");
  });

  it("rejects when the generated Pagefind directory is missing", async () => {
    const directory = await mkdtemp(join(tmpdir(), "astro-paper-pagefind-"));
    temporaryDirectories.push(directory);

    expect(() => copyPagefind(join(directory, "missing"), join(directory, "target"))).toThrow(
      "dist/pagefind does not exist; run Pagefind before copying",
    );
  });
});
