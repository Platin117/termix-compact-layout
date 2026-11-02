import { useState } from "react";
import { Copy, Trash2 } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  createApiKey,
  deleteApiKey,
  getApiKeys,
  getErrorMessage,
  getUserInfo,
  getUserList,
  type ApiKey,
  type CreatedApiKey,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";
import { Gate, Row, Rows, Section, useLoad, when } from "./parts";

/**
 * API keys, for this account or for the whole server.
 *
 * `createApiKey` takes a user **id**, which it posts to the server unchanged;
 * a username is not an id and the server rejects it. The id comes from
 * getUserInfo, or from the user picked in the list when an admin is making a
 * key for somebody else -- which is what the stock form offers too.
 *
 * The token exists once, in the reply that created it. It is shown until the
 * page is left and then never again, which is why it is not in the list.
 */
export function ApiKeySettings({ scope }: { scope: "user" | "server" }) {
  const { t } = useTranslation();
  const keys = useLoad(() => getApiKeys());
  const me = useLoad(() => getUserInfo());
  // Only an admin may list users, so only the server page asks.
  const users = useLoad(() =>
    scope === "server" ? getUserList() : Promise.resolve(null),
  );

  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [expires, setExpires] = useState("");
  const [created, setCreated] = useState<CreatedApiKey | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const userId = owner || me.data?.userId || "";

  const add = () => {
    setFailed(null);
    createApiKey(
      name.trim(),
      userId,
      // A date input gives YYYY-MM-DD; the server is handed a full timestamp.
      expires ? new Date(expires).toISOString() : undefined,
    )
      .then((key) => {
        setCreated(key);
        setName("");
        setExpires("");
        keys.reload();
      })
      .catch((error) => setFailed(getErrorMessage(error, t("apiKeys.failed"))));
  };

  const remove = (key: ApiKey) => {
    deleteApiKey(key.id)
      .then(() => keys.reload())
      .catch((error) => setFailed(getErrorMessage(error, t("apiKeys.failed"))));
  };

  return (
    <div className="flex flex-col gap-6">
      <Section title={t("apiKeys.new")} hint={t("apiKeys.newHint")}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="key-name">{t("apiKeys.name")}</Label>
          <Input
            id="key-name"
            value={name}
            placeholder={t("apiKeys.namePlaceholder")}
            onChange={(e) => setName(e.target.value)}
            className="h-8 sm:w-72"
          />

          {scope === "server" && (
            <Gate state={users}>
              {(list) =>
                list === null ? null : (
                  <>
                    <Label htmlFor="key-owner">{t("apiKeys.owner")}</Label>
                    <Select value={userId} onValueChange={setOwner}>
                      <SelectTrigger id="key-owner" className="h-8 sm:w-72">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {list.users.map((user) => (
                          <SelectItem key={user.userId} value={user.userId}>
                            {user.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )
              }
            </Gate>
          )}

          <Label htmlFor="key-expires">{t("apiKeys.expires")}</Label>
          <Input
            id="key-expires"
            type="date"
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
            className="h-8 sm:w-72"
          />

          <div>
            <Button
              size="sm"
              disabled={!name.trim() || !userId}
              onClick={add}
            >
              {t("apiKeys.create")}
            </Button>
          </div>
        </div>

        {created && (
          <>
            <div className="flex items-center gap-2 rounded-lg border border-primary/40 p-3">
              <code className="min-w-0 flex-1 truncate font-mono text-xs">
                {created.token}
              </code>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7"
                aria-label={t("apiKeys.copy")}
                onClick={() => void navigator.clipboard?.writeText(created.token)}
              >
                <Copy className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("apiKeys.onceOnly")}
            </p>
          </>
        )}
        {failed && <p className="text-xs text-destructive">{failed}</p>}
      </Section>

      <Section
        title={scope === "server" ? t("apiKeys.allTitle") : t("apiKeys.title")}
      >
        <Gate state={keys}>
          {(data) => (
            <Rows empty={t("apiKeys.none")}>
              {data.apiKeys.map((key) => (
                <Row
                  key={key.id}
                  title={
                    <span className="flex items-center gap-2">
                      {key.name}
                      <code className="font-mono text-[11px] text-muted-foreground">
                        {key.tokenPrefix}…
                      </code>
                    </span>
                  }
                  hint={[
                    scope === "server" && key.username ? key.username : null,
                    `${t("apiKeys.created")}: ${when(key.createdAt)}`,
                    `${t("apiKeys.lastUsed")}: ${when(key.lastUsedAt)}`,
                    key.expiresAt
                      ? `${t("apiKeys.expiresAt")}: ${when(key.expiresAt)}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                >
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-7"
                    aria-label={t("apiKeys.delete")}
                    onClick={() => remove(key)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </Row>
              ))}
            </Rows>
          )}
        </Gate>
      </Section>
    </div>
  );
}
