import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateThemeCss } from "@termix-ssh/plugin-sdk/manifest";

const root = path.resolve(import.meta.dirname, "../..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "manifest.json"), "utf8"),
);
const locale = JSON.parse(
  fs.readFileSync(path.join(root, "locales/en.json"), "utf8"),
);
const themes = manifest.contributes.themes as {
  id: string;
  label: string;
  mode: string;
  css: string;
}[];

/* Every token the built-in themes set. A theme that misses one falls back to
 * whatever the previous theme left behind, which shows up as a stray light
 * patch in a dark UI, so the list is checked rather than eyeballed. */
const tokens = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--surface",
  "--surface-dim",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--destructive",
  "--border",
  "--input",
  "--ring",
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--sidebar",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-ring",
  "--warning",
  "--terminal-bg",
];

describe("themes", () => {
  it("declares the ui:theme capability", () => {
    expect(manifest.capabilities).toContain("ui:theme");
  });

  it("ships the two themes, dark first", () => {
    expect(themes.map((theme) => theme.id)).toEqual([
      "termius-dark",
      "termius-light",
    ]);
  });

  it.each(themes)("$id has safe css scoped under its class", (theme) => {
    const css = fs.readFileSync(path.join(root, theme.css), "utf8");
    expect(validateThemeCss(css, theme.id)).toEqual([]);
  });

  it.each(themes)("$id sets every token", (theme) => {
    const css = fs.readFileSync(path.join(root, theme.css), "utf8");
    for (const token of tokens) {
      expect(css).toContain(`${token}:`);
    }
  });

  it.each(themes)("$id has a label in the locale", (theme) => {
    const key = theme.label.replace(/^theme\./, "");
    expect(typeof locale.theme[key]).toBe("string");
  });
});
