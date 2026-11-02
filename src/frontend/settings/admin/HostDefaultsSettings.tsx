import { useState } from "react";
import {
  Button,
  CORE_HOST_DEFAULTS,
  Input,
  getHostDefaultsLevel,
  saveHostDefaultsLevel,
  splitDefaultKey,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";
import { Gate, Row, Rows, Section, useLoad } from "../parts";

const LEVEL = { level: "admin" as const };

function text(value: unknown): string {
  if (value === undefined || value === null) return "";
  return typeof value === "string" ? value : JSON.stringify(value);
}

/** Parses what was typed back: JSON when it is JSON, otherwise the text. */
function parse(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === "") return "";
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

/**
 * What a new host starts with, server-wide.
 *
 * Only the keys core declares are offered, and only those an admin may set --
 * CORE_HOST_DEFAULTS says which levels each key allows. A value typed here is
 * read as JSON when it parses as JSON, so numbers and booleans do not arrive
 * as strings; anything else is kept as text.
 */
export function HostDefaultsSettings() {
  const { t } = useTranslation();
  const level = useLoad(() => getHostDefaultsLevel(LEVEL));
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const keys = CORE_HOST_DEFAULTS.filter((entry) =>
    entry.levels.includes("admin"),
  );

  const save = () => {
    const set: Record<string, unknown> = {};
    const unset: string[] = [];
    for (const [key, raw] of Object.entries(draft)) {
      if (raw.trim() === "") unset.push(key);
      else set[key] = parse(raw);
    }
    setBusy(true);
    saveHostDefaultsLevel(LEVEL, { set, unset })
      .then(() => {
        setDraft({});
        level.reload();
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  };

  return (
    <Section title={t("hostDefaults.title")} hint={t("hostDefaults.hint")}>
      <Gate state={level}>
        {(data) => (
          <div className="flex flex-col gap-3">
            <Rows>
              {keys.map((entry) => {
                const [, short] = splitDefaultKey(entry.key);
                const stored = data.values[entry.key];
                const inherited = data.inherited[entry.key];
                const value =
                  draft[entry.key] !== undefined
                    ? draft[entry.key]
                    : text(stored);
                return (
                  <Row
                    key={entry.key}
                    title={short}
                    hint={
                      stored === undefined
                        ? `${t("hostDefaults.inherited")}: ${
                            text(inherited?.value ?? entry.builtin) || "—"
                          }`
                        : entry.key
                    }
                  >
                    <Input
                      value={value}
                      placeholder={text(entry.builtin) || t("hostDefaults.unset")}
                      onChange={(e) =>
                        setDraft({ ...draft, [entry.key]: e.target.value })
                      }
                      className="h-7 w-48 font-mono text-xs"
                    />
                  </Row>
                );
              })}
            </Rows>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                disabled={busy || Object.keys(draft).length === 0}
                onClick={save}
              >
                {t("settings.save")}
              </Button>
              {Object.keys(draft).length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setDraft({})}>
                  {t("settings.cancel")}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("hostDefaults.emptyClears")}
            </p>
          </div>
        )}
      </Gate>
    </Section>
  );
}
