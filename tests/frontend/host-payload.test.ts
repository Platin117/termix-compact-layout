import { describe, expect, it, vi } from "vitest";

/**
 * What the host editor sends for the fields this layout had no inputs for.
 *
 * The data layer carried all of them long before the form did -- which is
 * exactly why the sudo password went missing for so long: nothing broke, it
 * simply never reached the server. These assert the shapes core expects,
 * where a list must stay a list and an empty choice must become null rather
 * than an empty string.
 */
// No protocol plugins installed, which is the plain SSH case these assert.
vi.mock("@termix-ssh/plugin-sdk/ui", () => ({
  listHostProtocols: () => [],
  protocolPort: () => undefined,
}));

vi.mock("@termix-ssh/plugin-sdk/frontend", () => ({
  HOST_PROTOCOL_SECRET_KEPT: "__kept__",
}));

const { buildHostEditorPayload, createHostEditorForm } = await import(
  "../../src/frontend/manage/form/host-editor-data"
);

type Form = ReturnType<typeof createHostEditorForm>;

function formWith(patch: Partial<Form>): Form {
  return { ...createHostEditorForm(null), ...patch } as Form;
}

const sshOn = { enableSsh: true } as Parameters<
  typeof buildHostEditorPayload
>[1];

describe("what the host editor sends", () => {
  it("sends tags as a list, not a line of text", () => {
    const payload = buildHostEditorPayload(
      formWith({ tags: ["web", "db"] }),
      sshOn,
    );
    expect(payload.tags).toEqual(["web", "db"]);
  });

  it("turns an unset parent into null rather than an empty string", () => {
    expect(buildHostEditorPayload(formWith({}), sshOn).parentHostId).toBeNull();
    expect(
      buildHostEditorPayload(formWith({ parentHostId: "7" }), sshOn)
        .parentHostId,
    ).toBe(7);
  });

  it("numbers the jump hosts it was given ids for", () => {
    const payload = buildHostEditorPayload(
      formWith({ jumpHosts: [{ hostId: "3" }, { hostId: "9" }] }),
      sshOn,
    );
    expect(payload.jumpHosts).toEqual([{ hostId: 3 }, { hostId: 9 }]);
  });

  it("sends the proxy chain only when the chain mode is chosen", () => {
    const chain = [{ host: "a", port: 1080, type: 5 as const }];

    const single = buildHostEditorPayload(
      formWith({ socks5ProxyMode: "single", socks5ProxyChain: chain }),
      sshOn,
    );
    expect(single.socks5ProxyChain).toBeNull();

    const chained = buildHostEditorPayload(
      formWith({ socks5ProxyMode: "chain", socks5ProxyChain: chain }),
      sshOn,
    );
    expect(chained.socks5ProxyChain).toEqual(chain);
  });

  it("keeps a null status check interval, which follows the server", () => {
    expect(
      buildHostEditorPayload(formWith({ statusCheckInterval: null }), sshOn)
        .statusCheckInterval,
    ).toBeNull();
    expect(
      buildHostEditorPayload(formWith({ statusCheckInterval: 30 }), sshOn)
        .statusCheckInterval,
    ).toBe(30);
  });

  it("carries the port knock sequence through untouched", () => {
    const knocks = [{ port: 1234, protocol: "tcp" as const, delay: 100 }];
    expect(
      buildHostEditorPayload(formWith({ portKnockSequence: knocks }), sshOn)
        .portKnockSequence,
    ).toEqual(knocks);
  });
});
