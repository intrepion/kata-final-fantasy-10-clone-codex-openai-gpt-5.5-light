import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outdir = resolve(root, "file-dist");
const arcadeStyle = `  <style>[data-kata-arcade-nav] a:focus-visible { outline: 3px solid #ffdf70 !important; outline-offset: 3px; }</style>
`;
const arcadeNav = `    <div role="navigation" aria-label="Arcade navigation" data-kata-arcade-nav style="all:initial;display:block;position:fixed;left:8px;bottom:max(8px,env(safe-area-inset-bottom));z-index:2147483647;font:600 13px/1.3 system-ui,sans-serif; pointer-events: none;">
      <a href="https://intrepion.github.io/" style="display:inline-block;margin:8px;padding:8px 12px;border:2px solid #fff;border-radius:6px;background:#17262a;color:#fff;text-decoration:underline;text-underline-offset:3px;box-shadow:0 1px 4px #0008; pointer-events: auto;">← Kata Arcade</a>
    </div>

`;
const directHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tidewake Pilgrimage</title>
    <link rel="stylesheet" href="./file-dist/game.bundle.css" />
${arcadeStyle}</head>
  <body>
${arcadeNav}    <div id="app"></div>
    <script defer src="./file-dist/game.bundle.js"></script>
  </body>
</html>
`;

await mkdir(outdir, { recursive: true });

await build({
  entryPoints: [resolve(root, "src/main.ts")],
  bundle: true,
  format: "iife",
  target: "es2022",
  outfile: resolve(outdir, "game.bundle.js"),
  loader: {
    ".css": "css"
  },
  assetNames: "assets/[name]",
  logLevel: "info"
});

const css = await readFile(resolve(root, "src/styles.css"), "utf8");

await writeFile(resolve(outdir, "game.bundle.css"), css);
await writeFile(
  resolve(outdir, "index.html"),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tidewake Pilgrimage</title>
    <link rel="stylesheet" href="./game.bundle.css" />
${arcadeStyle}</head>
  <body>
${arcadeNav}    <div id="app"></div>
    <script defer src="./game.bundle.js"></script>
  </body>
</html>
`
);
await writeFile(resolve(root, "index.html"), directHtml);
