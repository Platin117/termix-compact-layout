import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  getDeveloperMode,
  getHttpsSettings,
  getLogLevel,
  getPasswordResetAllowed,
  getRegistrationAllowed,
  getSecondFactorAfterExternalLogin,
  getSessionTimeout,
  setDeveloperMode,
  updateHttpsSettings,
  updateLogLevel,
  updatePasswordResetAllowed,
  updateRegistrationAllowed,
  updateSecondFactorAfterExternalLogin,
  updateSessionTimeout,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";

const LOG_LEVELS = ["debug", "info", "warn", "error"];

interface ServerState {
  registration: boolean;
  passwordReset: boolean;
  secondFactor: boolean;
  forceHttps: boolean;
  developerMode: boolean;
  /** Developer mode cannot be turned on while the server demands signatures. */
  signedOnly: boolean;
  sessionHours: number;
  logLevel: string;
}

/**
 * The settings that belong to the server rather than to this account.
 *
 * The stock layout has eleven admin pages; core ships the endpoints but no
 * components, so each one has to be rebuilt by hand. This is the first page,
 * the switches and values from "General". Users, roles, sessions, API keys,
 * the audit log, branding, the database, SSL and host defaults are still
 * only in the stock layout.
 */
export function ServerSettings() {
  const { t } = useTranslation();
  const [state, setState] = useState<ServerState | null>(null);
  const [failed, setFailed] = useState(false);
  const [hours, setHours] = useState("");

  useEffect(() => {
    let live = true;
    Promise.all([
      getRegistrationAllowed(),
      getPasswordResetAllowed(),
      getSecondFactorAfterExternalLogin(),
      getHttpsSettings(),
      getDeveloperMode(),
      getSessionTimeout(),
      getLogLevel(),
    ])
      .then(([reg, reset, factor, https, dev, timeout, log]) => {
        if (!live) return;
        setState({
          registration: reg.allowed,
          passwordReset: reset,
          secondFactor: factor.enabled,
          forceHttps: https.forceHttps,
          developerMode: dev.enabled,
          signedOnly: dev.signedOnly,
          sessionHours: timeout.timeoutHours,
          logLevel: log.level,
        });
        setHours(String(timeout.timeoutHours));
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, []);

  if (failed) {
    return (
      <p className="text-sm text-muted-foreground">{t("server.loadFailed")}</p>
    );
  }
  if (!state) {
    return (
      <p className="text-sm text-muted-foreground">{t("settings.loading")}</p>
    );
  }

  // Shown right away, then written. A rejected write puts the switch back.
  const write = <K extends keyof ServerState>(
    key: K,
    value: ServerState[K],
    save: () => Promise<unknown>,
  ) => {
    const before = state[key];
    setState({ ...state, [key]: value });
    save().catch(() => setState((s) => (s ? { ...s, [key]: before } : s)));
  };

  const saveHours = () => {
    const value = Number(hours);
    if (!Number.isFinite(value) || value < 1 || value > 720) {
      setHours(String(state.sessionHours));
      return;
    }
    write("sessionHours", value, () => updateSessionTimeout(value));
  };

  return (
    <div className="flex flex-col gap-4">
      <Toggle
        label={t("server.registration")}
        hint={t("server.registrationHint")}
        checked={state.registration}
        onChange={(v) =>
          write("registration", v, () => updateRegistrationAllowed(v))
        }
      />
      <Toggle
        label={t("server.passwordReset")}
        hint={t("server.passwordResetHint")}
        checked={state.passwordReset}
        onChange={(v) =>
          write("passwordReset", v, () => updatePasswordResetAllowed(v))
        }
      />
      <Toggle
        label={t("server.secondFactor")}
        hint={t("server.secondFactorHint")}
        checked={state.secondFactor}
        onChange={(v) =>
          write("secondFactor", v, () =>
            updateSecondFactorAfterExternalLogin(v),
          )
        }
      />
      <Toggle
        label={t("server.forceHttps")}
        hint={t("server.forceHttpsHint")}
        checked={state.forceHttps}
        onChange={(v) => write("forceHttps", v, () => updateHttpsSettings(v))}
      />
      <Toggle
        label={t("server.developerMode")}
        hint={
          state.signedOnly
            ? t("server.developerModeSigned")
            : t("server.developerModeHint")
        }
        checked={state.developerMode}
        disabled={state.signedOnly}
        onChange={(v) => write("developerMode", v, () => setDeveloperMode(v))}
      />

      <section className="flex flex-col gap-2 border-t border-border pt-4">
        <Label htmlFor="server-timeout">{t("server.sessionTimeout")}</Label>
        <div className="flex items-center gap-2">
          <Input
            id="server-timeout"
            value={hours}
            inputMode="numeric"
            onChange={(e) => setHours(e.target.value)}
            className="h-8 w-24"
          />
          <span className="text-sm text-muted-foreground">
            {t("server.hours")}
          </span>
          <Button
            size="sm"
            onClick={saveHours}
            disabled={hours === String(state.sessionHours)}
          >
            {t("settings.save")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("server.sessionTimeoutHint")}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <Label htmlFor="server-log">{t("server.logLevel")}</Label>
        <Select
          value={state.logLevel}
          onValueChange={(value) =>
            write("logLevel", value, () => updateLogLevel(value))
          }
        >
          <SelectTrigger id="server-log" className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOG_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>
                {t(`server.log.${level}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        aria-label={label}
      />
    </div>
  );
}
