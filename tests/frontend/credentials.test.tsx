import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * What the credential form sends, not what it looks like.
 *
 * It does three things the types cannot check: it splits a typed line into
 * the tag list core stores, it turns an empty optional field into null
 * rather than "", and it keeps the public key that the generator handed
 * back so the pair is saved together. Each is asserted on the arguments
 * that reach core.
 */
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@termix-ssh/plugin-sdk/frontend", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@termix-ssh/plugin-sdk/ui", async () => {
  const React = await import("react");
  const { vi } = await import("vitest");

  const Labelled = ({ label, children }: Record<string, unknown>) =>
    React.createElement(
      "label",
      null,
      label as string,
      children as React.ReactNode,
    );

  const Typed = ({
    label,
    value,
    onChange,
    mono: _mono,
  }: Record<string, unknown>) =>
    React.createElement(
      "label",
      null,
      label as string,
      React.createElement("input", {
        value: (value as string) ?? "",
        onChange: (e: { target: { value: string } }) =>
          (onChange as (v: string) => void)?.(e.target.value),
      }),
    );

  return {
    Field: Labelled,
    TextField: Typed,
    SelectField: ({
      label,
      value,
      onChange,
      options,
    }: Record<string, unknown>) =>
      React.createElement(
        "label",
        null,
        label as string,
        React.createElement(
          "select",
          {
            value: (value as string) ?? "",
            onChange: (e: { target: { value: string } }) =>
              (onChange as (v: string) => void)?.(e.target.value),
          },
          (options as { value: string; label: string }[]).map((option) =>
            React.createElement(
              "option",
              { key: option.value, value: option.value },
              option.label,
            ),
          ),
        ),
      ),
    Input: (props: Record<string, unknown>) =>
      React.createElement("input", props),
    PasswordInput: (props: Record<string, unknown>) =>
      React.createElement("input", { type: "password", ...props }),
    Textarea: (props: Record<string, unknown>) =>
      React.createElement("textarea", props),
    FormFooter: ({ onSave, saveLabel }: Record<string, unknown>) =>
      React.createElement(
        "button",
        { onClick: onSave as () => void },
        saveLabel as string,
      ),

    // Stands in for Credential Tools: the real one is only there when that
    // plugin is installed, so the form must work either way.
    PluginComponent: ({ id, onGenerated }: Record<string, unknown>) =>
      id === "credentials.keyGenerator"
        ? React.createElement(
            "button",
            {
              onClick: () =>
                (
                  onGenerated as (p: {
                    privateKey: string;
                    publicKey: string;
                  }) => void
                )?.({ privateKey: "PRIV", publicKey: "ssh-ed25519 AAAA" }),
            },
            "generate",
          )
        : null,

    getCredentials: vi.fn(async () => [
      { id: 1, name: "a", folder: "Arbeit" },
      { id: 2, name: "b", folder: "Arbeit" },
      { id: 3, name: "c", folder: "Privat" },
    ]),
    createCredential: vi.fn(async () => ({})),
    updateCredential: vi.fn(async () => ({})),
  };
});

const ui = await import("@termix-ssh/plugin-sdk/ui");
const { CredentialForm } =
  await import("../../src/frontend/manage/CredentialForm");

const noop = () => {};

beforeEach(() => {
  vi.clearAllMocks();
});

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  const name = await screen.findByLabelText("credentialForm.name");
  await user.type(name, "Laptop");
  await user.type(screen.getByLabelText("credentialForm.username"), "root");
}

describe("credentials", () => {
  it("sends the tag line as a list and empty fields as null", async () => {
    render(<CredentialForm credential={null} onBack={noop} onSaved={noop} />);
    const user = userEvent.setup();

    await fillRequired(user);
    await user.type(
      screen.getByLabelText("credentialForm.tags"),
      " web , , db ",
    );
    await user.type(screen.getByLabelText("credentialForm.password"), "secret");
    await user.click(screen.getByText("credentialForm.add"));

    await waitFor(() => expect(ui.createCredential).toHaveBeenCalled());
    const [data] = vi.mocked(ui.createCredential).mock.calls[0];
    expect(data.tags).toEqual(["web", "db"]);
    // Untouched, so core is told to clear them rather than store "".
    expect(data.description).toBeNull();
    expect(data.folder).toBeNull();
  });

  it("keeps the public key a generated pair came with", async () => {
    render(<CredentialForm credential={null} onBack={noop} onSaved={noop} />);
    const user = userEvent.setup();

    await fillRequired(user);
    await user.selectOptions(
      screen.getByLabelText("credentialForm.type"),
      "key",
    );
    await user.click(screen.getByText("generate"));
    await user.click(screen.getByText("credentialForm.add"));

    await waitFor(() => expect(ui.createCredential).toHaveBeenCalled());
    const [data] = vi.mocked(ui.createCredential).mock.calls[0];
    expect(data.key).toBe("PRIV");
    expect(data.publicKey).toBe("ssh-ed25519 AAAA");
  });

  it("offers each folder already in use, once", async () => {
    render(<CredentialForm credential={null} onBack={noop} onSaved={noop} />);

    await waitFor(() =>
      expect(document.querySelectorAll("datalist option")).toHaveLength(2),
    );
    const offered = [...document.querySelectorAll("datalist option")].map(
      (option) => option.getAttribute("value"),
    );
    expect(offered).toEqual(["Arbeit", "Privat"]);
  });
});
