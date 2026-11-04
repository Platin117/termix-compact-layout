import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";

/**
 * The pieces every settings page here repeats.
 *
 * Fifteen pages that each hand-roll a heading, a bordered list and a loading
 * state drift apart within a week. These keep them the same shape, and keep
 * each page about the thing it configures.
 */

export function Section({
  title,
  hint,
  action,
  children,
}: {
  title?: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      {(title || action) && (
        <div className="flex items-center gap-2">
          {title && <h2 className="text-sm font-medium">{title}</h2>}
          {action && <div className="ml-auto">{action}</div>}
        </div>
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </section>
  );
}

/** A bordered, divided list. Empty renders the placeholder, not an empty box. */
export function Rows({
  empty,
  children,
}: {
  empty?: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children.flat() : [children];
  if (items.filter(Boolean).length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
      {children}
    </ul>
  );
}

export function Row({
  title,
  hint,
  children,
}: {
  title: React.ReactNode;
  hint?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{title}</div>
        {hint && (
          <div className="truncate text-xs text-muted-foreground">{hint}</div>
        )}
      </div>
      {children}
    </li>
  );
}

export interface Loaded<T> {
  data: T | null;
  failed: boolean;
  reload: () => void;
}

/**
 * Loads once and on demand, and drops a result that arrived after the page
 * was left. Every page here needs this and none of them needs more.
 */
export function useLoad<T>(
  load: () => Promise<T>,
  deps: unknown[] = [],
): Loaded<T> {
  const [data, setData] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let live = true;
    load()
      .then((value) => live && setData(value))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps]);

  const reload = useCallback(() => {
    setFailed(false);
    setNonce((n) => n + 1);
  }, []);
  return { data, failed, reload };
}

/** Loading, failed, or the page. Saves every page the same three branches. */
export function Gate<T>({
  state,
  children,
}: {
  state: Loaded<T>;
  children: (data: T) => React.ReactNode;
}) {
  const { t } = useTranslation();
  if (state.failed) {
    return (
      <p className="text-sm text-muted-foreground">{t("admin.loadFailed")}</p>
    );
  }
  if (state.data === null) {
    return (
      <p className="text-sm text-muted-foreground">{t("settings.loading")}</p>
    );
  }
  return <>{children(state.data)}</>;
}

/** A date as the browser would write it, or a dash when there is none. */
export function when(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}
