import { describe, expect, it, vi } from "vitest";
import type { LucideIcon } from "lucide-react";

// Only the types are used from the SDK here, but the module imports the
// settings calls as values, so the import has to resolve to something.
vi.mock("@termix-ssh/plugin-sdk/ui", () => ({
  getPluginUserSettings: vi.fn(),
  updatePluginUserSettings: vi.fn(),
}));

const { defaultBottomIds, splitRail } = await import(
  "../../src/frontend/shell/rail-bottom"
);

type Item = Parameters<typeof splitRail>[0][number];

const icon = (() => null) as unknown as LucideIcon;

function item(id: string, group?: "objects" | "tools" | "system"): Item {
  return { id, icon, labelKey: `nav.${id}`, group } as Item;
}

describe("the rail's bottom group", () => {
  it("keeps the rail's own order in both halves", () => {
    const items = [item("a"), item("b"), item("c"), item("d")];
    const { top, bottom } = splitRail(items, ["c", "a"]);

    // Listed as c, a -- but the rail's order wins, so moving an entry down
    // does not also reshuffle it.
    expect(bottom.map((i) => i.id)).toEqual(["a", "c"]);
    expect(top.map((i) => i.id)).toEqual(["b", "d"]);
  });

  it("ignores an id that matches no entry", () => {
    const items = [item("a"), item("b")];
    const { top, bottom } = splitRail(items, ["b", "a-plugin-that-is-gone"]);

    expect(bottom.map((i) => i.id)).toEqual(["b"]);
    expect(top.map((i) => i.id)).toEqual(["a"]);
  });

  it("puts nothing at the bottom when the list is empty", () => {
    const items = [item("a"), item("b")];
    expect(splitRail(items, []).bottom).toEqual([]);
    expect(splitRail(items, []).top).toHaveLength(2);
  });

  it("starts with core's system band at the bottom", () => {
    const items = [
      item("hosts", "objects"),
      item("snippets", "tools"),
      item("sync", "system"),
      item("audit", "system"),
    ];
    // Core sorts rail items into bands; the last of them is what this group
    // is for, so it is where an untouched install begins.
    expect(defaultBottomIds(items)).toEqual(["sync", "audit"]);
  });

  it("treats an entry with no band as an ordinary one", () => {
    expect(defaultBottomIds([item("a"), item("b")])).toEqual([]);
  });
});
