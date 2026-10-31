import type { useShellController } from "@termix-ssh/plugin-sdk/ui";

export type ShellController = ReturnType<typeof useShellController>;

/**
 * The live shell, reachable from outside React.
 *
 * Slot buttons run as plain action handlers, not components, so they cannot
 * call useShellController. The layout is mounted for as long as it is the
 * active layout, so it parks the controller here on every render and the
 * handlers read it back.
 */
let current: ShellController | null = null;

export function setShellRef(shell: ShellController): void {
  current = shell;
}

export function getShellRef(): ShellController | null {
  return current;
}
