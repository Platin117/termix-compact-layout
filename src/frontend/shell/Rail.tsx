import {
  House,
  LogOut,
  Palette,
  Puzzle,
  Server,
  Settings,
  UserRound,
} from "lucide-react";
import {
  ComponentSlot,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  railItemLabel,
  useShellController,
  type RailItemDef,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";
import { opensAsTab, useRailDestinations } from "./nav";
import { splitRail, useRailBottom } from "./rail-bottom";

/**
 * The only navigation there is. Hosts at the top, everything a plugin adds
 * below it, the account and settings at the bottom. Nothing here is repeated
 * in the tab bar, which lists running connections and nothing else.
 *
 * Which entries sit in the bottom group is the user's choice; see
 * rail-bottom.ts for where that is kept and why it is not core's store.
 */
export function Rail() {
  const { t } = useTranslation();
  const shell = useShellController();
  const { tabs } = shell;
  const destinations = useRailDestinations();
  const bottomGroup = useRailBottom(destinations);
  const { top: items, bottom } = splitRail(destinations, bottomGroup.ids);
  const active = tabs.active;
  const activeType = active?.type;
  const activePanel =
    activeType === "panel"
      ? (active?.data?.panelId as string | undefined)
      : undefined;

  return (
    <nav
      className="flex w-44 shrink-0 flex-col gap-0.5 border-r border-border bg-sidebar p-2"
      aria-label={t("nav.tabs")}
    >
      <RailButton
        label={t("nav.home")}
        icon={<House className="size-4 shrink-0" />}
        active={activeType === "dashboard"}
        onClick={() => tabs.openSingleton("dashboard")}
      />
      <RailButton
        label={t("nav.manage")}
        icon={<Server className="size-4 shrink-0" />}
        active={activeType === "host-manager"}
        onClick={() => tabs.openSingleton("host-manager")}
      />

      <div className="my-1 h-px shrink-0 bg-border" />

      {/* The only part that scrolls, so the rail never outgrows the window
          however many plugins are installed. */}
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {items.map((item) => (
          <DestinationButton
            key={item.id}
            item={item}
            activeType={activeType}
            activePanel={activePanel}
          />
        ))}
      </div>

      <div className="my-1 h-px shrink-0 bg-border" />

      {bottom.map((item) => (
        <DestinationButton
          key={item.id}
          item={item}
          activeType={activeType}
          activePanel={activePanel}
        />
      ))}

      {shell.isAdmin && (
        <RailButton
          label={t("nav.plugins")}
          icon={<Puzzle className="size-4 shrink-0" />}
          active={activeType === "plugins"}
          onClick={() => tabs.openSingleton("plugins")}
        />
      )}
      <AccountButton />
      <RailButton
        label={t("nav.settings")}
        icon={<Settings className="size-4 shrink-0" />}
        active={activeType === "settings"}
        onClick={() => tabs.openSingleton("settings")}
      />
    </nav>
  );
}

/**
 * One rail entry, wherever it sits. A plugin's panel has no tab type of its
 * own, so it goes into the layout's panel tab, which renders it with
 * placement "tab".
 */
function DestinationButton({
  item,
  activeType,
  activePanel,
}: {
  item: RailItemDef;
  activeType: string | undefined;
  activePanel: string | undefined;
}) {
  const { t } = useTranslation();
  const { tabs } = useShellController();
  const asTab = opensAsTab(item);
  return (
    <RailButton
      label={railItemLabel(item.id, t)}
      icon={<item.icon className="size-4 shrink-0" />}
      active={asTab ? activeType === item.id : activePanel === item.id}
      onClick={() => {
        if (asTab) tabs.openSingleton(item.id);
        else
          tabs.openSingleton("panel", undefined, undefined, {
            panelId: item.id,
          });
      }}
    />
  );
}

function AccountButton() {
  const { t } = useTranslation();
  const shell = useShellController();
  const { tabs } = shell;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          <UserRound className="size-4 shrink-0" />
          <span className="truncate">{shell.username}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" className="min-w-48">
        <DropdownMenuLabel>{shell.username}</DropdownMenuLabel>
        <DropdownMenuItem
          onSelect={() =>
            tabs.openSingleton("settings", undefined, undefined, {
              section: "appearance",
            })
          }
        >
          <Palette className="size-3.5" />
          {t("nav.appearance")}
        </DropdownMenuItem>
        {shell.isAdmin && (
          <DropdownMenuItem onSelect={() => tabs.openSingleton("plugins")}>
            <Puzzle className="size-3.5" />
            {t("nav.plugins")}
          </DropdownMenuItem>
        )}
        {/* Whatever a plugin offers for switching accounts, which is why it
            sits above the separator rather than beside signing out. */}
        <ComponentSlot slotId="shell.accountSwitcher" />
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => shell.logout({ manual: true })}>
          <LogOut className="size-3.5" />
          {t("nav.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RailButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex shrink-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
