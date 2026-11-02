import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  getUserPreferences,
  parseCustomKeybindings,
  saveUserPreferences,
  useKeybindingActions,
  useKeybindingDefaults,
  type CustomKeybinding,
  type KeybindingAction,
  type KeyCombo,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";
import { Row, Rows, Section } from "./parts";

const EMPTY: KeyCombo = {
  key: "",
  isCode: false,
  ctrl: false,
  alt: false,
  shift: false,
  meta: false,
};

const MODIFIERS = new Set(["Control", "Alt", "Shift", "Meta"]);

function comboText(combo: KeyCombo): string {
  const parts = [
    combo.ctrl && "Ctrl",
    combo.alt && "Alt",
    combo.shift && "Shift",
    combo.meta && "Meta",
    combo.key,
  ].filter(Boolean);
  return parts.join(" + ") || "—";
}

/**
 * The keys, and what they run.
 *
 * Every binding -- the defaults and this user's own -- lives in one string in
 * the user preferences, which core parses with parseCustomKeybindings. A
 * default is switched off by storing an override that points at it and is
 * disabled, which is how core reads it back.
 */
export function KeybindingSettings() {
  const { t } = useTranslation();
  const actions = useKeybindingActions();
  const defaults = useKeybindingDefaults();

  const [bindings, setBindings] = useState<CustomKeybinding[] | null>(null);
  const [actionId, setActionId] = useState("");
  const [draft, setDraft] = useState<KeybindingAction | null>(null);
  const [combo, setCombo] = useState<KeyCombo>(EMPTY);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    let live = true;
    getUserPreferences()
      .then((prefs) => {
        if (live) setBindings(parseCustomKeybindings(prefs.customKeybindings));
      })
      .catch(() => live && setBindings([]));
    return () => {
      live = false;
    };
  }, []);

  const write = (next: CustomKeybinding[]) => {
    setBindings(next);
    void saveUserPreferences({ customKeybindings: JSON.stringify(next) });
  };

  // A modifier on its own is not a shortcut, so keep listening until a real
  // key arrives.
  const record = (event: React.KeyboardEvent) => {
    event.preventDefault();
    if (MODIFIERS.has(event.key)) return;
    setCombo({
      key: event.key,
      isCode: false,
      ctrl: event.ctrlKey,
      alt: event.altKey,
      shift: event.shiftKey,
      meta: event.metaKey,
    });
    setRecording(false);
  };

  const add = () => {
    if (!draft || !combo.key || !bindings) return;
    const now = new Date().toISOString();
    write([
      ...bindings,
      {
        id: `compact-${Date.now()}`,
        combo,
        action: draft,
        enabled: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    setActionId("");
    setDraft(null);
    setCombo(EMPTY);
  };

  const setDefaultEnabled = (defaultId: string, enabled: boolean) => {
    if (!bindings) return;
    const rest = bindings.filter((b) => b.overridesDefaultId !== defaultId);
    if (enabled) return write(rest);
    const now = new Date().toISOString();
    write([
      ...rest,
      {
        id: `off-${defaultId}`,
        combo: EMPTY,
        action: { type: defaultId },
        enabled: false,
        overridesDefaultId: defaultId,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  };

  if (bindings === null) {
    return <p className="text-sm text-muted-foreground">{t("settings.loading")}</p>;
  }

  const chosen = actions.find((a) => a.id === actionId);
  const Editor = chosen?.editor;
  const own = bindings.filter((b) => !b.overridesDefaultId);

  return (
    <div className="flex flex-col gap-6">
      <Section title={t("keys.defaults")} hint={t("keys.defaultsHint")}>
        <Rows empty={t("keys.none")}>
          {defaults.map((def) => (
            <Row
              key={def.id}
              title={t(def.descriptionKey)}
              hint={comboText(def.combo)}
            >
              <Switch
                checked={
                  !bindings.some(
                    (b) => b.overridesDefaultId === def.id && !b.enabled,
                  )
                }
                onCheckedChange={(v) => setDefaultEnabled(def.id, v)}
                aria-label={t(def.descriptionKey)}
              />
            </Row>
          ))}
        </Rows>
      </Section>

      <Section title={t("keys.own")}>
        <Rows empty={t("keys.noOwn")}>
          {own.map((binding) => (
            <Row
              key={binding.id}
              title={comboText(binding.combo)}
              hint={binding.action.type}
            >
              <Switch
                checked={binding.enabled}
                onCheckedChange={(v) =>
                  write(
                    bindings.map((b) =>
                      b.id === binding.id ? { ...b, enabled: v } : b,
                    ),
                  )
                }
                aria-label={comboText(binding.combo)}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7"
                aria-label={t("keys.remove")}
                onClick={() =>
                  write(bindings.filter((b) => b.id !== binding.id))
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </Row>
          ))}
        </Rows>
      </Section>

      <Section title={t("keys.add")}>
        <div className="flex flex-col gap-2">
          <Select
            value={actionId}
            onValueChange={(value) => {
              setActionId(value);
              setDraft({ type: value });
            }}
          >
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder={t("keys.pickAction")} />
            </SelectTrigger>
            <SelectContent>
              {actions.map((action) => (
                <SelectItem key={action.id} value={action.id}>
                  {t(action.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {Editor && draft && (
            <Editor action={draft} onChange={(next) => setDraft(next)} />
          )}

          {draft && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onKeyDown={recording ? record : undefined}
                onClick={() => setRecording(true)}
                onBlur={() => setRecording(false)}
                className={`h-8 min-w-48 rounded-lg border px-3 text-left text-sm ${
                  recording
                    ? "border-primary text-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {recording ? t("keys.pressNow") : comboText(combo)}
              </button>
              <Button size="sm" disabled={!combo.key} onClick={add}>
                {t("keys.save")}
              </Button>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
