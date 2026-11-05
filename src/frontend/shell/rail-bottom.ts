import { useSyncExternalStore } from "react";
import {
  getPluginUserSettings,
  updatePluginUserSettings,
  type RailItemDef,
} from "@termix-ssh/plugin-sdk/ui";

const PLUGIN_ID = "compact-layout";
const KEY = "railBottom";

/**
 * Which rail entries sit in the bottom group, beside Plugins and Settings.
 *
 * The bottom group is this layout's own idea -- core's rail preferences know
 * only what is hidden and in what order -- so the choice lives in this
 * plugin's user settings instead. That store is on the server, so it follows
 * the account rather than the browser, the way the rest of the rail does.
 *
 * It is kept in one place rather than per component. The first attempt gave
 * the rail and the settings page a state each: moving an entry wrote to the
 * server and redrew the settings page, while the rail, mounted the whole
 * time, kept showing what it had read at startup. So the setting looked like
 * it did nothing until the app was restarted.
 */

interface Store {
  /** Null until read, and again if reading failed. */
  ids: string[] | null;
  loaded: boolean;
}

let store: Store = { ids: null, loaded: false };
let reading = false;
const listeners = new Set<() => void>();

function publish(next: Store) {
  store = next;
  for (const listener of listeners) listener();
}

/** A stored value that was never written is not a list. */
function storedIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((id): id is string => typeof id === "string");
}

function read() {
  if (reading || store.loaded) return;
  reading = true;
  getPluginUserSettings(PLUGIN_ID)
    .then((values) => publish({ ids: storedIds(values[KEY]), loaded: true }))
    .catch(() => publish({ ...store, loaded: true }))
    .finally(() => {
      reading = false;
    });
}

function write(ids: string[]) {
  const before = store;
  // Moves at once and is put back if the server refuses, the way the role
  // page's permissions do.
  publish({ ids, loaded: true });
  void updatePluginUserSettings(PLUGIN_ID, { [KEY]: ids }).catch(() =>
    publish(before),
  );
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  read();
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Where an entry starts out. Core sorts rail items into bands -- things you
 * keep, things you do, and the instance itself -- and the last of those is
 * what the bottom group is for.
 */
export function defaultBottomIds(items: RailItemDef[]): string[] {
  return items.filter((item) => item.group === "system").map((item) => item.id);
}

/** Splits the rail in two. Ids that match nothing are ignored. */
export function splitRail(
  items: RailItemDef[],
  bottomIds: string[],
): { top: RailItemDef[]; bottom: RailItemDef[] } {
  const inBottom = new Set(bottomIds);
  return {
    // Both keep the rail's own order, so moving an entry down does not also
    // reshuffle it: the order stays one question, answered in one place.
    top: items.filter((item) => !inBottom.has(item.id)),
    bottom: items.filter((item) => inBottom.has(item.id)),
  };
}

export interface RailBottom {
  ids: string[];
  loaded: boolean;
  setIds: (ids: string[]) => void;
}

export function useRailBottom(items: RailItemDef[]): RailBottom {
  const current = useSyncExternalStore(
    subscribe,
    () => store,
    () => store,
  );
  return {
    ids: current.ids ?? defaultBottomIds(items),
    loaded: current.loaded,
    setIds: write,
  };
}
