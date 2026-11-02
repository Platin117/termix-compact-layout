import { useEffect, useMemo, useState } from "react";
import {
  Bug,
  Database,
  Donut,
  FileClock,
  Globe,
  KeyRound,
  Keyboard,
  Palette,
  PanelLeft,
  Puzzle,
  RefreshCw,
  ServerCog,
  Shield,
  SlidersHorizontal,
  Users,
  Monitor,
  UserRound,
} from "lucide-react";
import {
  Button,
  PluginIcon,
  hasVisibleFields,
  pluginName,
  useInstalledPlugins,
  useShellController,
  type PluginSummary,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";
import { AppearanceSettings } from "./AppearanceSettings";
import { ApiKeySettings } from "./ApiKeySettings";
import { DataSettings } from "./DataSettings";
import { InterfaceSettings } from "./InterfaceSettings";
import { KeybindingSettings } from "./KeybindingSettings";
import { PluginSettingsForm } from "./PluginSettingsForm";
import { RailSettings } from "./RailSettings";
import { SecuritySettings } from "./SecuritySettings";
import { ServerSettings } from "./ServerSettings";
import { AuditSettings } from "./admin/AuditSettings";
import { DatabaseSettings } from "./admin/DatabaseSettings";
import { HostDefaultsSettings } from "./admin/HostDefaultsSettings";
import { RolesSettings } from "./admin/RolesSettings";
import { SessionsSettings } from "./admin/SessionsSettings";
import { SslSettings } from "./admin/SslSettings";
import { UpdateSettings } from "./admin/UpdateSettings";
import { UsersSettings } from "./admin/UsersSettings";

/** Core does not export its repository URL, so the link is spelled out. */
const ISSUES_URL = "https://github.com/Termix-SSH/Termix/issues/new";

interface Page {
  id: string;
  label: string;
  icon: React.ReactNode;
  render: () => React.ReactNode;
}

interface Group {
  key: string;
  label: string;
  pages: Page[];
}

/** Plugins with settings this user can change, by name. */
function usePluginPages(isAdmin: boolean): PluginSummary[] {
  const plugins = useInstalledPlugins();
  return useMemo(
    () =>
      plugins
        .filter((plugin) => {
          if (!plugin.enabled) return false;
          const settings = plugin.contributes?.settings;
          return (
            hasVisibleFields(settings?.user ?? []) ||
            (isAdmin && hasVisibleFields(settings?.admin ?? []))
          );
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [plugins, isAdmin],
  );
}

const icon = (Icon: typeof Palette) => <Icon className="size-3.5" />;

/**
 * Every settings page the stock layout has, in its four groups.
 *
 * Hiding a page is not simplification: someone who needs roles or the audit
 * log has to leave the layout to find them, and will not come back. The one
 * page missing is Branding, which the plugin API can read but not write.
 */
export function SettingsTab({ section }: { section?: string }) {
  const { t } = useTranslation();
  const shell = useShellController();
  const pluginPages = usePluginPages(shell.isAdmin);

  const groups: Group[] = [
    {
      key: "account",
      label: t("settings.groupAccount"),
      pages: [
        {
          id: "account",
          label: t("settings.account"),
          icon: icon(UserRound),
          render: () => <AccountPage />,
        },
        {
          id: "security",
          label: t("settings.security"),
          icon: icon(Shield),
          render: () => <SecuritySettings />,
        },
        {
          id: "api-keys",
          label: t("settings.apiKeys"),
          icon: icon(KeyRound),
          render: () => <ApiKeySettings scope="user" />,
        },
        {
          id: "data",
          label: t("settings.data"),
          icon: icon(Donut),
          render: () => <DataSettings />,
        },
      ],
    },
    {
      key: "app",
      label: t("settings.groupApp"),
      pages: [
        {
          id: "interface",
          label: t("settings.interface"),
          icon: icon(SlidersHorizontal),
          render: () => <InterfaceSettings />,
        },
        {
          id: "appearance",
          label: t("settings.appearance"),
          icon: icon(Palette),
          render: () => <AppearanceSettings isAdmin={shell.isAdmin} />,
        },
        {
          id: "rail",
          label: t("settings.rail"),
          icon: icon(PanelLeft),
          render: () => <RailSettings />,
        },
        {
          id: "keys",
          label: t("settings.keys"),
          icon: icon(Keyboard),
          render: () => <KeybindingSettings />,
        },
      ],
    },
    {
      key: "plugins",
      label: t("settings.groupPlugins"),
      pages: pluginPages.map((plugin) => ({
        id: `feature:${plugin.id}`,
        label: pluginName(t, plugin),
        icon: <PluginIcon name={plugin.icon} className="size-3.5" />,
        render: () => <PluginPage plugin={plugin} isAdmin={shell.isAdmin} />,
      })),
    },
  ];

  if (shell.isAdmin) {
    groups.push({
      key: "server",
      label: t("settings.groupServer"),
      pages: [
        {
          id: "server",
          label: t("settings.general"),
          icon: icon(ServerCog),
          render: () => <ServerSettings />,
        },
        {
          id: "updates",
          label: t("settings.updates"),
          icon: icon(RefreshCw),
          render: () => <UpdateSettings />,
        },
        {
          id: "users",
          label: t("settings.users"),
          icon: icon(Users),
          render: () => <UsersSettings />,
        },
        {
          id: "sessions",
          label: t("settings.sessions"),
          icon: icon(Monitor),
          render: () => <SessionsSettings />,
        },
        {
          id: "roles",
          label: t("settings.roles"),
          icon: icon(Shield),
          render: () => <RolesSettings />,
        },
        {
          id: "host-defaults",
          label: t("settings.hostDefaults"),
          icon: icon(SlidersHorizontal),
          render: () => <HostDefaultsSettings />,
        },
        {
          id: "database",
          label: t("settings.database"),
          icon: icon(Database),
          render: () => <DatabaseSettings />,
        },
        {
          id: "ssl",
          label: t("settings.ssl"),
          icon: icon(Globe),
          render: () => <SslSettings />,
        },
        {
          id: "server-api-keys",
          label: t("settings.apiKeys"),
          icon: icon(KeyRound),
          render: () => <ApiKeySettings scope="server" />,
        },
        {
          id: "audit",
          label: t("settings.audit"),
          icon: icon(FileClock),
          render: () => <AuditSettings />,
        },
      ],
    });
  }

  const pages = groups.flatMap((group) => group.pages);
  const [active, setActive] = useState(section ?? "appearance");
  useEffect(() => {
    if (section) setActive(section);
  }, [section]);

  // A link to a page this layout does not have lands on Appearance.
  const current = pages.find((page) => page.id === active) ?? pages[0];

  return (
    <div className="flex flex-1 min-h-0 flex-col md:flex-row">
      <nav
        className="flex md:flex-col gap-0.5 overflow-x-auto md:overflow-y-auto border-b md:border-b-0 md:border-r border-border p-2 md:w-56 shrink-0"
        aria-label={t("settings.title")}
      >
        {groups.map((group) =>
          group.pages.length === 0 ? null : (
            <div key={group.key} className="flex md:flex-col gap-0.5">
              <div className="hidden md:block px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group.label}
              </div>
              {group.pages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => setActive(page.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm text-left whitespace-nowrap ${
                    page.id === current.id
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  {page.icon}
                  {page.label}
                </button>
              ))}
            </div>
          ),
        )}

        <a
          href={ISSUES_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-3 py-2 text-sm whitespace-nowrap text-muted-foreground hover:bg-muted/50 hover:text-foreground md:mt-3 md:border-t md:border-border md:pt-3"
        >
          <Bug className="size-3.5" />
          {t("settings.reportBug")}
        </a>

        {shell.isAdmin && (
          <button
            type="button"
            onClick={() => shell.tabs.openSingleton("plugins")}
            className="flex items-center gap-2 px-3 py-2 text-sm text-left whitespace-nowrap text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <Puzzle className="size-3.5" />
            {t("settings.managePlugins")}
          </button>
        )}
      </nav>

      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
          <h1 className="text-base font-semibold">{current.label}</h1>
          {current.render()}
        </div>
      </div>
    </div>
  );
}

function AccountPage() {
  const { t } = useTranslation();
  const shell = useShellController();
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div className="text-sm">
        <div className="font-medium">{shell.username}</div>
        <div className="text-xs text-muted-foreground">
          {shell.isAdmin ? t("settings.roleAdmin") : t("settings.roleUser")}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => shell.logout({ manual: true })}
      >
        {t("nav.logout")}
      </Button>
    </div>
  );
}

function PluginPage({
  plugin,
  isAdmin,
}: {
  plugin: PluginSummary;
  isAdmin: boolean;
}) {
  const { t } = useTranslation();
  return (
    <>
      {hasVisibleFields(plugin.contributes?.settings?.user ?? []) && (
        <PluginSettingsForm
          plugin={plugin}
          scope="user"
          fields={plugin.contributes?.settings?.user ?? []}
        />
      )}
      {isAdmin && hasVisibleFields(plugin.contributes?.settings?.admin ?? []) && (
        <>
          <h2 className="pt-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {t("settings.forAdmins")}
          </h2>
          <PluginSettingsForm
            plugin={plugin}
            scope="admin"
            fields={plugin.contributes?.settings?.admin ?? []}
          />
        </>
      )}
    </>
  );
}
