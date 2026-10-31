#!/usr/bin/env node
/**
 * Puts this version into the registry index.
 *
 * Everything but the signature is derived: the metadata from manifest.json,
 * the checksum and size from the packed file itself. Typing any of it by
 * hand is how an index ends up describing a build nobody can install.
 *
 *   node scripts/update-index.mjs compact-layout-1.6.1.tmxplug
 *
 * The signature is read from <file>.sig, which `termix-plugin sign` writes.
 * Re-running for a version already listed replaces that entry, so a botched
 * release can be redone without hand-editing JSON.
 */
import { createHash } from "node:crypto";
import { readFileSync, statSync, writeFileSync } from "node:fs";

const [pluginFile] = process.argv.slice(2);
if (!pluginFile) {
  console.error("usage: update-index.mjs <file.tmxplug>");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const index = JSON.parse(readFileSync("index.json", "utf8"));
const bytes = readFileSync(pluginFile);
const signature = readFileSync(`${pluginFile}.sig`, "utf8").trim();

const version = manifest.version;
const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const tag = `v${version}`;
const base = `${manifest.repository}/releases`;

const entry = {
  version,
  api: "1",
  url: `${base}/download/${tag}/${pluginFile.split("/").pop()}`,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  signature,
  size: statSync(pluginFile).size,
  capabilities: manifest.capabilities,
  releaseNotesUrl: `${base}/tag/${tag}`,
  publishedAt: now,
};

const plugin = index.plugins.find((p) => p.id === manifest.id);
if (!plugin) {
  console.error(`index.json has no plugin "${manifest.id}"`);
  process.exit(1);
}

// Newest first, and the same version twice means the newer build wins.
plugin.versions = [
  entry,
  ...plugin.versions.filter((v) => v.version !== version),
];

// The description and the feature list are the manifest's to change.
plugin.name = manifest.name;
plugin.description = manifest.description;
plugin.features = manifest.features;
index.updatedAt = now;

writeFileSync("index.json", `${JSON.stringify(index, null, 2)}\n`);
console.log(`index.json: ${manifest.id} ${version}`);
console.log(`  sha256 ${entry.sha256}`);
console.log(`  url    ${entry.url}`);
