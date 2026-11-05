import {
  Field,
  FieldPair,
  Input,
  PasswordInput,
  Repeater,
  SelectField,
  SwitchRow,
  TagInput,
  Textarea,
  TextField,
  useShellController,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";
import type { HostEditorForm } from "./form/host-editor-data";

/**
 * The host fields this layout did not offer.
 *
 * Every one of them was already carried by the editor's data layer and sent
 * on save -- only the inputs were missing, which is how the sudo password
 * went unnoticed for so long. They are grouped the way a compact editor can
 * carry them: the everyday ones stay on the main form, and these two
 * sections hold what you set once and forget.
 *
 * Built from the SDK's own fields rather than hand-rolled ones. The first
 * attempt used the bare `Switch`, which is the Radix control and draws no
 * label at all -- ten settings arrived as unlabelled toggles. `SwitchRow`,
 * `Repeater` and `TagInput` are the labelled versions the stock editor uses.
 */

type SetField = (key: string, value: unknown) => void;

/** Tags, notes and the like: what the host is to you, not how it connects. */
export function HostOrganisation({
  form,
  setField,
  hostId,
}: {
  form: HostEditorForm;
  setField: SetField;
  /** The host being edited, so it cannot be made its own parent. */
  hostId?: string | number;
}) {
  const { t } = useTranslation();
  const shell = useShellController();
  const parents = shell.hosts.list.filter(
    (other) => String(other.id) !== String(hostId ?? ""),
  );

  return (
    <>
      <Field label={t("hostForm.tags")} hint={t("hostForm.tagsHint")}>
        <TagInput
          tags={form.tags as string[]}
          input={String(form.tagInput)}
          placeholder={t("hostForm.tagsPlaceholder")}
          onTagsChange={(tags) => setField("tags", tags)}
          onInputChange={(value) => setField("tagInput", value)}
        />
      </Field>

      <Field label={t("hostForm.notes")}>
        <Textarea
          value={String(form.notes)}
          onChange={(e) => setField("notes", e.target.value)}
          className="min-h-20 text-xs"
        />
      </Field>

      <SelectField
        label={t("hostForm.parentHost")}
        value={String(form.parentHostId)}
        onChange={(value) => setField("parentHostId", value)}
        options={[
          { value: "", label: t("hostForm.parentHostNone") },
          ...parents.map((other) => ({
            value: String(other.id),
            label: other.name || other.ip,
          })),
        ]}
      />

      <SwitchRow
        label={t("hostForm.pin")}
        checked={Boolean(form.pin)}
        onChange={(value) => setField("pin", value)}
      />
      <SwitchRow
        label={t("hostForm.localOnly")}
        checked={Boolean(form.localOnly)}
        onChange={(value) => setField("localOnly", value)}
      />
    </>
  );
}

/** How the connection behaves once it is up. */
export function HostAdvanced({
  form,
  setField,
}: {
  form: HostEditorForm;
  setField: SetField;
}) {
  const { t } = useTranslation();
  const env = form.environmentVariables as { key: string; value: string }[];

  return (
    <div className="flex flex-col gap-3">
      <FieldPair>
        <TextField
          label={t("hostForm.keepaliveInterval")}
          value={String(form.keepaliveInterval)}
          onChange={(value) =>
            setField("keepaliveInterval", Number(value) || 0)
          }
        />
        <TextField
          label={t("hostForm.keepaliveCountMax")}
          value={String(form.keepaliveCountMax)}
          onChange={(value) =>
            setField("keepaliveCountMax", Number(value) || 0)
          }
        />
      </FieldPair>

      <SelectField
        label={t("hostForm.keyType")}
        value={String(form.keyType)}
        onChange={(value) => setField("keyType", value)}
        options={[
          { value: "auto", label: t("hostForm.keyTypeAuto") },
          { value: "ssh-ed25519", label: "ssh-ed25519" },
          { value: "ssh-rsa", label: "ssh-rsa" },
          { value: "ecdsa-sha2-nistp256", label: "ecdsa-sha2-nistp256" },
        ]}
      />

      <SwitchRow
        label={t("hostForm.allowLegacy")}
        checked={Boolean(form.allowLegacyAlgorithms)}
        onChange={(value) => setField("allowLegacyAlgorithms", value)}
      />
      <SwitchRow
        label={t("hostForm.forceKeyboardInteractive")}
        checked={Boolean(form.forceKeyboardInteractive)}
        onChange={(value) => setField("forceKeyboardInteractive", value)}
      />
      <SwitchRow
        label={t("hostForm.overrideCredentialUsername")}
        checked={Boolean(form.overrideCredentialUsername)}
        onChange={(value) => setField("overrideCredentialUsername", value)}
      />
      <SwitchRow
        label={t("hostForm.shareSshAuth")}
        checked={Boolean(form.shareSshAuth)}
        onChange={(value) => setField("shareSshAuth", value)}
      />

      <SwitchRow
        label={t("hostForm.agentForwarding")}
        checked={Boolean(form.agentForwarding)}
        onChange={(value) => setField("agentForwarding", value)}
      />
      {Boolean(form.agentForwarding) && (
        <FieldPair>
          <TextField
            label={t("hostForm.agentSocketPath")}
            value={String(form.agentSocketPath)}
            onChange={(value) => setField("agentSocketPath", value)}
            mono
          />
          <TextField
            label={t("hostForm.agentIdentity")}
            value={String(form.agentIdentity)}
            onChange={(value) => setField("agentIdentity", value)}
            mono
          />
        </FieldPair>
      )}

      <Repeater
        label={t("hostForm.environment")}
        hint={t("hostForm.environmentHint")}
        items={env}
        onChange={(items) => setField("environmentVariables", items)}
        makeItem={() => ({ key: "", value: "" })}
        empty={t("hostForm.environmentEmpty")}
        addLabel={t("hostForm.environmentAdd")}
        renderItem={(item, update) => (
          <>
            <Input
              value={item.key}
              onChange={(e) => update({ ...item, key: e.target.value })}
              placeholder="LANG"
              className="font-mono text-xs"
            />
            <Input
              value={item.value}
              onChange={(e) => update({ ...item, value: e.target.value })}
              placeholder="de_DE.UTF-8"
              className="font-mono text-xs"
            />
          </>
        )}
      />
    </div>
  );
}

/** How the connection is reached: proxies, jumps, knocks, status checks. */
export function HostNetwork({
  form,
  setField,
}: {
  form: HostEditorForm;
  setField: SetField;
}) {
  const { t } = useTranslation();
  const jumps = form.jumpHosts as { hostId: string }[];
  const knocks = form.portKnockSequence as {
    port: number;
    protocol: "tcp" | "udp";
    delay: number;
  }[];
  const chain = form.socks5ProxyChain as {
    host: string;
    port: number;
    type: 4 | 5 | "http" | "socks4" | "socks5";
    username?: string;
    password?: string;
  }[];

  return (
    <div className="flex flex-col gap-3">
      <SwitchRow
        label={t("hostForm.useSocks5")}
        checked={Boolean(form.useSocks5)}
        onChange={(value) => setField("useSocks5", value)}
      />
      {Boolean(form.useSocks5) && (
        <>
          <FieldPair>
            <TextField
              label={t("hostForm.socks5Host")}
              value={String(form.socks5Host)}
              onChange={(value) => setField("socks5Host", value)}
              mono
            />
            <TextField
              label={t("hostForm.socks5Port")}
              value={String(form.socks5Port)}
              onChange={(value) => setField("socks5Port", Number(value) || 0)}
            />
          </FieldPair>
          <FieldPair>
            <TextField
              label={t("hostForm.socks5Username")}
              value={String(form.socks5Username)}
              onChange={(value) => setField("socks5Username", value)}
              mono
            />
            <Field label={t("hostForm.socks5Password")}>
              <PasswordInput
                value={String(form.socks5Password)}
                onChange={(e) => setField("socks5Password", e.target.value)}
              />
            </Field>
          </FieldPair>

          {/*
            A chain goes through several proxies in order and replaces the
            single one above, which is why the mode picks between them: the
            payload drops the chain unless this is "chain".
          */}
          <SelectField
            label={t("hostForm.socks5Mode")}
            value={String(form.socks5ProxyMode)}
            onChange={(value) => setField("socks5ProxyMode", value)}
            options={[
              { value: "single", label: t("hostForm.socks5ModeSingle") },
              { value: "chain", label: t("hostForm.socks5ModeChain") },
            ]}
          />
          {form.socks5ProxyMode === "chain" && (
            <Repeater
              label={t("hostForm.socks5Chain")}
              hint={t("hostForm.socks5ChainHint")}
              items={chain}
              onChange={(items) => setField("socks5ProxyChain", items)}
              makeItem={() => ({ host: "", port: 1080, type: 5 as const })}
              empty={t("hostForm.socks5ChainEmpty")}
              addLabel={t("hostForm.socks5ChainAdd")}
              renderItem={(item, update) => (
                <>
                  <Input
                    value={item.host}
                    onChange={(e) => update({ ...item, host: e.target.value })}
                    placeholder={t("hostForm.socks5Host")}
                    className="font-mono text-xs"
                  />
                  <Input
                    value={String(item.port)}
                    onChange={(e) =>
                      update({ ...item, port: Number(e.target.value) || 0 })
                    }
                    placeholder={t("hostForm.socks5Port")}
                  />
                  <select
                    value={String(item.type)}
                    onChange={(e) =>
                      update({
                        ...item,
                        type: (e.target.value === "4"
                          ? 4
                          : e.target.value === "5"
                            ? 5
                            : e.target.value) as (typeof item)["type"],
                      })
                    }
                    className="h-9 rounded-md border border-border bg-background px-2 text-xs"
                  >
                    <option value="5">SOCKS5</option>
                    <option value="4">SOCKS4</option>
                    <option value="http">HTTP</option>
                  </select>
                </>
              )}
            />
          )}
        </>
      )}

      <Repeater
        label={t("hostForm.jumpHosts")}
        hint={t("hostForm.jumpHostsHint")}
        items={jumps}
        onChange={(items) => setField("jumpHosts", items)}
        makeItem={() => ({ hostId: "" })}
        empty={t("hostForm.jumpHostsEmpty")}
        addLabel={t("hostForm.jumpHostAdd")}
        renderItem={(item, update) => (
          <Input
            value={item.hostId}
            onChange={(e) => update({ hostId: e.target.value })}
            placeholder={t("hostForm.jumpHostPlaceholder")}
            className="font-mono text-xs"
          />
        )}
      />

      <Repeater
        label={t("hostForm.portKnock")}
        hint={t("hostForm.portKnockHint")}
        items={knocks}
        onChange={(items) => setField("portKnockSequence", items)}
        makeItem={() => ({ port: 0, protocol: "tcp" as const, delay: 100 })}
        empty={t("hostForm.portKnockEmpty")}
        addLabel={t("hostForm.portKnockAdd")}
        renderItem={(item, update) => (
          <>
            <Input
              value={String(item.port)}
              onChange={(e) =>
                update({ ...item, port: Number(e.target.value) || 0 })
              }
              placeholder={t("hostForm.portKnockPort")}
            />
            <select
              value={item.protocol}
              onChange={(e) =>
                update({ ...item, protocol: e.target.value as "tcp" | "udp" })
              }
              className="h-9 rounded-md border border-border bg-background px-2 text-xs"
            >
              <option value="tcp">TCP</option>
              <option value="udp">UDP</option>
            </select>
            <Input
              value={String(item.delay)}
              onChange={(e) =>
                update({ ...item, delay: Number(e.target.value) || 0 })
              }
              placeholder={t("hostForm.portKnockDelay")}
            />
          </>
        )}
      />

      <SwitchRow
        label={t("hostForm.statusCheck")}
        checked={Boolean(form.statusCheckEnabled)}
        onChange={(value) => setField("statusCheckEnabled", value)}
      />
      {Boolean(form.statusCheckEnabled) && (
        <TextField
          label={t("hostForm.statusCheckInterval")}
          value={
            form.statusCheckInterval === null
              ? ""
              : String(form.statusCheckInterval)
          }
          onChange={(value) =>
            // Empty follows the server's own setting, which is what null means.
            setField(
              "statusCheckInterval",
              value === "" ? null : Number(value) || 0,
            )
          }
          placeholder={t("hostForm.statusCheckIntervalHint")}
        />
      )}
    </div>
  );
}
