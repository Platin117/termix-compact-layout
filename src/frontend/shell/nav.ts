import { useMemo } from "react";
import { House, Search, Server, Settings, type LucideIcon } from "lucide-react";
import {
  getTabType,
  useAreaPreferences,
  useRailItems,
  type RailItemDef,
} from "@termix-ssh/plugin-sdk/ui";

/** Drawn by hand at the top and bottom of the rail, so not in the middle. */
const RAIL_SKIPS = new Set([
  "dashboard",
  "host-manager",
  "settings",
  "plugins",
  "quick-connect",
]);

/**
 * Everything the left rail lists.
 *
 * A plugin's panel is listed and opens in the panel tab, which is how Snippets
 * gets a home. Core's own panels are not: Hosts, Zugangsdaten and Verbindungen
 * render blank outside the sidebar they were written for, and the first two
 * are already the rail's top two entries.
 */
export function useRailCandidates(): RailItemDef[] {
  const items = useRailItems();
  return useMemo(
    () =>
      items.filter((item) => {
        if (item.hidden || RAIL_SKIPS.has(item.id)) return false;
        return opensAsTab(item) || Boolean(item.pluginId);
      }),
    [items],
  );
}

/**
 * Puts the candidates in the user's order and drops the ones they switched
 * off. Both come from core's own rail preferences, the same store the stock
 * layout writes, so the choice survives switching layouts.
 */
export function applyRailPreferences(
  items: RailItemDef[],
  prefs: { hiddenTabs?: string[]; order?: string[] },
): RailItemDef[] {
  const hidden = new Set(prefs.hiddenTabs ?? []);
  const order = prefs.order ?? [];
  const rank = new Map(order.map((id, index) => [id, index]));
  return items
    .filter((item) => !hidden.has(item.id))
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      // Anything the user never moved keeps its place, after what they did.
      const ra = rank.get(a.item.id) ?? order.length + a.index;
      const rb = rank.get(b.item.id) ?? order.length + b.index;
      return ra - rb || a.index - b.index;
    })
    .map((entry) => entry.item);
}

/** What the rail actually draws. */
export function useRailDestinations(): RailItemDef[] {
  const items = useRailCandidates();
  const prefs = useAreaPreferences("rail");
  return useMemo(() => applyRailPreferences(items, prefs), [items, prefs]);
}

/** A destination with a tab of its own, rather than a sidebar panel. */
export function opensAsTab(item: RailItemDef): boolean {
  return item.kind === "tab" || item.promotable === true;
}

/**
 * The same destinations for the places that have no rail: the command palette
 * and the phone's bottom bar, both of which can only open tabs.
 */
export function useMoreItems(): RailItemDef[] {
  const items = useRailDestinations();
  return useMemo(() => items.filter(opensAsTab), [items]);
}

export interface NavButton {
  id: "home" | "hosts" | "search" | "settings";
  labelKey: string;
  icon: LucideIcon;
}

/** The phone's bottom bar, which has no room for a rail. */
export const NAV_BUTTONS: NavButton[] = [
  { id: "home", labelKey: "nav.home", icon: House },
  { id: "hosts", labelKey: "nav.hosts", icon: Server },
  { id: "search", labelKey: "nav.search", icon: Search },
  { id: "settings", labelKey: "nav.settings", icon: Settings },
];

/**
 * A tab that holds a connection rather than a page. Only these reach the tab
 * bar, so the bar stays a list of what is running.
 */
export function isSessionTab(tab: { type: string }): boolean {
  const meta = getTabType(tab.type);
  return Boolean(meta?.session || meta?.requiresHost);
}

/** The name a tab shows. Core calls the Hosts tab "Manage", so it is renamed. */
export function tabTitle(
  tab: { type: string; label: string; customLabel?: string },
  t: (key: string) => string,
): string {
  if (tab.type === "dashboard") return t("nav.home");
  if (tab.type === "host-manager") return t("nav.manage");
  return tab.customLabel || tab.label;
}
