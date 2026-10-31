import type { TabProps } from "@termix-ssh/plugin-sdk/frontend";
import { HomeTab } from "./dashboard/HomeTab";
import { HostsTab } from "./manage/HostsTab";
import { PanelTab } from "./panels/PanelTab";
import { SettingsTab } from "./settings/SettingsTab";

export function HomeTabType() {
  return <HomeTab />;
}

export function HostsTabType() {
  return <HostsTab />;
}

/** Which page opens comes from the tab's data. */
export function SettingsTabType({ tab }: TabProps) {
  const section = tab.data?.section;
  return (
    <SettingsTab section={typeof section === "string" ? section : undefined} />
  );
}

/** One tab that shows whichever plugin panel the rail asked for. */
export function PanelTabType({ tab }: TabProps) {
  const panelId = tab.data?.panelId;
  return <PanelTab panelId={typeof panelId === "string" ? panelId : ""} />;
}
