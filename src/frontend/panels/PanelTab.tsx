import { useState } from "react";
import { getPanel, useShellController } from "@termix-ssh/plugin-sdk/ui";

/**
 * Renders a plugin's sidebar panel as a full page.
 *
 * Panels carry a `placement` prop with "tab" among its values, so this is a
 * supported way to show one; it is how Snippets gets a home in a layout with
 * no sidebar to dock it into.
 */
export function PanelTab({ panelId }: { panelId: string }) {
  const shell = useShellController();
  const [, setEditing] = useState(false);
  const panel = panelId ? getPanel(panelId) : undefined;

  if (!panel) return null;
  const Component = panel.component;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <Component
        active
        placement="tab"
        shell={shell.panelCallbacks}
        setEditing={setEditing}
        activeTabType={shell.tabs.active?.type}
        targetTab={shell.tabs.active}
      />
    </div>
  );
}
