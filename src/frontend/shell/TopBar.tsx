import { useRef, useState } from "react";
import { X } from "lucide-react";
import {
  ActionSlot,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  tabIcon,
  useBranding,
  useShellController,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";
import { isSessionTab, tabTitle } from "./nav";

/** The shape of a tab, taken from the controller rather than named again. */
type TabData = ReturnType<
  typeof useShellController
>["tabs"]["topLevel"][number];

/**
 * Open connections, and nothing else.
 *
 * Pages live in the rail, so Settings no longer costs a tab you have to close
 * by hand; it is a place you navigate to and away from. What is left here is
 * what is actually running, which is the only thing worth the width.
 */
export function TopBar() {
  const { t } = useTranslation();
  const shell = useShellController();
  const branding = useBranding();
  const { tabs } = shell;
  const strip = useRef<HTMLDivElement>(null);

  const sessions = tabs.topLevel.filter(isSessionTab);

  /**
   * Closing the tab you are looking at lands on the next session, or on Home
   * when that was the last one. Core would fall back to the previously active
   * tab, which in this layout is a page you left through the rail long ago.
   */
  const closeTab = async (id: string) => {
    const wasActive = id === tabs.activeId;
    const rest = sessions.filter((tab) => tab.id !== id);
    await tabs.close(id);
    if (!wasActive) return;
    if (rest.length > 0) tabs.setActive(rest[rest.length - 1].id);
    else tabs.openSingleton("dashboard");
  };

  // On a phone the bottom bar navigates, so this only names the tab.
  if (shell.isMobile && !shell.isElectron) {
    return (
      <header className="flex h-10 shrink-0 items-center gap-2 border-b border-border bg-card px-3 text-sm font-medium">
        {branding.logo ? (
          <img src={branding.logo} alt="" className="size-5 object-contain" />
        ) : null}
        <span className="truncate">
          {tabs.active ? tabTitle(tabs.active, t) : branding.appName}
        </span>
      </header>
    );
  }

  if (sessions.length === 0) {
    return <header className="h-10 shrink-0 border-b border-border bg-card" />;
  }

  return (
    <header className="flex h-10 shrink-0 items-stretch border-b border-border bg-card">
      <div
        ref={strip}
        className="flex min-w-0 flex-1 items-stretch overflow-x-auto"
        aria-label={t("nav.sessions")}
        // A trackpad already scrolls sideways; a mouse wheel only reports
        // deltaY, so it is mapped onto the strip by hand.
        onWheel={(event) => {
          const el = strip.current;
          if (!el || event.deltaY === 0 || event.shiftKey) return;
          if (el.scrollWidth <= el.clientWidth) return;
          el.scrollLeft += event.deltaY;
        }}
      >
        {sessions.map((tab) => (
          <SessionTab
            key={tab.id}
            tab={tab}
            active={tab.id === tabs.activeId}
            title={tabTitle(tab, t)}
            icon={tabIcon(tab.type)}
            onClick={() => tabs.setActive(tab.id)}
            onClose={() => void closeTab(tab.id)}
            closeLabel={t("nav.closeTab")}
          />
        ))}
      </div>
    </header>
  );
}

/**
 * A running session in the bar.
 *
 * Plugins reach a tab two ways, and both are handed the same pair the stock
 * bar hands them: the terminal handle and the tab itself. `tab.inline` is a
 * button inside the pill, which is where the terminal's search and recording
 * put themselves; `tab.menu` is the right-click menu, which exists here only
 * to carry those contributions beside closing.
 */
function SessionTab({
  tab,
  active,
  title,
  icon,
  onClick,
  onClose,
  closeLabel,
}: {
  tab: TabData;
  active: boolean;
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  onClose: () => void;
  closeLabel: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  // Read at click time rather than on render: the handle appears only once
  // the terminal has mounted.
  const handle = () => tab.terminalRef?.current;
  const when = { tab, handle: handle() };
  const context = () => [handle(), tab];

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <div
        // Middle click closes, like a browser tab. Mousedown is stopped so it
        // does not start autoscroll.
        onMouseDown={(e) => {
          if (e.button === 1) e.preventDefault();
        }}
        onAuxClick={(e) => {
          if (e.button !== 1) return;
          e.preventDefault();
          onClose();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenuOpen(true);
        }}
        className={`group mx-0.5 my-1 flex max-w-56 shrink-0 items-center gap-1.5 rounded-md pl-3 pr-1.5 text-sm ${
          active
            ? // A lighter pill with a ring: the old darker fill was barely a
              // shade apart from the bar it sits in.
              "bg-accent text-foreground ring-1 ring-inset ring-accent-brand/40"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        }`}
      >
        <button
          type="button"
          className="flex h-full min-w-0 items-center gap-1.5"
          onClick={onClick}
          aria-current={active ? "page" : undefined}
        >
          <span className="size-1.5 shrink-0 rounded-full bg-chart-2" />
          <span className="truncate font-mono text-xs">{title}</span>
          <span className="sr-only">{icon}</span>
        </button>

        <ActionSlot
          slotId="tab.inline"
          when={when}
          context={context}
          hideLabels
          className="rounded p-0.5 opacity-60 hover:bg-muted hover:opacity-100"
        />

        {/* Anchors the menu on the pill; the right-click above opens it. */}
        <DropdownMenuTrigger asChild>
          <span className="sr-only" aria-hidden />
        </DropdownMenuTrigger>

        <button
          type="button"
          className="rounded p-0.5 opacity-60 hover:bg-muted hover:opacity-100"
          onClick={onClose}
          aria-label={closeLabel}
        >
          <X className="size-3" />
        </button>
      </div>

      <DropdownMenuContent align="start" className="min-w-44">
        <ActionSlot slotId="tab.menu" when={when} context={context} />
        <DropdownMenuItem onSelect={onClose}>
          <X className="size-3.5" />
          {closeLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
