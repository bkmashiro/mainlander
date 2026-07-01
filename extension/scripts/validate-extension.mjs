import fs from "node:fs";
import path from "node:path";

const root = path.resolve("extension");
const manifestPath = path.join(root, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const required = [
  "manifest.json",
  "background.js",
  "content-bridge.js",
  "main-world.js",
  "popup.html",
  "popup.js",
  "options.html",
  "options.js",
  "styles.css",
  "shared/personas.js",
  "README.md"
];

for (const file of required) assertFile(file);

if (manifest.manifest_version !== 3) fail("manifest_version must be 3");
if (!manifest.background?.service_worker) fail("background.service_worker missing");
assertFile(manifest.background.service_worker);
if (manifest.background.type !== "module") fail("background.type must be module for ES imports");

for (const script of manifest.content_scripts ?? []) {
  if (!script.run_at || script.run_at !== "document_start") fail("content scripts must run at document_start");
  for (const js of script.js ?? []) assertFile(js);
}
if (!(manifest.content_scripts ?? []).some((script) => script.world === "MAIN" && script.js.includes("main-world.js"))) {
  fail("main-world.js must be injected with world: MAIN");
}

assertFile(manifest.action?.default_popup);
assertFile(manifest.options_page);

for (const permission of ["storage", "declarativeNetRequest"]) {
  if (!manifest.permissions?.includes(permission)) fail(`missing permission ${permission}`);
}

console.log("Mainlander Shield extension manifest looks valid.");

function assertFile(file) {
  if (!file || !fs.existsSync(path.join(root, file))) fail(`missing file: ${file}`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
