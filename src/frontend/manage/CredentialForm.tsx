import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Field,
  FormFooter,
  Input,
  PasswordInput,
  PluginComponent,
  SelectField,
  Textarea,
  TextField,
  createCredential,
  getCredentials,
  updateCredential,
  type Credential,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";

interface Props {
  credential: Credential | null;
  onBack: () => void;
  onSaved: () => void;
  onDelete?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

/** Tags are one comma-separated line here; core stores them as a list. */
function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/**
 * The folder names already in use, for the datalist.
 *
 * Read off the credentials themselves: the UI API exports `getCredentials`
 * but not the folder listing, and the folders in use are exactly the ones
 * the saved credentials name. The reply is typed as a bare record, so a
 * shape that is not a list simply leaves the datalist empty -- a suggestion
 * list is never worth breaking the form over.
 */
function folderNames(data: unknown): string[] {
  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as { credentials?: unknown })?.credentials)
      ? (data as { credentials: unknown[] }).credentials
      : [];
  const names = list
    .map((entry) => String((entry as { folder?: unknown })?.folder ?? ""))
    .filter(Boolean);
  return [...new Set(names)].sort();
}

/** A saved login: a name, a user and a password or a private key. */
export function CredentialForm({
  credential,
  onBack,
  onSaved,
  onDelete,
  onDirtyChange,
}: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: credential?.name ?? "",
    description: credential?.description ?? "",
    folder: credential?.folder ?? "",
    tags: (credential?.tags ?? []).join(", "),
    username: credential?.username ?? "",
    type: (credential?.type ?? "password") as "password" | "key",
    password: "",
    key: "",
    publicKey: credential?.publicKey ?? "",
    certPublicKey: credential?.certPublicKey ?? "",
    passphrase: "",
  });
  const [folders, setFolders] = useState<string[]>([]);
  const [showSecretSources, setShowSecretSources] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    let live = true;
    getCredentials()
      .then((data) => live && setFolders(folderNames(data)))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const set = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => {
    onDirtyChange?.(true);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const needsSecret =
    !credential &&
    (form.type === "password" ? !form.password : !form.key.trim());
  const nameMissing = !form.name.trim();
  const userMissing = !form.username.trim();

  const save = async () => {
    setTried(true);
    if (nameMissing || userMissing || needsSecret) return;
    setSaving(true);
    try {
      const isKey = form.type === "key";
      // On an edit, a blank secret means keep the saved one.
      const data = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        folder: form.folder.trim() || null,
        tags: splitTags(form.tags),
        username: form.username.trim(),
        authType: form.type,
        password: !isKey ? form.password || undefined : null,
        key: isKey ? form.key || undefined : null,
        keyPassword: isKey ? form.passphrase || undefined : null,
        publicKey: isKey ? form.publicKey : null,
        certPublicKey: isKey ? form.certPublicKey.trim() || null : null,
      };
      if (credential) await updateCredential(Number(credential.id), data);
      else await createCredential(data);
      toast.success(
        credential ? t("credentialForm.updated") : t("credentialForm.created"),
      );
      onDirtyChange?.(false);
      window.dispatchEvent(new CustomEvent("termix:credentials-changed"));
      onSaved();
    } catch {
      toast.error(t("credentialForm.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const keepHint = credential ? t("credentialForm.keepHint") : undefined;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 max-w-2xl w-full mx-auto">
      <TextField
        label={t("credentialForm.name")}
        value={form.name}
        onChange={(value) => set("name", value)}
        error={tried && nameMissing ? t("credentialForm.nameRequired") : ""}
      />
      <TextField
        label={t("credentialForm.description")}
        value={form.description}
        onChange={(value) => set("description", value)}
      />
      <TextField
        label={t("credentialForm.username")}
        value={form.username}
        onChange={(value) => set("username", value)}
        error={tried && userMissing ? t("credentialForm.usernameRequired") : ""}
        mono
      />

      <Field label={t("credentialForm.folder")}>
        <>
          <Input
            list="compact-layout-credential-folders"
            value={form.folder}
            onChange={(e) => set("folder", e.target.value)}
          />
          <datalist id="compact-layout-credential-folders">
            {folders.map((folder) => (
              <option key={folder} value={folder} />
            ))}
          </datalist>
        </>
      </Field>

      <Field
        label={t("credentialForm.tags")}
        hint={t("credentialForm.tagsHint")}
      >
        <Input
          value={form.tags}
          onChange={(e) => set("tags", e.target.value)}
        />
      </Field>

      <SelectField
        label={t("credentialForm.type")}
        value={form.type}
        onChange={(value) => set("type", value)}
        options={[
          { value: "password", label: t("credentialForm.typePassword") },
          { value: "key", label: t("credentialForm.typeKey") },
        ]}
      />

      {/*
        A secret can come from somewhere other than this form -- a vault, say.
        The hint offers that, the manager is the panel it opens, and both are
        a plugin's. Without one they resolve to nothing and the toggle below
        never gets to show anything.
      */}
      <div className="flex flex-wrap items-center gap-2">
        <PluginComponent
          id="credentials.secretHint"
          onManage={() => setShowSecretSources((open) => !open)}
        />
      </div>
      {showSecretSources && (
        <PluginComponent
          id="credentials.secretManager"
          onClose={() => setShowSecretSources(false)}
        />
      )}

      {form.type === "password" ? (
        <Field
          label={t("credentialForm.password")}
          hint={keepHint}
          error={tried && needsSecret ? t("credentialForm.secretRequired") : ""}
        >
          <PasswordInput
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
          />
        </Field>
      ) : (
        <>
          <Field
            label={t("credentialForm.privateKey")}
            hint={keepHint}
            error={
              tried && needsSecret ? t("credentialForm.secretRequired") : ""
            }
          >
            <Textarea
              value={form.key}
              onChange={(e) => set("key", e.target.value)}
              className="min-h-28 font-mono text-xs"
              placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
            />
          </Field>

          {/*
            Making a key needs ssh2, which is a server-side module: the SDK's
            own generator is a backend helper and there is nothing in the UI
            API that does it. Credential Tools registers the buttons that ask
            its backend, and any layout may render them by id. Without that
            plugin these resolve to nothing, so the form is no worse than it
            was -- which is exactly why there is no fallback here.
          */}
          <div className="flex flex-wrap items-center gap-2">
            <PluginComponent
              id="credentials.keyGenerator"
              passphrase={form.passphrase}
              onGenerated={(pair: {
                privateKey: string;
                publicKey: string;
              }) => {
                onDirtyChange?.(true);
                setForm((prev) => ({
                  ...prev,
                  key: pair.privateKey,
                  publicKey: pair.publicKey,
                }));
              }}
            />
            <PluginComponent
              id="credentials.publicKeyDeriver"
              privateKey={form.key}
              passphrase={form.passphrase}
              onDerived={(publicKey: string) => set("publicKey", publicKey)}
            />
          </div>

          <Field label={t("credentialForm.passphrase")}>
            <PasswordInput
              value={form.passphrase}
              onChange={(e) => set("passphrase", e.target.value)}
            />
          </Field>

          {form.publicKey && (
            <Field
              label={t("credentialForm.publicKey")}
              hint={t("credentialForm.publicKeyHint")}
            >
              <Textarea
                value={form.publicKey}
                onChange={(e) => set("publicKey", e.target.value)}
                className="min-h-16 font-mono text-xs"
              />
            </Field>
          )}

          {/*
            A CA-signed certificate, for hosts that trust a certificate
            authority rather than a key on file. It is read in the browser
            and kept as text, like the private key above: nothing is uploaded
            anywhere until the credential is saved.
          */}
          <Field
            label={t("credentialForm.certificate")}
            hint={t("credentialForm.certificateHint")}
            aside={
              form.certPublicKey ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-destructive"
                  onClick={() => set("certPublicKey", "")}
                >
                  {t("credentialForm.certificateClear")}
                </Button>
              ) : undefined
            }
          >
            <>
              <Textarea
                value={form.certPublicKey}
                onChange={(e) => set("certPublicKey", e.target.value)}
                className="min-h-16 font-mono text-xs"
                placeholder={t("credentialForm.certificatePlaceholder")}
              />
              <label className="mt-1 inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <Upload className="size-3.5" />
                {t("credentialForm.certificateUpload")}
                <input
                  type="file"
                  accept=".pub,.txt,.cert"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    // Cleared so picking the same file twice fires again.
                    e.target.value = "";
                    if (!file) return;
                    void file
                      .text()
                      .then((text) => set("certPublicKey", text.trim()));
                  }}
                />
              </label>
            </>
          </Field>
        </>
      )}

      <FormFooter
        onCancel={onBack}
        onSave={() => void save()}
        saving={saving}
        onDelete={onDelete}
        deleteLabel={t("credentialForm.delete")}
        saveLabel={
          credential ? t("credentialForm.save") : t("credentialForm.add")
        }
        cancelLabel={t("credentialForm.cancel")}
      />
    </div>
  );
}
