import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import {
  Button,
  railItemLabel,
  useAreaPreferences,
  useUiPreferencesContext,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";
import { applyRailPreferences, useRailCandidates } from "../shell/nav";

/**
 * Which entries the rail shows, and in which order.
 *
 * Both are written into core's own rail preferences rather than a setting of
 * this plugin's own, so the choice follows you to the stock layout and back,
 * and syncs like the rest of your interface settings.
 */
export function RailSettings() {
  const { t } = useTranslation();
  const candidates = useRailCandidates();
  const prefs = useAreaPreferences("rail");
  const ui = useUiPreferencesContext();

  const hidden = new Set(prefs.hiddenTabs ?? []);
  // Shown first in their current order, then the switched-off ones, so the
  // list reads the way the rail does.
  const visible = applyRailPreferences(candidates, prefs);
  const off = candidates.filter((item) => hidden.has(item.id));

  const writeOrder = (ids: string[]) => ui?.setOverride("rail", "order", ids);

  const move = (id: string, by: -1 | 1) => {
    const ids = visible.map((item) => item.id);
    const from = ids.indexOf(id);
    const to = from + by;
    if (from < 0 || to < 0 || to >= ids.length) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    // The hidden ones keep their relative place at the end of the list.
    writeOrder([...ids, ...off.map((item) => item.id)]);
  };

  const setShown = (id: string, shown: boolean) => {
    const next = new Set(hidden);
    if (shown) next.delete(id);
    else next.add(id);
    ui?.setOverride("rail", "hiddenTabs", [...next]);
  };

  const reset = () => {
    ui?.setOverride("rail", "order", null);
    ui?.setOverride("rail", "hiddenTabs", []);
  };

  if (!ui) {
    return (
      <p className="text-sm text-muted-foreground">{t("rail.unavailable")}</p>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{t("rail.hint")}</p>

      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
        {visible.map((item, index) => (
          <RailRow
            key={item.id}
            label={railItemLabel(item.id, t)}
            icon={<item.icon className="size-4 shrink-0" />}
            shown
            canUp={index > 0}
            canDown={index < visible.length - 1}
            onUp={() => move(item.id, -1)}
            onDown={() => move(item.id, 1)}
            onToggle={() => setShown(item.id, false)}
            toggleLabel={t("rail.hide")}
          />
        ))}
        {off.map((item) => (
          <RailRow
            key={item.id}
            label={railItemLabel(item.id, t)}
            icon={<item.icon className="size-4 shrink-0" />}
            shown={false}
            canUp={false}
            canDown={false}
            onUp={() => {}}
            onDown={() => {}}
            onToggle={() => setShown(item.id, true)}
            toggleLabel={t("rail.show")}
          />
        ))}
      </ul>

      <div>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={reset}>
          <RotateCcw className="size-3.5" />
          {t("rail.reset")}
        </Button>
      </div>
    </section>
  );
}

function RailRow({
  label,
  icon,
  shown,
  canUp,
  canDown,
  onUp,
  onDown,
  onToggle,
  toggleLabel,
}: {
  label: string;
  icon: React.ReactNode;
  shown: boolean;
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
  onToggle: () => void;
  toggleLabel: string;
}) {
  return (
    <li className="flex items-center gap-2 px-3 py-2">
      <input
        type="checkbox"
        id={`rail-${label}`}
        checked={shown}
        onChange={onToggle}
        aria-label={toggleLabel}
        className="size-4 shrink-0 accent-primary"
      />
      {icon}
      <label
        htmlFor={`rail-${label}`}
        className={`min-w-0 flex-1 truncate text-sm ${
          shown ? "" : "text-muted-foreground"
        }`}
      >
        {label}
      </label>
      <Button
        variant="ghost"
        size="icon-sm"
        className="size-7"
        disabled={!canUp}
        onClick={onUp}
        aria-label={`${label} ↑`}
      >
        <ChevronUp className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="size-7"
        disabled={!canDown}
        onClick={onDown}
        aria-label={`${label} ↓`}
      >
        <ChevronDown className="size-4" />
      </Button>
    </li>
  );
}
