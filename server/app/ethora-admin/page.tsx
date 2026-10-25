"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EthoraOpMeta, EthoraParamMeta, EthoraRunResult } from "@/lib/sdk";
import { useAuth } from "@/lib/auth-context";
import { ethoraAdminApi } from "@/lib/ethora-admin-api";

type FormState = Record<string, string | boolean>;

// Зібрати аргументи з форми згідно з типами параметрів.
// Кидає Error з текстом, якщо обовʼязкове порожнє або JSON невалідний.
function buildArgs(params: EthoraParamMeta[], form: FormState): Record<string, unknown> {
  const args: Record<string, unknown> = {};
  for (const param of params) {
    const raw = form[param.name];

    if (param.kind === "boolean") {
      args[param.name] = Boolean(raw);
      continue;
    }

    const text = typeof raw === "string" ? raw.trim() : "";
    if (text === "") {
      if (param.required) throw new Error(`Заповни поле «${param.label}»`);
      continue; // необовʼязкове порожнє — пропускаємо
    }

    if (param.kind === "number") {
      const num = Number(text);
      if (!Number.isFinite(num)) throw new Error(`«${param.label}» має бути числом`);
      args[param.name] = num;
    } else if (param.kind === "json") {
      try {
        args[param.name] = JSON.parse(text);
      } catch {
        throw new Error(`«${param.label}»: невалідний JSON`);
      }
    } else {
      args[param.name] = text;
    }
  }
  return args;
}

export default function EthoraAdminPage() {
  const router = useRouter();
  const { user, isAdmin, loading, logout } = useAuth();

  const [catalog, setCatalog] = useState<EthoraOpMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [form, setForm] = useState<FormState>({});
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EthoraRunResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selected = useMemo(
    () => catalog.find((op) => op.id === selectedId) ?? null,
    [catalog, selectedId],
  );

  // Не залогінений — на /login.
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const loadCatalog = useCallback(async () => {
    setLoadError(null);
    try {
      const ops = await ethoraAdminApi.catalog();
      setCatalog(ops);
      if (ops.length) setSelectedId((cur) => cur || ops[0].id);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Не вдалося завантажити каталог");
    }
  }, []);

  useEffect(() => {
    if (user && isAdmin) loadCatalog();
  }, [user, isAdmin, loadCatalog]);

  // Скидаємо форму й результат при зміні операції.
  useEffect(() => {
    setForm({});
    setResult(null);
    setError(null);
  }, [selectedId]);

  async function runOp(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError(null);

    let args: Record<string, unknown>;
    try {
      args = buildArgs(selected.params, form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка у формі");
      return;
    }

    if (selected.danger && !window.confirm(`Виконати «${selected.label}»? Це змінює дані.`)) {
      return;
    }

    setRunning(true);
    setResult(null);
    try {
      setResult(await ethoraAdminApi.run(selected.id, args));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Запит не вдався");
    } finally {
      setRunning(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="container">
        <p className="muted">Завантаження…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container">
        <div className="panel stack">
          <h1 style={{ margin: 0 }}>Немає доступу</h1>
          <p className="muted">Ця сторінка лише для адміністраторів.</p>
          <Link href="/todos">← До моїх todo</Link>
        </div>
      </div>
    );
  }

  // Групуємо операції для <optgroup>.
  const groups = catalog.reduce<Record<string, EthoraOpMeta[]>>((acc, op) => {
    (acc[op.group] ??= []).push(op);
    return acc;
  }, {});

  return (
    <div className="container">
      <div className="topbar">
        <h1 style={{ margin: 0 }}>Ethora SDK</h1>
        <div className="row">
          <Link href="/admin">Користувачі</Link>
          <Link href="/todos">Мої todo</Link>
          <span className="muted">{user.email}</span>
          <button onClick={() => logout()}>Вийти</button>
        </div>
      </div>

      {loadError && (
        <div className="panel stack">
          <p className="error">{loadError}</p>
          <button onClick={loadCatalog}>Спробувати ще</button>
        </div>
      )}

      {!loadError && (
        <div className="panel stack">
          <div className="field">
            <label htmlFor="op">Операція</label>
            <select id="op" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {Object.entries(groups).map(([group, ops]) => (
                <optgroup key={group} label={group}>
                  {ops.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.label} {op.danger ? "⚠" : ""} — {op.id}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {selected && (
            <form className="stack" onSubmit={runOp}>
              {selected.danger && (
                <span className="badge" style={{ alignSelf: "flex-start" }}>
                  змінює дані
                </span>
              )}

              {selected.params.length === 0 && (
                <p className="muted">Параметрів немає.</p>
              )}

              {selected.params.map((param) => {
                const value = form[param.name];
                const label = `${param.label}${param.required ? " *" : ""}`;
                const setVal = (v: string | boolean) =>
                  setForm((prev) => ({ ...prev, [param.name]: v }));

                if (param.kind === "boolean") {
                  return (
                    <label key={param.name} className="row" style={{ gap: "0.5rem" }}>
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(e) => setVal(e.target.checked)}
                        style={{ flex: "0 0 auto" }}
                      />
                      <span className="muted">{label}</span>
                    </label>
                  );
                }

                return (
                  <div key={param.name} className="field">
                    <label htmlFor={param.name}>{label}</label>
                    {param.kind === "json" ? (
                      <textarea
                        id={param.name}
                        rows={4}
                        placeholder={param.placeholder}
                        value={typeof value === "string" ? value : ""}
                        onChange={(e) => setVal(e.target.value)}
                      />
                    ) : (
                      <input
                        id={param.name}
                        type="text"
                        inputMode={param.kind === "number" ? "numeric" : undefined}
                        placeholder={param.placeholder}
                        value={typeof value === "string" ? value : ""}
                        onChange={(e) => setVal(e.target.value)}
                      />
                    )}
                  </div>
                );
              })}

              <div className="row">
                <button className="primary" type="submit" disabled={running}>
                  {running ? "Виконую…" : "Виконати"}
                </button>
                <span className="muted">{selected.id}</span>
              </div>
            </form>
          )}

          {error && <p className="error">{error}</p>}
        </div>
      )}

      {result && (
        <div className="panel stack" style={{ marginTop: "1rem" }}>
          <strong style={{ color: result.ok ? undefined : "var(--danger)" }}>
            {result.ok ? "Успіх" : "Помилка Ethora"}
            {result.status ? ` · HTTP ${result.status}` : ""}
            {result.code ? ` · ${result.code}` : ""}
          </strong>
          <pre className="code">
            {JSON.stringify(result.ok ? result.data : result.error ?? result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
