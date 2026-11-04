import { useState } from "react";
import {
  Button,
  Label,
  Textarea,
  getTlsStatus,
  uploadTlsCertificate,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";
import { Gate, Row, Rows, Section, useLoad, when } from "../parts";

/** The certificate the server serves, and a way to replace it. */
export function SslSettings() {
  const { t } = useTranslation();
  const status = useLoad(() => getTlsStatus());
  const [certificate, setCertificate] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const upload = () => {
    setBusy(true);
    setNote(null);
    uploadTlsCertificate({ certificate, privateKey })
      .then((result) => {
        setCertificate("");
        setPrivateKey("");
        setNote(result.reloadMessage || t("ssl.uploaded"));
        status.reload();
      })
      .catch(() => setNote(t("ssl.uploadFailed")))
      .finally(() => setBusy(false));
  };

  return (
    <div className="flex flex-col gap-6">
      <Section title={t("ssl.current")}>
        <Gate state={status}>
          {(data) => (
            <Rows empty={t("ssl.none")}>
              <Row
                title={t("ssl.enabled")}
                hint={data.enabled ? t("ssl.on") : t("ssl.off")}
              />
              {data.certificate ? (
                <>
                  <Row
                    title={t("ssl.subject")}
                    hint={data.certificate.subject}
                  />
                  <Row title={t("ssl.issuer")} hint={data.certificate.issuer} />
                  <Row
                    title={t("ssl.names")}
                    hint={data.certificate.names.join(", ")}
                  />
                  <Row
                    title={t("ssl.validUntil")}
                    hint={when(data.certificate.notAfter)}
                  />
                  <Row
                    title={t("ssl.fingerprint")}
                    hint={data.certificate.fingerprint}
                  />
                  {data.certificate.selfSigned && (
                    <Row title={t("ssl.selfSigned")} />
                  )}
                </>
              ) : null}
              {data.renewal && (
                <Row title={t("ssl.renewal")} hint={data.renewal.pluginName} />
              )}
            </Rows>
          )}
        </Gate>
      </Section>

      <Section title={t("ssl.replace")} hint={t("ssl.replaceHint")}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ssl-cert">{t("ssl.certificate")}</Label>
          <Textarea
            id="ssl-cert"
            rows={5}
            spellCheck={false}
            value={certificate}
            placeholder="-----BEGIN CERTIFICATE-----"
            onChange={(e) => setCertificate(e.target.value)}
            className="font-mono text-xs"
          />
          <Label htmlFor="ssl-key">{t("ssl.privateKey")}</Label>
          <Textarea
            id="ssl-key"
            rows={5}
            spellCheck={false}
            value={privateKey}
            placeholder="-----BEGIN PRIVATE KEY-----"
            onChange={(e) => setPrivateKey(e.target.value)}
            className="font-mono text-xs"
          />
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              disabled={busy || !certificate.trim() || !privateKey.trim()}
              onClick={upload}
            >
              {t("ssl.upload")}
            </Button>
            {note && (
              <span className="text-xs text-muted-foreground">{note}</span>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}
