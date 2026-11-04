import { useEffect, useState } from "react";
import {
  ACCENT_PRESET_COLORS,
  FONT_SIZES,
  Input,
  LANGUAGES,
  Label,
  LookSettings,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  applyAccentColor,
  applyFontSize,
  changeAppLanguage,
  getUserPreferences,
  saveUserPreferences,
  useChooseTheme,
  useTheme,
  useThemeOptions,
  type FontSizeId,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";

/** Core's own default, which it does not export. */
const DEFAULT_ACCENT = "#f59145";

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * Theme, accent, text size and language.
 *
 * `LookSettings` is core's, but it only holds the layout picker and the
 * admin defaults -- the controls the stock layout puts beside them are not
 * part of the plugin API, so they are rebuilt here from the pieces that are:
 * the theme registry, the accent and font size appliers, and the user
 * preferences endpoint everything is stored in.
 */
export function AppearanceSettings({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useTranslation();
  const themes = useThemeOptions();
  const { theme } = useTheme();
  const chooseTheme = useChooseTheme();

  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [fontSize, setFontSize] = useState<FontSizeId>("normal" as FontSizeId);
  const [language, setLanguage] = useState("en");

  // The stored values, not what is on screen: an accent applied to the
  // document says nothing about what this account saved.
  useEffect(() => {
    let live = true;
    getUserPreferences()
      .then((prefs) => {
        if (!live) return;
        setAccent(prefs.accentColor || DEFAULT_ACCENT);
        if (prefs.fontSize) setFontSize(prefs.fontSize as FontSizeId);
        if (prefs.language) setLanguage(prefs.language);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const pickAccent = (value: string) => {
    setAccent(value);
    if (!HEX.test(value)) return;
    applyAccentColor(value);
    void saveUserPreferences({ accentColor: value });
  };

  const pickFontSize = (id: FontSizeId) => {
    setFontSize(id);
    applyFontSize(id);
    void saveUserPreferences({ fontSize: id });
  };

  const pickLanguage = (code: string) => {
    setLanguage(code);
    void changeAppLanguage(code);
    void saveUserPreferences({ language: code });
  };

  return (
    <div className="flex flex-col gap-6">
      <LookSettings isAdmin={isAdmin} />

      <section className="flex flex-col gap-2">
        <Label>{t("look.theme")}</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {themes.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => chooseTheme(option.id)}
              aria-pressed={option.id === theme}
              className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs ${
                option.id === theme
                  ? "border-primary ring-1 ring-inset ring-primary/40"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <Swatch option={option} />
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <Label>{t("look.accent")}</Label>
        <div className="flex flex-wrap items-center gap-1.5">
          {ACCENT_PRESET_COLORS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => pickAccent(preset.value)}
              title={preset.label}
              aria-label={preset.label}
              aria-pressed={preset.value.toLowerCase() === accent.toLowerCase()}
              className={`size-7 rounded-full border-2 ${
                preset.value.toLowerCase() === accent.toLowerCase()
                  ? "border-foreground"
                  : "border-transparent"
              }`}
              style={{ background: preset.value }}
            />
          ))}
          <Input
            value={accent}
            onChange={(e) => pickAccent(e.target.value)}
            spellCheck={false}
            aria-label={t("look.accentCustom")}
            className="h-8 w-28 font-mono text-xs"
          />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <Label htmlFor="look-font-size">{t("look.fontSize")}</Label>
        <Select
          value={fontSize}
          onValueChange={(value) => pickFontSize(value as FontSizeId)}
        >
          <SelectTrigger id="look-font-size" className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((size) => (
              <SelectItem key={size.id} value={size.id}>
                {size.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section className="flex flex-col gap-2">
        <Label htmlFor="look-language">{t("look.language")}</Label>
        <Select value={language} onValueChange={pickLanguage}>
          <SelectTrigger id="look-language" className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((entry) => (
              <SelectItem key={entry.code} value={entry.code}>
                {entry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>
    </div>
  );
}

/** A theme's colours, or light over dark for System, which has no swatch. */
function Swatch({
  option,
}: {
  option: ReturnType<typeof useThemeOptions>[number];
}) {
  if (!option.swatch) {
    return (
      <span className="size-7 shrink-0 overflow-hidden rounded-md border border-border">
        <span className="block h-1/2 bg-white" />
        <span className="block h-1/2 bg-neutral-900" />
      </span>
    );
  }
  return (
    <span
      className="flex size-7 shrink-0 items-end gap-0.5 overflow-hidden rounded-md border border-border p-1"
      style={{ background: option.swatch.background }}
    >
      <span
        className="h-3 flex-1 rounded-sm"
        style={{ background: option.swatch.panel }}
      />
      <span
        className="h-1.5 w-1 rounded-sm"
        style={{ background: option.swatch.text }}
      />
    </span>
  );
}
