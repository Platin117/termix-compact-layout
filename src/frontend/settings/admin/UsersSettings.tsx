import { useState } from "react";
import { KeyRound, ShieldOff, ShieldPlus, Trash2 } from "lucide-react";
import {
  Button,
  Input,
  adminCreateUser,
  adminResetUserPassword,
  deleteUser,
  getUserList,
  makeUserAdmin,
  removeAdminStatus,
  useShellController,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";
import { Gate, Row, Rows, Section, useLoad } from "../parts";

type User = Awaited<ReturnType<typeof getUserList>>["users"][number];

/** Who may sign in, and which of them are admins. */
export function UsersSettings() {
  const { t } = useTranslation();
  const shell = useShellController();
  const users = useLoad(() => getUserList());

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [resetting, setResetting] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const run = (work: Promise<unknown>) => {
    setNote(null);
    work.then(() => users.reload()).catch(() => setNote(t("admin.actionFailed")));
  };

  const create = () => {
    run(
      adminCreateUser(name.trim(), password).then(() => {
        setName("");
        setPassword("");
      }),
    );
  };

  const reset = (user: User) => {
    run(
      adminResetUserPassword(user.userId, newPassword).then(() => {
        setResetting(null);
        setNewPassword("");
      }),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Section title={t("users.add")}>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={name}
            placeholder={t("users.username")}
            onChange={(e) => setName(e.target.value)}
            className="h-8 sm:w-48"
          />
          <Input
            type="password"
            value={password}
            placeholder={t("users.password")}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            className="h-8 sm:w-48"
          />
          <Button
            size="sm"
            disabled={!name.trim() || password.length < 8}
            onClick={create}
          >
            {t("users.create")}
          </Button>
        </div>
        {note && <p className="text-xs text-destructive">{note}</p>}
      </Section>

      <Section title={t("users.title")}>
        <Gate state={users}>
          {(data) => (
            <Rows empty={t("users.none")}>
              {data.users.map((user: User) => (
                <Row
                  key={user.userId}
                  title={user.username}
                  hint={[
                    user.is_admin ? t("settings.roleAdmin") : t("settings.roleUser"),
                    user.totp_enabled ? t("users.twoFactorOn") : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                >
                  {resetting === user.userId ? (
                    <>
                      <Input
                        type="password"
                        value={newPassword}
                        placeholder={t("users.newPassword")}
                        autoComplete="new-password"
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-7 w-44"
                      />
                      <Button
                        size="sm"
                        disabled={newPassword.length < 8}
                        onClick={() => reset(user)}
                      >
                        {t("settings.save")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setResetting(null)}
                      >
                        {t("settings.cancel")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-7"
                        aria-label={t("users.resetPassword")}
                        title={t("users.resetPassword")}
                        onClick={() => {
                          setResetting(user.userId);
                          setNewPassword("");
                        }}
                      >
                        <KeyRound className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-7"
                        aria-label={
                          user.is_admin ? t("users.demote") : t("users.promote")
                        }
                        title={
                          user.is_admin ? t("users.demote") : t("users.promote")
                        }
                        onClick={() =>
                          run(
                            user.is_admin
                              ? removeAdminStatus(user.userId)
                              : makeUserAdmin(user.userId),
                          )
                        }
                      >
                        {user.is_admin ? (
                          <ShieldOff className="size-4" />
                        ) : (
                          <ShieldPlus className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-7"
                        disabled={user.username === shell.username}
                        aria-label={t("users.delete")}
                        title={t("users.delete")}
                        onClick={() => run(deleteUser(user.username))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </Row>
              ))}
            </Rows>
          )}
        </Gate>
      </Section>
    </div>
  );
}
