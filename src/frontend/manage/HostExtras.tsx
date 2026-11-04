import { Plus, X } from "lucide-react";
import {
  Button,
  Field,
  FieldPair,
  Input,
  PasswordInput,
  SelectField,
  Switch,
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
 */

type SetField = (key: string, value: unknown) => void;

/** A row of a list field, with a remove button on the right. */
function ListRows({
  rows,
  onAdd,
  addLabel,
  onRemove,
  removeLabel,
  children,
}: {
  rows: unknown[];
  onAdd: () => void;
  addLabel: string;
  onRemove: (index: number) => void;
  removeLabel: string;
  children: (index: number) => React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((_, index) => (
        <div key={index} className="flex items-end gap-1.5">
          <div className="flex min-w-0 flex-1 gap-1.5">{children(index)}</div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-8 shrink-0"
            aria-label={removeLabel}
            onClick={() => onRemove(index)}
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <div>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={onAdd}>
          <Plus className="size-3.5" />
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

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
  const tags = form.tags as string[];
  const parents = shell.hosts.list.filter(
    (other) => String(other.id) !== String(hostId ?? ""),
  );

  const addTag = () => {
    const tag = String(form.tagInput).trim();
    if (!tag || tags.includes(tag)) return;
    setField("tags", [...tags, tag]);
    setField("tagInput", "");
  };

  return (
    <>
      <Field label={t("hostForm.tags")} hint={t("hostForm.tagsHint")}>
        <>
          <div className="flex gap-1.5">
            <Input
              value={String(form.tagInput)}
              onChange={(e) => setField("tagInput", e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                // Enter adds the tag rather than submitting the form.
                e.preventDefault();
                addTag();
              }}
              placeholder={t("hostForm.tagsPlaceholder")}
            />
            <Button variant="outline" size="sm" onClick={addTag}>
              {t("hostForm.tagAdd")}
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                  aria-label={`${tag}: ${t("hostForm.tagRemove")}`}
                  onClick={() =>
                    setField(
                      "tags",
                      tags.filter((other) => other !== tag),
                    )
                  }
                >
                  {tag}
                  <X className="size-3" />
                </button>
              ))}
            </div>
          )}
        </>
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

      <Switch
        checked={Boolean(form.pin)}
        onCheckedChange={(value: boolean) => setField("pin", value)}
      >
        {t("hostForm.pin")}
      </Switch>
      <Switch
        checked={Boolean(form.localOnly)}
        onCheckedChange={(value: boolean) => setField("localOnly", value)}
      >
        {t("hostForm.localOnly")}
      </Switch>
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

  const setEnv = (index: number, patch: Partial<(typeof env)[number]>) =>
    setField(
      "environmentVariables",
      env.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );

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

      <Switch
        checked={Boolean(form.allowLegacyAlgorithms)}
        onCheckedChange={(value: boolean) =>
          setField("allowLegacyAlgorithms", value)
        }
      >
        {t("hostForm.allowLegacy")}
      </Switch>
      <Switch
        checked={Boolean(form.forceKeyboardInteractive)}
        onCheckedChange={(value: boolean) =>
          setField("forceKeyboardInteractive", value)
        }
      >
        {t("hostForm.forceKeyboardInteractive")}
      </Switch>
      <Switch
        checked={Boolean(form.overrideCredentialUsername)}
        onCheckedChange={(value: boolean) =>
          setField("overrideCredentialUsername", value)
        }
      >
        {t("hostForm.overrideCredentialUsername")}
      </Switch>
      <Switch
        checked={Boolean(form.shareSshAuth)}
        onCheckedChange={(value: boolean) => setField("shareSshAuth", value)}
      >
        {t("hostForm.shareSshAuth")}
      </Switch>

      <Switch
        checked={Boolean(form.agentForwarding)}
        onCheckedChange={(value: boolean) => setField("agentForwarding", value)}
      >
        {t("hostForm.agentForwarding")}
      </Switch>
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

      <Field
        label={t("hostForm.environment")}
        hint={t("hostForm.environmentHint")}
      >
        <ListRows
          rows={env}
          addLabel={t("hostForm.environmentAdd")}
          removeLabel={t("hostForm.rowRemove")}
          onAdd={() =>
            setField("environmentVariables", [...env, { key: "", value: "" }])
          }
          onRemove={(index) =>
            setField(
              "environmentVariables",
              env.filter((_, i) => i !== index),
            )
          }
        >
          {(index) => (
            <>
              <Input
                value={env[index].key}
                onChange={(e) => setEnv(index, { key: e.target.value })}
                placeholder="LANG"
                className="font-mono text-xs"
              />
              <Input
                value={env[index].value}
                onChange={(e) => setEnv(index, { value: e.target.value })}
                placeholder="de_DE.UTF-8"
                className="font-mono text-xs"
              />
            </>
          )}
        </ListRows>
      </Field>
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
  const chain = form.socks5ProxyChain as {
    host: string;
    port: number;
    type: 4 | 5 | "http" | "socks4" | "socks5";
    username?: string;
    password?: string;
  }[];
  const knocks = form.portKnockSequence as {
    port: number;
    protocol: "tcp" | "udp";
    delay: number;
  }[];

  const setChain = (index: number, patch: Partial<(typeof chain)[number]>) =>
    setField(
      "socks5ProxyChain",
      chain.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );

  const setKnock = (index: number, patch: Partial<(typeof knocks)[number]>) =>
    setField(
      "portKnockSequence",
      knocks.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );

  return (
    <div className="flex flex-col gap-3">
      <Switch
        checked={Boolean(form.useSocks5)}
        onCheckedChange={(value: boolean) => setField("useSocks5", value)}
      >
        {t("hostForm.useSocks5")}
      </Switch>
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
        </>
      )}

      {/*
        A chain goes through several proxies in order and replaces the single
        one above, which is why the mode picks between them rather than both
        being sent: the payload drops the chain unless this is "chain".
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
        <Field
          label={t("hostForm.socks5Chain")}
          hint={t("hostForm.socks5ChainHint")}
        >
          <ListRows
            rows={chain}
            addLabel={t("hostForm.socks5ChainAdd")}
            removeLabel={t("hostForm.rowRemove")}
            onAdd={() =>
              setField("socks5ProxyChain", [
                ...chain,
                { host: "", port: 1080, type: 5 as const },
              ])
            }
            onRemove={(index) =>
              setField(
                "socks5ProxyChain",
                chain.filter((_, i) => i !== index),
              )
            }
          >
            {(index) => (
              <>
                <Input
                  value={chain[index].host}
                  onChange={(e) => setChain(index, { host: e.target.value })}
                  placeholder={t("hostForm.socks5Host")}
                  className="font-mono text-xs"
                />
                <Input
                  value={String(chain[index].port)}
                  onChange={(e) =>
                    setChain(index, { port: Number(e.target.value) || 0 })
                  }
                  placeholder={t("hostForm.socks5Port")}
                />
                <select
                  value={String(chain[index].type)}
                  onChange={(e) =>
                    setChain(index, {
                      type: (e.target.value === "4"
                        ? 4
                        : e.target.value === "5"
                          ? 5
                          : e.target.value) as (typeof chain)[number]["type"],
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
          </ListRows>
        </Field>
      )}

      <Field label={t("hostForm.jumpHosts")} hint={t("hostForm.jumpHostsHint")}>
        <ListRows
          rows={jumps}
          addLabel={t("hostForm.jumpHostAdd")}
          removeLabel={t("hostForm.rowRemove")}
          onAdd={() => setField("jumpHosts", [...jumps, { hostId: "" }])}
          onRemove={(index) =>
            setField(
              "jumpHosts",
              jumps.filter((_, i) => i !== index),
            )
          }
        >
          {(index) => (
            <Input
              value={jumps[index].hostId}
              onChange={(e) =>
                setField(
                  "jumpHosts",
                  jumps.map((row, i) =>
                    i === index ? { hostId: e.target.value } : row,
                  ),
                )
              }
              placeholder={t("hostForm.jumpHostPlaceholder")}
              className="font-mono text-xs"
            />
          )}
        </ListRows>
      </Field>

      <Field label={t("hostForm.portKnock")} hint={t("hostForm.portKnockHint")}>
        <ListRows
          rows={knocks}
          addLabel={t("hostForm.portKnockAdd")}
          removeLabel={t("hostForm.rowRemove")}
          onAdd={() =>
            setField("portKnockSequence", [
              ...knocks,
              { port: 0, protocol: "tcp" as const, delay: 100 },
            ])
          }
          onRemove={(index) =>
            setField(
              "portKnockSequence",
              knocks.filter((_, i) => i !== index),
            )
          }
        >
          {(index) => (
            <>
              <Input
                value={String(knocks[index].port)}
                onChange={(e) =>
                  setKnock(index, { port: Number(e.target.value) || 0 })
                }
                placeholder={t("hostForm.portKnockPort")}
              />
              <select
                value={knocks[index].protocol}
                onChange={(e) =>
                  setKnock(index, {
                    protocol: e.target.value as "tcp" | "udp",
                  })
                }
                className="h-9 rounded-md border border-border bg-background px-2 text-xs"
              >
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
              </select>
              <Input
                value={String(knocks[index].delay)}
                onChange={(e) =>
                  setKnock(index, { delay: Number(e.target.value) || 0 })
                }
                placeholder={t("hostForm.portKnockDelay")}
              />
            </>
          )}
        </ListRows>
      </Field>

      <Switch
        checked={Boolean(form.statusCheckEnabled)}
        onCheckedChange={(value: boolean) =>
          setField("statusCheckEnabled", value)
        }
      >
        {t("hostForm.statusCheck")}
      </Switch>
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
