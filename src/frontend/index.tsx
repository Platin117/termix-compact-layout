import { House, Play, Server, Settings } from "lucide-react";
import type { TermixApp } from "@termix-ssh/plugin-sdk/frontend";
import { getPanel } from "@termix-ssh/plugin-sdk/ui";
import { CompactLayout } from "./layout/CompactLayout";
import { getShellRef } from "./shell/shell-ref";
import {
  HomeTabType,
  HostsTabType,
  PanelTabType,
  SettingsTabType,
} from "./tabs";

export function activate(app: TermixApp): void {
  app.registerLayout({
    id: "compact",
    label: "layout.name",
    component: CompactLayout,
  });

  app.registerTab("dashboard", HomeTabType, {
    icon: House,
    titleKey: "tab.home",
    singleton: true,
    hostless: true,
  });
  app.registerTab("host-manager", HostsTabType, {
    icon: Server,
    titleKey: "tab.hosts",
    singleton: true,
  });
  app.registerTab("settings", SettingsTabType, {
    icon: Settings,
    titleKey: "tab.settings",
    singleton: true,
  });
  // Holds whichever sidebar panel the rail opened, so panels have a home in
  // a layout that has no sidebar to dock them into.
  app.registerTab("panel", PanelTabType, {
    icon: Play,
    titleKey: "tab.panel",
    singleton: true,
    hostless: true,
  });

  // The terminal's own bottom toolbar belongs to the SSH Terminal plugin, but
  // it is an open slot, so the Snippets button can go back there now that the
  // companion button at the right edge is gone.
  app.registerAction("openSnippets", () => {
    getShellRef()?.tabs.openSingleton("panel", undefined, undefined, {
      panelId: SNIPPETS_PANEL,
    });
  });
  app.registerSlotContribution("terminal.toolbar", {
    actionId: "openSnippets",
    titleKey: "nav.snippets",
    icon: Play,
    kind: "button",
    // Nothing to open when the Snippets plugin is not installed, and
    // getPanel throws rather than returning nothing for an unknown id.
    when: () => {
      try {
        return Boolean(getPanel(SNIPPETS_PANEL));
      } catch {
        return false;
      }
    },
  });
}

const SNIPPETS_PANEL = "snippets";
