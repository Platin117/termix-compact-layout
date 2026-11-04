import { useCallback, useEffect, useState } from "react";
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
 */

/** A stored value that was never written is not a list, and seeds itself. */
function storedIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((id): id is string => typeof id === "string");
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
  /** Null until the settings have been read, so nothing flickers downward. */
  loaded: boolean;
  setIds: (ids: string[]) => void;
}

export function useRailBottom(items: RailItemDef[]): RailBottom {
  const [stored, setStored] = useState<string[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    getPluginUserSettings(PLUGIN_ID)
      .then((values) => {
        if (!live) return;
        setStored(storedIds(values[KEY]));
        setLoaded(true);
      })
      .catch(() => live && setLoaded(true));
    return () => {
      live = false;
    };
  }, []);

  const setIds = useCallback((next: string[]) => {
    // Moves at once and is put back if the server refuses, the way the role
    // page's permissions do.
    setStored((before) => {
      void updatePluginUserSettings(PLUGIN_ID, { [KEY]: next }).catch(() =>
        setStored(before),
      );
      return next;
    });
  }, []);

  return {
    ids: stored ?? defaultBottomIds(items),
    loaded,
    setIds,
  };
}
