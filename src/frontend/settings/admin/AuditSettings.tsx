import { useState } from "react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  getAuditLogActions,
  getAuditLogs,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";
import { Gate, Row, Rows, Section, useLoad, when } from "../parts";

const ALL = "__all__";

/** What happened on this server, newest first. */
export function AuditSettings() {
  const { t } = useTranslation();
  const [action, setAction] = useState(ALL);
  const [page, setPage] = useState(1);

  const actions = useLoad(() => getAuditLogActions());
  const logs = useLoad(
    () =>
      getAuditLogs({
        page,
        limit: 50,
        ...(action === ALL ? {} : { action }),
      }),
    [page, action],
  );

  return (
    <Section title={t("audit.title")}>
      <div className="flex flex-col gap-3">
        <Gate state={actions}>
          {(data) => (
            <Select
              value={action}
              onValueChange={(value) => {
                setAction(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("audit.allActions")}</SelectItem>
                {data.actions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Gate>

        <Gate state={logs}>
          {(data) => (
            <div className="flex flex-col gap-2">
              <Rows empty={t("audit.none")}>
                {data.logs.map((log) => (
                  <Row
                    key={log.id}
                    title={
                      <span className="flex items-center gap-2">
                        <span
                          className={`size-1.5 shrink-0 rounded-full ${
                            log.success ? "bg-success" : "bg-destructive"
                          }`}
                        />
                        {log.action}
                        {log.resourceName && (
                          <span className="text-muted-foreground">
                            {log.resourceName}
                          </span>
                        )}
                      </span>
                    }
                    hint={[
                      log.username,
                      log.ipAddress,
                      when(log.timestamp),
                      log.errorMessage,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                ))}
              </Rows>

              {data.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    {t("audit.previous")}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {t("audit.page", { page: data.page, total: data.totalPages })}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= data.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    {t("audit.next")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Gate>
      </div>
    </Section>
  );
}
