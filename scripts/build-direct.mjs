import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outdir = resolve(root, "file-dist");
const directHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tidewake Pilgrimage</title>
    <link rel="stylesheet" href="./file-dist/game.bundle.css" />
  </head>
  <body>
    <div id="app"></div>
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
  </head>
  <body>
    <div id="app"></div>
    <script defer src="./game.bundle.js"></script>
  </body>
</html>
`
);
await writeFile(resolve(root, "index.html"), directHtml);
