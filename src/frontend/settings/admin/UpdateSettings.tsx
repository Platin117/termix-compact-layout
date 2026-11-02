import { useState } from "react";
import {
  APP_VERSION,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  canConfigureUpdates,
  desktopUpdates,
  getUpdateChannel,
  getVersionInfo,
  setUpdateChannel,
  useDesktopUpdate,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";
import { Gate, Row, Rows, Section, useLoad, when } from "../parts";

const CHANNELS = ["stable", "beta"] as const;

/**
 * Which version is running, which one is out, and the channel to follow.
 *
 * The desktop app updates itself and reports progress through its own bridge;
 * a browser has none, so that half only appears where it exists.
 */
export function UpdateSettings() {
  const { t } = useTranslation();
  const version = useLoad(() => getVersionInfo(true));
  const channel = useLoad(() => getUpdateChannel());
  const desktop = useDesktopUpdate();
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <Section title={t("updates.version")}>
        <Gate state={version}>
          {(info) => (
            <Rows>
              <Row
                title={t("updates.running")}
                hint={info.localVersion || APP_VERSION}
              />
              <Row
                title={t("updates.latest")}
                hint={info.remoteVersion || info.version || "—"}
              />
              {info.latest_release?.published_at && (
                <Row
                  title={t("updates.published")}
                  hint={when(info.latest_release.published_at)}
                />
              )}
              {info.status && (
                <Row title={t("updates.status")} hint={info.status} />
              )}
            </Rows>
          )}
        </Gate>
      </Section>

      <Section title={t("updates.channel")} hint={t("updates.channelHint")}>
        <Gate state={channel}>
          {(state) => (
            <div className="flex flex-col gap-2">
              <Select
                value={state.stored}
                onValueChange={(value) => {
                  setBusy(true);
                  void setUpdateChannel(value as (typeof CHANNELS)[number])
                    .then(() => channel.reload())
                    .finally(() => setBusy(false));
                }}
              >
                <SelectTrigger className="w-full sm:w-48" disabled={busy}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((id) => (
                    <SelectItem key={id} value={id}>
                      {t(`updates.channels.${id}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.runningBeta && state.stored !== "beta" && (
                <p className="text-xs text-muted-foreground">
                  {t("updates.runningBeta")}
                </p>
              )}
            </div>
          )}
        </Gate>
      </Section>

      {canConfigureUpdates(desktop) && (
        <Section title={t("updates.desktop")}>
          <Rows>
            <Row title={t("updates.installKind")} hint={desktop.kind} />
            <Row title={t("updates.state")} hint={desktop.status} />
            {desktop.version && (
              <Row title={t("updates.available")} hint={desktop.version} />
            )}
            {desktop.error && (
              <Row title={t("updates.error")} hint={desktop.error} />
            )}
          </Rows>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => void desktopUpdates().check()}>
              {t("updates.check")}
            </Button>
          </div>
        </Section>
      )}
    </div>
  );
}
