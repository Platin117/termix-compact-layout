import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Every place a plugin may put something, and whether this layout mounts it.
 *
 * A slot nobody renders fails silently: the plugin contributes, nothing
 * appears, and there is no error to find. That is how Proxmox's guest import
 * did nothing here for three versions. So the set is pinned, with the two
 * deliberate gaps named rather than merely absent -- a slot that quietly
 * stops being mounted should fail here, not in somebody's install.
 *
 * The list comes from Plugin-Classic-Layout 1.1.1, which is the reference
 * for what a full layout offers.
 */

const MOUNTED = [
  "audit.toolbar",
  "credentials.badges",
  "credentials.keyGenerator",
  "credentials.panel",
  "credentials.publicKeyDeriver",
  "credentials.rowActions",
  "credentials.secretHint",
  "credentials.secretManager",
  "dashboard.counters",
  "dashboard.hostRow",
  "hosts.importMenu",
  "hosts.panel",
  "shell.accountSwitcher",
  "shell.overlay",
  "shell.rightEdge",
  "tab.inline",
  "tab.menu",
];

/** Left out on purpose, because this layout has nowhere to put them. */
const SKIPPED = {
  // Needs the multi-select the stock host tree has; this list has none.
  "hosts.selectionActions": "no selection mode",
  // Belongs to the stock Connections sidebar panel, which this layout
  // replaces with the tab bar.
  "connections.sections": "no connections panel",
};

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

function mountedIds(): Set<string> {
  const pattern = /(?:slotId|PluginComponent\s+id)\s*=\s*[{"]*"([a-zA-Z][\w.]*)"/g;
  const found = new Set<string>();
  for (const file of sources("src/frontend")) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(pattern)) found.add(match[1]);
  }
  return found;
}

describe("plugin mount points", () => {
  const found = mountedIds();

  it.each(MOUNTED)("mounts %s", (id) => {
    expect(found.has(id)).toBe(true);
  });

  it.each(Object.entries(SKIPPED))(
    "leaves out %s on purpose (%s)",
    (id) => {
      expect(found.has(id)).toBe(false);
    },
  );

  it("mounts nothing that is not accounted for", () => {
    // A new slot is fine, but it belongs in the list above so the next
    // reader can tell what this layout offers without grepping for it.
    expect([...found].sort()).toEqual([...MOUNTED].sort());
  });
});
