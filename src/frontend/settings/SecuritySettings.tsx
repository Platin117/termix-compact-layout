import { useState } from "react";
import {
  AuthEnrollmentSections,
  Button,
  Input,
  Label,
  changePassword,
  deleteAccount,
  useShellController,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";
import { Section } from "./parts";

/** Second factors, the account password, and closing the account. */
export function SecuritySettings() {
  const { t } = useTranslation();
  const shell = useShellController();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [armed, setArmed] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteNote, setDeleteNote] = useState<string | null>(null);

  const canSave = current && next.length >= 8 && next === again && !busy;

  const save = () => {
    setBusy(true);
    setNote(null);
    changePassword(current, next)
      .then(() => {
        setCurrent("");
        setNext("");
        setAgain("");
        setNote(t("security.passwordChanged"));
      })
      .catch(() => setNote(t("security.passwordFailed")))
      .finally(() => setBusy(false));
  };

  // Closing the account logs this browser out; the shell handles the rest.
  const close = () => {
    setDeleteNote(null);
    deleteAccount(confirmPassword)
      .then(() => shell.logout({ manual: true }))
      .catch(() => setDeleteNote(t("security.deleteFailed")));
  };

  return (
    <div className="flex flex-col gap-6">
      <AuthEnrollmentSections />

      <Section title={t("security.password")} hint={t("security.passwordHint")}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pw-current">{t("security.currentPassword")}</Label>
          <Input
            id="pw-current"
            type="password"
            value={current}
            autoComplete="current-password"
            onChange={(e) => setCurrent(e.target.value)}
            className="sm:w-80"
          />
          <Label htmlFor="pw-next">{t("security.newPassword")}</Label>
          <Input
            id="pw-next"
            type="password"
            value={next}
            autoComplete="new-password"
            onChange={(e) => setNext(e.target.value)}
            className="sm:w-80"
          />
          <Label htmlFor="pw-again">{t("security.repeatPassword")}</Label>
          <Input
            id="pw-again"
            type="password"
            value={again}
            autoComplete="new-password"
            onChange={(e) => setAgain(e.target.value)}
            className="sm:w-80"
          />
          <div className="flex items-center gap-3">
            <Button size="sm" disabled={!canSave} onClick={save}>
              {t("settings.save")}
            </Button>
            {note && (
              <span className="text-xs text-muted-foreground">{note}</span>
            )}
          </div>
        </div>
      </Section>

      <Section
        title={t("security.deleteAccount")}
        hint={t("security.deleteHint")}
      >
        {!armed ? (
          <div>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => setArmed(true)}
            >
              {t("security.deleteAccount")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border border-destructive/40 p-3">
            <p className="text-sm">{t("security.deleteConfirm")}</p>
            <Input
              type="password"
              value={confirmPassword}
              autoComplete="current-password"
              placeholder={t("security.currentPassword")}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="sm:w-80"
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="destructive"
                disabled={!confirmPassword}
                onClick={close}
              >
                {t("security.deleteForever")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setArmed(false)}>
                {t("settings.cancel")}
              </Button>
            </div>
            {deleteNote && (
              <span className="text-xs text-destructive">{deleteNote}</span>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}
