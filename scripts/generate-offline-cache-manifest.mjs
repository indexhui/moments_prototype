import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const publicDir = path.join(rootDir, "public");
const scenesPath = path.join(rootDir, "src/lib/game/scenes.ts");
const outputPath = path.join(publicDir, "offline-cache-manifest.json");

const EXCLUDED_FILE_NAMES = new Set([".DS_Store", "offline-cache-manifest.json", "sw.js"]);
const EXCLUDED_EXTENSIONS = new Set([".clip"]);

function toUrlPath(filePath) {
  const relativePath = path.relative(publicDir, filePath).split(path.sep).join("/");
  return encodeURI(`/${relativePath}`);
}

async function walkPublicFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".") || EXCLUDED_FILE_NAMES.has(entry.name)) continue;

    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkPublicFiles(entryPath)));
      continue;
    }

    if (!entry.isFile()) continue;
    if (EXCLUDED_EXTENSIONS.has(path.extname(entry.name))) continue;
    files.push(entryPath);
  }

  return files;
}

async function getSceneRoutes() {
  const source = await readFile(scenesPath, "utf8");
  const sceneIds = Array.from(source.matchAll(/^\s*id:\s*"([^"]+)"/gm), (match) => match[1]).filter(
    (sceneId) => sceneId.startsWith("scene-"),
  );

  return Array.from(new Set(sceneIds)).map((sceneId) => `/game/${sceneId}`);
}

const publicFiles = await walkPublicFiles(publicDir);
const assets = publicFiles.map(toUrlPath).sort();
const routes = [
  "/",
  "/trial/dev",
  "/trial/gameworks",
  "/vision",
  "/game",
  "/game/arrange-route",
  ...(await getSceneRoutes()),
];
const urls = Array.from(new Set([...routes, ...assets])).sort();

await writeFile(
  outputPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      routes,
      assets,
      urls,
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote ${path.relative(rootDir, outputPath)} with ${urls.length} URLs.`);
