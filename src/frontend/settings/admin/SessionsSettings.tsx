import { LogOut } from "lucide-react";
import {
  Button,
  getSessions,
  revokeAllUserSessions,
  revokeSession,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";
import { Gate, Row, Rows, Section, useLoad, when } from "../parts";

/** Who is signed in, from where, and a way to end it. */
export function SessionsSettings() {
  const { t } = useTranslation();
  const sessions = useLoad(() => getSessions());

  return (
    <Section title={t("sessions.title")} hint={t("sessions.hint")}>
      <Gate state={sessions}>
        {(data) => {
          const live = data.sessions.filter((s) => !s.isRevoked);
          const users = [...new Set(live.map((s) => s.userId))];
          return (
            <div className="flex flex-col gap-3">
              <Rows empty={t("sessions.none")}>
                {live.map((session) => (
                  <Row
                    key={session.id}
                    title={session.username || session.userId}
                    hint={[
                      session.deviceType,
                      session.deviceInfo,
                      `${t("sessions.lastActive")}: ${when(session.lastActiveAt)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  >
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="size-7"
                      aria-label={t("sessions.revoke")}
                      title={t("sessions.revoke")}
                      onClick={() =>
                        void revokeSession(session.id).then(sessions.reload)
                      }
                    >
                      <LogOut className="size-4" />
                    </Button>
                  </Row>
                ))}
              </Rows>

              {users.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {users.map((userId) => {
                    const label =
                      live.find((s) => s.userId === userId)?.username || userId;
                    return (
                      <Button
                        key={userId}
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void revokeAllUserSessions(userId).then(
                            sessions.reload,
                          )
                        }
                      >
                        {t("sessions.revokeAllFor", { name: label })}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }}
      </Gate>
    </Section>
  );
}
