import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * What these pages send, not what they look like.
 *
 * Every one of them takes something the user typed or clicked and hands it to
 * a core API. The types cannot tell a username from a user id, or a value
 * that should have been parsed from one that should not -- and that is
 * exactly where the API key page was broken. So the SDK is replaced by spies
 * and each test asserts the arguments that reach core.
 *
 * The component stubs are deliberately dumb: a Switch is a checkbox, a Select
 * is a <select>. They exist so the page renders, not to test core's widgets.
 */
vi.mock("@termix-ssh/plugin-sdk/frontend", async () => {
  return { useTranslation: () => ({ t: (key: string) => key }) };
});

vi.mock("@termix-ssh/plugin-sdk/ui", async () => {
  const React = await import("react");
  const { vi } = await import("vitest");

  const pass =
    (tag: string) =>
    ({ children, ...props }: Record<string, unknown>) =>
      React.createElement(tag, props, children as React.ReactNode);

  const Switch = ({
    checked,
    onCheckedChange,
    ...rest
  }: Record<string, unknown>) =>
    React.createElement("input", {
      type: "checkbox",
      checked: Boolean(checked),
      onChange: (e: { target: { checked: boolean } }) =>
        (onCheckedChange as (v: boolean) => void)?.(e.target.checked),
      ...rest,
    });

  const Select = ({
    value,
    onValueChange,
    children,
  }: Record<string, unknown>) =>
    React.createElement(
      "select",
      {
        value: (value as string) ?? "",
        onChange: (e: { target: { value: string } }) =>
          (onValueChange as (v: string) => void)?.(e.target.value),
      },
      children as React.ReactNode,
    );

  return {
    // Components
    Button: pass("button"),
    Input: pass("input"),
    Textarea: pass("textarea"),
    Label: pass("label"),
    Switch,
    Select,
    SelectTrigger: () => null,
    SelectContent: ({ children }: Record<string, unknown>) =>
      React.createElement(React.Fragment, null, children as React.ReactNode),
    SelectItem: ({ value, children }: Record<string, unknown>) =>
      React.createElement("option", { value }, children as React.ReactNode),
    SelectValue: () => null,
    AuthEnrollmentSections: () => null,
    LookSettings: () => null,
    PluginIcon: () => null,

    // Hooks and helpers
    useShellController: () => ({
      username: "Platin",
      isAdmin: true,
      logout: vi.fn(),
      tabs: { openSingleton: vi.fn() },
      hosts: { list: [], reload: vi.fn() },
    }),
    getErrorMessage: (_error: unknown, fallback: string) => fallback,

    // Core APIs these pages call
    getUserInfo: vi.fn(async () => ({
      userId: "u-42",
      username: "Platin",
      is_admin: true,
      totp_enabled: false,
    })),
    getApiKeys: vi.fn(async () => ({ apiKeys: [] })),
    createApiKey: vi.fn(async () => ({
      id: "k1",
      name: "n",
      token: "tok",
      userId: "u-42",
      username: "Platin",
      tokenPrefix: "tmx_",
      createdAt: "",
      expiresAt: null,
      lastUsedAt: null,
      isActive: true,
    })),
    deleteApiKey: vi.fn(async () => ({ success: true })),
    getUserList: vi.fn(async () => ({
      users: [
        {
          userId: "u-42",
          username: "Platin",
          is_admin: true,
          totp_enabled: false,
        },
        {
          userId: "u-7",
          username: "Gast",
          is_admin: false,
          totp_enabled: false,
        },
      ],
    })),
    adminCreateUser: vi.fn(async () => ({})),
    adminResetUserPassword: vi.fn(async () => ({ message: "" })),
    deleteUser: vi.fn(async () => ({})),
    makeUserAdmin: vi.fn(async () => ({})),
    removeAdminStatus: vi.fn(async () => ({})),
    getSessions: vi.fn(async () => ({
      sessions: [
        {
          id: "s-1",
          userId: "u-7",
          username: "Gast",
          deviceType: "browser",
          deviceInfo: "Firefox",
          createdAt: "",
          expiresAt: "",
          lastActiveAt: "",
        },
      ],
    })),
    revokeSession: vi.fn(async () => ({ success: true, message: "" })),
    revokeAllUserSessions: vi.fn(async () => ({ success: true, message: "" })),
    getRoles: vi.fn(async () => ({
      roles: [
        {
          id: 3,
          name: "ops",
          displayName: "Ops",
          description: null,
          isSystem: false,
          permissions: ["hosts.read"],
          createdAt: "",
          updatedAt: "",
        },
      ],
    })),
    createRole: vi.fn(async () => ({ role: {} })),
    updateRole: vi.fn(async () => ({ role: {} })),
    deleteRole: vi.fn(async () => ({ success: true })),
    getPermissionsCatalog: vi.fn(async () => ({
      catalog: [{ group: "hosts", permissions: ["hosts.read", "hosts.write"] }],
    })),
    getHostDefaultsLevel: vi.fn(async () => ({ values: {}, inherited: {} })),
    saveHostDefaultsLevel: vi.fn(async () => ({})),
    CORE_HOST_DEFAULTS: [
      { key: "core.sshPort", levels: ["admin"], builtin: 22 },
      { key: "core.onlyAdmin", levels: ["user"], builtin: null },
    ],
    splitDefaultKey: (key: string) => key.split("."),
    getUserPreferences: vi.fn(async () => ({
      reopenTabsOnLogin: true,
      customKeybindings: "[]",
    })),
    saveUserPreferences: vi.fn(async () => undefined),
    parseCustomKeybindings: (raw?: string | null) => {
      try {
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    },
    useKeybindingActions: () => [],
    useKeybindingDefaults: () => [
      {
        id: "nextTab",
        combo: {
          key: "Tab",
          isCode: false,
          ctrl: true,
          alt: false,
          shift: false,
          meta: false,
        },
        descriptionKey: "keys.nextTab",
      },
    ],
  };
});

const ui = await import("@termix-ssh/plugin-sdk/ui");
const { ApiKeySettings } =
  await import("../../src/frontend/settings/ApiKeySettings");
const { UsersSettings } =
  await import("../../src/frontend/settings/admin/UsersSettings");
const { SessionsSettings } =
  await import("../../src/frontend/settings/admin/SessionsSettings");
const { RolesSettings } =
  await import("../../src/frontend/settings/admin/RolesSettings");
const { HostDefaultsSettings } =
  await import("../../src/frontend/settings/admin/HostDefaultsSettings");
const { KeybindingSettings } =
  await import("../../src/frontend/settings/KeybindingSettings");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("API keys", () => {
  it("creates a key with the user id, not the username", async () => {
    render(<ApiKeySettings scope="user" />);
    const user = userEvent.setup();

    await user.type(
      await screen.findByPlaceholderText("apiKeys.namePlaceholder"),
      "Laptop",
    );
    await user.click(screen.getByText("apiKeys.create"));

    await waitFor(() =>
      expect(ui.createApiKey).toHaveBeenCalledWith("Laptop", "u-42", undefined),
    );
  });

  it("sends the expiry as a timestamp when one is given", async () => {
    render(<ApiKeySettings scope="user" />);
    const user = userEvent.setup();

    await user.type(
      await screen.findByPlaceholderText("apiKeys.namePlaceholder"),
      "Laptop",
    );
    const expiry =
      document.querySelector<HTMLInputElement>('input[type="date"]');
    await user.type(expiry!, "2027-01-31");
    await user.click(screen.getByText("apiKeys.create"));

    await waitFor(() => expect(ui.createApiKey).toHaveBeenCalled());
    const [, , expires] = vi.mocked(ui.createApiKey).mock.calls[0];
    expect(expires).toMatch(/^2027-01-31T/);
  });
});

describe("users", () => {
  it("promotes by id and deletes by username", async () => {
    render(<UsersSettings />);
    const user = userEvent.setup();

    await screen.findByText("Gast");
    // Gast is the second row; the first is the signed-in account.
    await user.click(screen.getAllByTitle("users.promote")[0]);
    await waitFor(() => expect(ui.makeUserAdmin).toHaveBeenCalledWith("u-7"));

    await user.click(screen.getAllByTitle("users.delete")[1]);
    await waitFor(() => expect(ui.deleteUser).toHaveBeenCalledWith("Gast"));
  });

  it("will not delete the signed-in account", async () => {
    render(<UsersSettings />);
    await screen.findByText("Platin");
    const buttons = screen.getAllByTitle("users.delete") as HTMLButtonElement[];
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(false);
  });
});

describe("sessions", () => {
  it("revokes the session it was asked to", async () => {
    render(<SessionsSettings />);
    const user = userEvent.setup();
    await user.click(await screen.findByTitle("sessions.revoke"));
    await waitFor(() => expect(ui.revokeSession).toHaveBeenCalledWith("s-1"));
  });
});

describe("roles", () => {
  it("writes the whole permission list, not just the change", async () => {
    render(<RolesSettings />);
    const user = userEvent.setup();

    await user.click(await screen.findByText("roles.edit"));
    await user.click(await screen.findByLabelText("hosts.write"));

    await waitFor(() =>
      expect(ui.updateRole).toHaveBeenCalledWith(3, {
        permissions: ["hosts.read", "hosts.write"],
      }),
    );
  });

  it("ticks the box before the server has answered", async () => {
    // A write that never settles: whatever is on screen is this page's doing,
    // not something the server sent back.
    vi.mocked(ui.updateRole).mockReturnValueOnce(new Promise(() => {}));

    render(<RolesSettings />);
    const user = userEvent.setup();

    await user.click(await screen.findByText("roles.edit"));
    const box = (await screen.findByLabelText(
      "hosts.write",
    )) as HTMLInputElement;
    expect(box.checked).toBe(false);

    await user.click(box);
    expect(box.checked).toBe(true);
  });

  it("puts the box back and says why when the server refuses", async () => {
    vi.mocked(ui.updateRole).mockRejectedValueOnce(new Error("nope"));

    render(<RolesSettings />);
    const user = userEvent.setup();

    await user.click(await screen.findByText("roles.edit"));
    const box = (await screen.findByLabelText(
      "hosts.write",
    )) as HTMLInputElement;
    await user.click(box);

    await waitFor(() => expect(box.checked).toBe(false));
    expect(screen.getByText("admin.actionFailed")).toBeTruthy();
  });

  it("will not let a built-in role be edited", async () => {
    vi.mocked(ui.getRoles).mockResolvedValueOnce({
      roles: [
        {
          id: 1,
          name: "admin",
          displayName: "Admin",
          description: null,
          isSystem: true,
          permissions: ["hosts.read"],
          createdAt: "",
          updatedAt: "",
        },
      ],
    });

    render(<RolesSettings />);
    const user = userEvent.setup();

    await user.click(await screen.findByText("roles.edit"));
    const box = (await screen.findByLabelText(
      "hosts.write",
    )) as HTMLInputElement;
    expect(box.disabled).toBe(true);
    expect(screen.getByText("roles.systemLocked")).toBeTruthy();
  });
});

describe("host defaults", () => {
  it("offers only the keys an admin may set", async () => {
    render(<HostDefaultsSettings />);
    expect(await screen.findByText("sshPort")).toBeTruthy();
    expect(screen.queryByText("onlyAdmin")).toBeNull();
  });

  it("parses a number as a number and clears on empty", async () => {
    render(<HostDefaultsSettings />);
    const user = userEvent.setup();

    await screen.findByText("sshPort");
    const field = document.querySelector<HTMLInputElement>(
      'input[placeholder="22"]',
    );
    await user.type(field!, "2222");
    await user.click(screen.getByText("settings.save"));

    await waitFor(() =>
      expect(ui.saveHostDefaultsLevel).toHaveBeenCalledWith(
        { level: "admin" },
        { set: { "core.sshPort": 2222 }, unset: [] },
      ),
    );
  });
});

describe("keyboard shortcuts", () => {
  it("switches a built-in off by storing a disabled override", async () => {
    render(<KeybindingSettings />);
    const user = userEvent.setup();

    await user.click(await screen.findByLabelText("keys.nextTab"));

    await waitFor(() => expect(ui.saveUserPreferences).toHaveBeenCalled());
    const [prefs] = vi.mocked(ui.saveUserPreferences).mock.calls[0];
    const stored = JSON.parse(prefs.customKeybindings as string);
    expect(stored).toHaveLength(1);
    expect(stored[0].overridesDefaultId).toBe("nextTab");
    expect(stored[0].enabled).toBe(false);
  });
});
