import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "../..");

/**
 * Every key the source asks for has to exist in every locale.
 *
 * A missing key does not crash: i18next prints the key itself, so the page
 * still renders and the gap only shows up as "settings.groupServer" sitting
 * in the sidebar. That is exactly the kind of thing that survives a careful
 * read-through, and exactly what a test catches for free.
 */

function read(file: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

/** "a.b.c" -> true when the nested key holds a string. */
function has(locale: Record<string, unknown>, key: string): boolean {
  let node: unknown = locale;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return false;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string";
}

function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sources(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

/**
 * Keys this plugin looks up but does not own.
 *
 * `railItemLabel` and the plugin settings forms translate ids that belong to
 * core and to other plugins, and a keybinding or permission names its own
 * label key. Those live in their namespaces, not ours.
 */
const FOREIGN = /^(nav\.|tab\.|hosts\.|common\.|settings\.user\.|permissions\.)/;

const used = new Set<string>();
for (const file of sources(path.join(root, "src"))) {
  const code = fs.readFileSync(file, "utf8");
  for (const match of code.matchAll(/\bt\(\s*"([a-zA-Z][\w.]*)"/g)) {
    used.add(match[1]);
  }
}

describe("locales", () => {
  it("finds the keys the source uses", () => {
    expect(used.size).toBeGreaterThan(50);
  });

  for (const file of ["locales/en.json", "locales/translated/de_DE.json"]) {
    it(`${file} has every key the source uses`, () => {
      const locale = read(file);
      const missing = [...used]
        .filter((key) => !FOREIGN.test(key))
        .filter((key) => !has(locale, key))
        .sort();
      expect(missing).toEqual([]);
    });
  }

  it("German and English hold the same keys", () => {
    const flatten = (node: unknown, prefix = ""): string[] => {
      if (typeof node === "string") return [prefix];
      if (typeof node !== "object" || node === null) return [];
      return Object.entries(node as Record<string, unknown>).flatMap(
        ([key, value]) => flatten(value, prefix ? `${prefix}.${key}` : key),
      );
    };
    const en = new Set(flatten(read("locales/en.json")));
    const de = new Set(flatten(read("locales/translated/de_DE.json")));
    expect([...en].filter((key) => !de.has(key)).sort()).toEqual([]);
    expect([...de].filter((key) => !en.has(key)).sort()).toEqual([]);
  });
});
