import {
  getDatabaseHealth,
  getDatabaseTransferUrl,
  linkedServerUrl,
  useDesktopLinked,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";
import { Gate, Row, Rows, Section, useLoad } from "../parts";

/**
 * The database's health, and the links that move it.
 *
 * Export and import are plain URLs rather than calls, because the browser has
 * to do the downloading and uploading; core builds them so the desktop app
 * and a browser pointed at a remote server both get a URL that works.
 */
export function DatabaseSettings() {
  const { t } = useTranslation();
  const health = useLoad(() => getDatabaseHealth());
  const electron = useDesktopLinked();

  // The linked server's address is resolved, not known, so it is loaded like
  // anything else and the links wait for it.
  const server = useLoad(() => linkedServerUrl());

  const url = (operation: "export" | "import") =>
    getDatabaseTransferUrl(operation, {
      electron: Boolean(electron),
      configuredServerUrl: server.data ?? undefined,
      location: window.location,
    });

  return (
    <div className="flex flex-col gap-6">
      <Section title={t("database.health")}>
        <Gate state={health}>
          {(data) => (
            <Rows empty={t("database.noHealth")}>
              {Object.entries(data).map(([key, value]) => (
                <Row
                  key={key}
                  title={key}
                  hint={
                    typeof value === "object" && value !== null
                      ? JSON.stringify(value)
                      : String(value)
                  }
                />
              ))}
            </Rows>
          )}
        </Gate>
      </Section>

      <Section title={t("database.transfer")} hint={t("database.transferHint")}>
        <div className="flex flex-wrap gap-2">
          <a
            href={url("export")}
            download
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/50"
          >
            {t("database.export")}
          </a>
          <a
            href={url("import")}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/50"
          >
            {t("database.import")}
          </a>
        </div>
      </Section>
    </div>
  );
}
