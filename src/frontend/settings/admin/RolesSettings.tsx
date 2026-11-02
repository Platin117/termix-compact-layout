import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  Button,
  Input,
  createRole,
  deleteRole,
  getErrorMessage,
  getPermissionsCatalog,
  getRoles,
  updateRole,
  type Role,
} from "@termix-ssh/plugin-sdk/ui";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";
import { Gate, Row, Rows, Section, useLoad } from "../parts";

/** A role's permissions, which the API stores as an array or a JSON string. */
function permissionsOf(role: Role): string[] {
  if (Array.isArray(role.permissions)) return role.permissions;
  if (typeof role.permissions === "string") {
    try {
      const parsed: unknown = JSON.parse(role.permissions);
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Roles and what they may do. System roles are listed but not editable.
 *
 * A tick writes the role's whole permission list, because that is what the
 * API takes -- it replaces, it does not patch. Two things make that honest
 * to use. The tick moves at once and is put back if the write fails, so the
 * box is never stuck a second behind the server waiting for a round trip.
 * And a refusal is shown with what the server said: the first version
 * swallowed it, so a rejected write looked exactly like a box that did
 * nothing at all.
 */
export function RolesSettings() {
  const { t } = useTranslation();
  const roles = useLoad(() => getRoles());
  const catalog = useLoad(() => getPermissionsCatalog());

  const [name, setName] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  // What this page has written but not yet seen come back, per role.
  const [draft, setDraft] = useState<Record<number, string[]>>({});

  const create = () => {
    const slug = name.trim().toLowerCase().replace(/\s+/g, "-");
    setFailed(null);
    void createRole({ name: slug, displayName: name.trim() })
      .then(() => {
        setName("");
        roles.reload();
      })
      .catch((error) =>
        setFailed(getErrorMessage(error, t("admin.actionFailed"))),
      );
  };

  const remove = (role: Role) => {
    setFailed(null);
    void deleteRole(role.id)
      .then(() => {
        if (open === role.id) setOpen(null);
        roles.reload();
      })
      .catch((error) =>
        setFailed(getErrorMessage(error, t("admin.actionFailed"))),
      );
  };

  const held = (role: Role): string[] => draft[role.id] ?? permissionsOf(role);

  const toggle = (role: Role, permission: string, on: boolean) => {
    const current = held(role);
    const next = on
      ? [...current, permission]
      : current.filter((p) => p !== permission);

    setFailed(null);
    setDraft((d) => ({ ...d, [role.id]: next }));

    void updateRole(role.id, { permissions: next })
      .then(() => {
        // The server now agrees; let its answer be the one that is shown.
        setDraft(({ [role.id]: _written, ...rest }) => rest);
        roles.reload();
      })
      .catch((error) => {
        setDraft(({ [role.id]: _written, ...rest }) => rest);
        setFailed(getErrorMessage(error, t("admin.actionFailed")));
      });
  };

  return (
    <div className="flex flex-col gap-6">
      <Section title={t("roles.add")}>
        <div className="flex items-center gap-2">
          <Input
            value={name}
            placeholder={t("roles.namePlaceholder")}
            onChange={(e) => setName(e.target.value)}
            className="h-8 sm:w-64"
          />
          <Button size="sm" disabled={!name.trim()} onClick={create}>
            {t("roles.create")}
          </Button>
        </div>
      </Section>

      <Section title={t("roles.title")}>
        <Gate state={roles}>
          {(data) => (
            <div className="flex flex-col gap-2">
              <Rows empty={t("roles.none")}>
                {data.roles.map((role) => (
                  <Row
                    key={role.id}
                    title={role.displayName || role.name}
                    hint={
                      role.isSystem
                        ? t("roles.system")
                        : t("roles.count", { count: held(role).length })
                    }
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOpen(open === role.id ? null : role.id)}
                    >
                      {open === role.id ? t("roles.close") : t("roles.edit")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="size-7"
                      disabled={role.isSystem}
                      aria-label={t("roles.delete")}
                      onClick={() => remove(role)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </Row>
                ))}
              </Rows>

              {failed && <p className="text-xs text-destructive">{failed}</p>}

              {open !== null && (
                <Gate state={catalog}>
                  {(cat) => {
                    const role = data.roles.find((r) => r.id === open);
                    if (!role) return null;
                    const has = new Set(held(role));
                    return (
                      <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
                        {role.isSystem && (
                          <p className="text-xs text-muted-foreground">
                            {t("roles.systemLocked")}
                          </p>
                        )}
                        {cat.catalog.map((group) => (
                          <div
                            key={group.group}
                            className="flex flex-col gap-1"
                          >
                            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                              {group.label || t(group.labelKey || group.group)}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {group.permissions.map((permission) => (
                                <label
                                  key={permission}
                                  className={`flex items-center gap-1.5 text-xs ${
                                    role.isSystem
                                      ? "text-muted-foreground"
                                      : "cursor-pointer"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="size-3.5 accent-primary"
                                    checked={has.has(permission)}
                                    disabled={role.isSystem}
                                    onChange={(e) =>
                                      toggle(role, permission, e.target.checked)
                                    }
                                  />
                                  {permission}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                </Gate>
              )}
            </div>
          )}
        </Gate>
      </Section>
    </div>
  );
}
