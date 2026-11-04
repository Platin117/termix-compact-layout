import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  useAreaPreferences,
  useUiPreferencesContext,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";
import { Row, Rows, Section } from "./parts";

const PRESETS = ["simple", "balanced", "advanced"] as const;
const DENSITY = ["comfortable", "compact"] as const;

/**
 * How much interface there is: the preset, and the knobs it sets.
 *
 * Worth having even though a preset is one click, because the preset is what
 * silently took the "Add host" button off an empty home screen -- Simple sets
 * emptyStateVerbosity to "minimal", and nothing in this layout said so.
 * Changing any knob moves the preset to "custom"; core does that itself.
 */
export function InterfaceSettings() {
  const { t } = useTranslation();
  const ui = useUiPreferencesContext();
  const chrome = useAreaPreferences("chrome");
  const hostList = useAreaPreferences("hostList");
  const credentials = useAreaPreferences("credentialList");
  const hostEditor = useAreaPreferences("hostEditor");

  if (!ui) {
    return (
      <p className="text-sm text-muted-foreground">{t("rail.unavailable")}</p>
    );
  }

  const preset = ui.preferences.preset;

  return (
    <div className="flex flex-col gap-6">
      <Section title={t("iface.preset")} hint={t("iface.presetHint")}>
        <Select
          value={preset}
          onValueChange={(value) =>
            ui.setPreset(value as (typeof PRESETS)[number])
          }
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map((id) => (
              <SelectItem key={id} value={id}>
                {t(`iface.presets.${id}`)}
              </SelectItem>
            ))}
            {preset === "custom" && (
              <SelectItem value="custom">
                {t("iface.presets.custom")}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </Section>

      <Section title={t("iface.chrome")}>
        <Rows>
          <Row title={t("iface.showBreadcrumbs")}>
            <Switch
              checked={chrome.showBreadcrumbs}
              onCheckedChange={(v) =>
                ui.setOverride("chrome", "showBreadcrumbs", v)
              }
              aria-label={t("iface.showBreadcrumbs")}
            />
          </Row>
          <Row title={t("iface.showStatusBar")}>
            <Switch
              checked={chrome.showStatusBar}
              onCheckedChange={(v) =>
                ui.setOverride("chrome", "showStatusBar", v)
              }
              aria-label={t("iface.showStatusBar")}
            />
          </Row>
          <Row title={t("iface.emptyStates")} hint={t("iface.emptyStatesHint")}>
            <Switch
              checked={chrome.emptyStateVerbosity === "guided"}
              onCheckedChange={(v) =>
                ui.setOverride(
                  "chrome",
                  "emptyStateVerbosity",
                  v ? "guided" : "minimal",
                )
              }
              aria-label={t("iface.emptyStates")}
            />
          </Row>
        </Rows>
      </Section>

      <Section title={t("iface.hostList")}>
        <Rows>
          <Row title={t("iface.density")}>
            <Select
              value={hostList.density}
              onValueChange={(v) =>
                ui.setOverride(
                  "hostList",
                  "density",
                  v as (typeof DENSITY)[number],
                )
              }
            >
              <SelectTrigger className="h-8 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DENSITY.map((id) => (
                  <SelectItem key={id} value={id}>
                    {t(`iface.densities.${id}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
          <Row title={t("iface.showTags")}>
            <Switch
              checked={hostList.showTags}
              onCheckedChange={(v) => ui.setOverride("hostList", "showTags", v)}
              aria-label={t("iface.showTags")}
            />
          </Row>
          <Row title={t("iface.showResourceBars")}>
            <Switch
              checked={hostList.showResourceBars}
              onCheckedChange={(v) =>
                ui.setOverride("hostList", "showResourceBars", v)
              }
              aria-label={t("iface.showResourceBars")}
            />
          </Row>
          <Row title={t("iface.showStatusStripes")}>
            <Switch
              checked={hostList.showStatusStripes}
              onCheckedChange={(v) =>
                ui.setOverride("hostList", "showStatusStripes", v)
              }
              aria-label={t("iface.showStatusStripes")}
            />
          </Row>
          <Row title={t("iface.rowActions")} hint={t("iface.rowActionsHint")}>
            <Switch
              checked={hostList.rowActions === "full"}
              onCheckedChange={(v) =>
                ui.setOverride(
                  "hostList",
                  "rowActions",
                  v ? "full" : "essential",
                )
              }
              aria-label={t("iface.rowActions")}
            />
          </Row>
        </Rows>
      </Section>

      <Section title={t("iface.credentialList")}>
        <Rows>
          <Row title={t("iface.density")}>
            <Select
              value={credentials.density}
              onValueChange={(v) =>
                ui.setOverride(
                  "credentialList",
                  "density",
                  v as (typeof DENSITY)[number],
                )
              }
            >
              <SelectTrigger className="h-8 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DENSITY.map((id) => (
                  <SelectItem key={id} value={id}>
                    {t(`iface.densities.${id}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
          <Row title={t("iface.showTags")}>
            <Switch
              checked={credentials.showTags}
              onCheckedChange={(v) =>
                ui.setOverride("credentialList", "showTags", v)
              }
              aria-label={t("iface.showTags")}
            />
          </Row>
        </Rows>
      </Section>

      <Section title={t("iface.hostEditor")}>
        <Rows>
          <Row title={t("iface.fullEditor")} hint={t("iface.fullEditorHint")}>
            <Switch
              checked={hostEditor.mode === "full"}
              onCheckedChange={(v) =>
                ui.setOverride("hostEditor", "mode", v ? "full" : "simple")
              }
              aria-label={t("iface.fullEditor")}
            />
          </Row>
        </Rows>
      </Section>

      <div>
        <Label className="mb-2 block text-xs text-muted-foreground">
          {t("iface.resetHint")}
        </Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => ui.clearAllOverrides()}
        >
          {t("iface.reset")}
        </Button>
      </div>
    </div>
  );
}
