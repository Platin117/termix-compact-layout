import { useState } from "react";
import { Copy, Trash2 } from "lucide-react";
import {
  Button,
  Input,
  createApiKey,
  deleteApiKey,
  getApiKeys,
  useShellController,
  type ApiKey,
  type CreatedApiKey,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";
import { Gate, Row, Rows, Section, useLoad, when } from "./parts";

/**
 * API keys, for this account or for the whole server.
 *
 * One page, two uses: the endpoint returns what the caller may see, so an
 * admin's list carries other people's keys and shows whose they are. The
 * token itself exists once, in the reply that created it -- it is shown until
 * the page is left and then never again, which is why it is not in the list.
 */
export function ApiKeySettings({ scope }: { scope: "user" | "server" }) {
  const { t } = useTranslation();
  const shell = useShellController();
  const keys = useLoad(() => getApiKeys());

  const [name, setName] = useState("");
  const [created, setCreated] = useState<CreatedApiKey | null>(null);
  const [failed, setFailed] = useState(false);

  const add = () => {
    setFailed(false);
    createApiKey(name.trim(), shell.username)
      .then((key) => {
        setCreated(key);
        setName("");
        keys.reload();
      })
      .catch(() => setFailed(true));
  };

  const remove = (key: ApiKey) => {
    deleteApiKey(key.id)
      .then(() => keys.reload())
      .catch(() => setFailed(true));
  };

  return (
    <div className="flex flex-col gap-6">
      <Section title={t("apiKeys.new")} hint={t("apiKeys.newHint")}>
        <div className="flex items-center gap-2">
          <Input
            value={name}
            placeholder={t("apiKeys.namePlaceholder")}
            onChange={(e) => setName(e.target.value)}
            className="h-8 sm:w-64"
          />
          <Button size="sm" disabled={!name.trim()} onClick={add}>
            {t("apiKeys.create")}
          </Button>
        </div>
        {created && (
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
        )}
        {created && (
          <p className="text-xs text-muted-foreground">{t("apiKeys.onceOnly")}</p>
        )}
        {failed && (
          <p className="text-xs text-destructive">{t("apiKeys.failed")}</p>
        )}
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
