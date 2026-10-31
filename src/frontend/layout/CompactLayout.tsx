import {
  ComponentSlot,
  ShellConfirmCapture,
  SurfaceScope,
  TabStage,
  useShellController,
} from "@termix-ssh/plugin-sdk/ui";
import { BottomBar } from "../shell/BottomBar";
import { Rail } from "../shell/Rail";
import { setShellRef } from "../shell/shell-ref";
import { SimplePalette } from "../shell/SimplePalette";
import { TopBar } from "../shell/TopBar";

/**
 * One rail on the left, one tab bar on top, the tab underneath. No right
 * dock, no second sidebar, no split view: the right edge slot that Simple
 * Layout renders is deliberately left out, since its icons duplicate what
 * the rail already offers.
 */
export function CompactLayout() {
  const shell = useShellController();
  const mobile = shell.isMobile && !shell.isElectron;

  // Lets the terminal toolbar button reach the shell; see shell-ref.
  setShellRef(shell);

  return (
    <div
      data-compact-layout=""
      className="flex w-screen flex-col bg-background"
      style={{ height: "calc(100dvh - var(--termix-titlebar-height, 0px))" }}
    >
      <LayoutStyleOverrides />
      <div className="flex min-h-0 flex-1">
        {!mobile && <Rail />}
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <SurfaceScope kind="tab" className="overflow-hidden">
            <ShellConfirmCapture />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <TopBar />
              <TabStage />
            </div>
          </SurfaceScope>
          {mobile && <BottomBar />}
        </div>
      </div>
      <SimplePalette />
      <OverlaySlots />
    </div>
  );
}

/**
 * Where other plugins put their dialogs.
 *
 * A plugin that needs a modal registers it as a component contribution and
 * trusts the layout to mount the slot; the dialog itself renders null until
 * something opens it. Simple Layout mounts neither of these, which is why
 * Proxmox's "discover guests" did nothing here: the action set its state and
 * there was no dialog on the page to notice. `hosts.panel` belongs to the
 * stock layout's host sidebar, but this layout has no such panel and its
 * host cards carry the buttons, so it is mounted at the root instead.
 *
 * A contribution that draws inline rather than in a portal would land in a
 * zero-size box and be clipped. None does today; the alternative is dialogs
 * that never open.
 */
function OverlaySlots() {
  return (
    <div className="contents">
      <ComponentSlot slotId="shell.overlay" />
      <ComponentSlot slotId="hosts.panel" />
    </div>
  );
}

/**
 * Two rules that reach past this plugin's own markup, both scoped to the
 * layout root so they end where it ends.
 *
 * **Rounding.** Termix's components are square on purpose: the shared UI kit
 * writes `rounded-none` in 42 places and never reads the `--radius` token the
 * themes set. Rounding the cards here while every panel, menu and dialog
 * stays sharp looks like a mistake rather than a style, so everything inside
 * this layout follows the theme's radius.
 *
 * The one exception is the tooltip arrow: it is a square rotated 45 degrees,
 * and rounding its corners turns the point into a blob. Of the 31 distinct
 * class lists in the kit that carry `rounded-none`, it is the only one whose
 * square corners are load-bearing.
 *
 * Toggles need their own rule. Their track and knob carry no rounding class
 * at all, so the rule above never sees them; they are reached through
 * `role="switch"`, which is semantics rather than styling and therefore
 * survives a restyle. A toggle is round everywhere else in the world, and a
 * square knob sliding in a square track reads as broken rather than austere.
 *
 * 28 further class lists in the kit have a border and no rounding either.
 * They have nothing in common to select on, so they stay square: a rule for
 * each would be guesswork, and guessing at other people's markup is how you
 * end up with a layout that looks worse after every one of their updates.
 *
 * **The metrics label.** Host Metrics draws the CPU/memory/disk labels in the
 * terminal toolbar with a fixed `w-12` and no truncation. "Memory" fits in
 * 48px, "Arbeitsspeicher" does not, so the text runs out of its box and under
 * the bar beside it. Letting the label size itself fixes the overlap.
 *
 * Both reach other people's markup through utility classes, so both are
 * patches, not fixes: if those components are restyled, the rules stop
 * matching and the old look returns. Nothing breaks either way.
 */
function LayoutStyleOverrides() {
  return (
    <style>
      {`[data-compact-layout] .rounded-none:not(.rotate-45),
        [data-compact-layout] [class~="border"][class*="border-"]:not([class*="rounded"]),
        [data-compact-layout] [class~="bg-card"]:not([class*="rounded"]),
        [data-compact-layout] [class~="bg-popover"]:not([class*="rounded"]),
        [data-compact-layout] [class~="bg-background"][class~="border"]:not([class*="rounded"]){border-radius:calc(var(--radius,0.5rem)*0.8)}
        [data-compact-layout] [role="switch"],
        [data-compact-layout] [role="switch"]>span{border-radius:9999px}
        [data-compact-layout] span.w-12.uppercase.tracking-wider{width:auto}`}
    </style>
  );
}
