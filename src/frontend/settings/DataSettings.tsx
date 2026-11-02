import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  getUserPreferences,
  saveUserPreferences,
  type UserPreferences,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";
import { Row, Rows, Section } from "./parts";

const MODES = ["cloud", "local"] as const;

/**
 * Where this account's settings live, and what is restored on sign-in.
 *
 * "cloud" keeps them on the server, so another device sees them; "local"
 * keeps them in this browser only. The toggles below are stored the same way
 * and so follow that choice.
 */
export function DataSettings() {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);

  useEffect(() => {
    let live = true;
    getUserPreferences()
      .then((value) => live && setPrefs(value))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  if (!prefs) {
    return <p className="text-sm text-muted-foreground">{t("settings.loading")}</p>;
  }

  const set = (patch: Partial<UserPreferences>) => {
    setPrefs({ ...prefs, ...patch });
    void saveUserPreferences(patch);
  };

  return (
    <div className="flex flex-col gap-6">
      <Section title={t("data.storage")} hint={t("data.storageHint")}>
        <Select
          value={prefs.storageMode === "local" ? "local" : "cloud"}
          onValueChange={(value) => set({ storageMode: value })}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODES.map((mode) => (
              <SelectItem key={mode} value={mode}>
                {t(`data.modes.${mode}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>

      <Section title={t("data.session")}>
        <Rows>
          <Row title={t("data.reopenTabs")} hint={t("data.reopenTabsHint")}>
            <Switch
              checked={prefs.reopenTabsOnLogin}
              onCheckedChange={(v) => set({ reopenTabsOnLogin: v })}
              aria-label={t("data.reopenTabs")}
            />
          </Row>
          <Row title={t("data.confirmTabClose")}>
            <Switch
              checked={prefs.confirmTabClose !== false}
              onCheckedChange={(v) => set({ confirmTabClose: v })}
              aria-label={t("data.confirmTabClose")}
            />
          </Row>
          <Row title={t("data.commandPalette")}>
            <Switch
              checked={prefs.commandPaletteEnabled !== false}
              onCheckedChange={(v) => set({ commandPaletteEnabled: v })}
              aria-label={t("data.commandPalette")}
            />
          </Row>
          <Row
            title={t("data.disableUpdateCheck")}
            hint={t("data.disableUpdateCheckHint")}
          >
            <Switch
              checked={prefs.disableUpdateCheck === true}
              onCheckedChange={(v) => set({ disableUpdateCheck: v })}
              aria-label={t("data.disableUpdateCheck")}
            />
          </Row>
        </Rows>
      </Section>
    </div>
  );
}
