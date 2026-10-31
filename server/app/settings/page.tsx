"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApiKeyInfo } from "@/lib/sdk";
import { useAuth } from "@/lib/auth-context";
import { apiKeyApi } from "@/lib/api-key-api";

function formatDate(ms: number) {
  return new Date(ms).toLocaleString("uk-UA", { dateStyle: "medium", timeStyle: "short" });
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [info, setInfo] = useState<ApiKeyInfo | null>(null);
  // Сам ключ сервер не зберігає, тож він існує лише тут, до закриття сторінки.
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mcpUrl = typeof window === "undefined" ? "" : `${window.location.origin}/api/mcp`;
  const config = JSON.stringify(
    {
      mcpServers: {
        circuit: {
          type: "http",
          url: mcpUrl,
          headers: { Authorization: `Bearer ${newKey ?? "<API-ключ>"}` },
        },
      },
    },
    null,
    2,
  );

  // Не залогінений — на /login.
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    apiKeyApi
      .get()
      .then(setInfo)
      .catch((err) => setError(err instanceof Error ? err.message : "Не вдалося завантажити"))
      .finally(() => setFetching(false));
  }, [user]);

  async function generate() {
    if (info && !window.confirm("Новий ключ замінить поточний, і агенти з ним перестануть працювати. Продовжити?")) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { key, prefix, createdAt } = await apiKeyApi.create();
      setNewKey(key);
      setInfo({ prefix, createdAt });
      setCopied(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося створити ключ");
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (!window.confirm("Відкликати ключ? Агенти з ним перестануть працювати.")) return;
    setError(null);
    setBusy(true);
    try {
      await apiKeyApi.revoke();
      setInfo(null);
      setNewKey(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося відкликати ключ");
    } finally {
      setBusy(false);
    }
  }

  async function copy(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
    } catch {
      // Буфер обміну доступний лише через https і localhost; поле лишається для ручного копіювання.
      setError("Не вдалося скопіювати автоматично, виділи текст вручну");
    }
  }

  if (loading || !user) {
    return (
      <div className="container">
        <p className="muted">Завантаження…</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="topbar">
        <h1 style={{ margin: 0 }}>Підключення агента</h1>
        <Link href="/circuits">← Схеми</Link>
      </div>

      <div className="panel">
        <p className="muted" style={{ marginTop: 0 }}>
          Агент з підтримкою MCP може створювати й редагувати твої схеми. Видаляти їх і робити
          публічними він не може.
        </p>

        <h2>Адреса MCP-сервера</h2>
        <div className="row">
          <input type="text" aria-label="Адреса MCP-сервера" readOnly value={mcpUrl} />
          <button onClick={() => copy("url", mcpUrl)}>{copied === "url" ? "Скопійовано" : "Копіювати"}</button>
        </div>

        <h2>API-ключ</h2>
        {fetching ? (
          <p className="muted">Завантаження…</p>
        ) : (
          <>
            {newKey ? (
              <>
                <div className="row">
                  <input
                    type="text"
                    aria-label="API-ключ"
                    readOnly
                    value={newKey}
                    onFocus={(e) => e.target.select()}
                  />
                  <button className="primary" onClick={() => copy("key", newKey)}>
                    {copied === "key" ? "Скопійовано" : "Копіювати"}
                  </button>
                </div>
                <p className="muted">Скопіюй ключ зараз: більше його не буде видно.</p>
              </>
            ) : info ? (
              <p className="muted">
                Ключ <code>{info.prefix}…</code> створено {formatDate(info.createdAt)}. Повністю його
                побачити не можна; якщо ключ загубився, створи новий.
              </p>
            ) : (
              <p className="muted">Ключа ще немає.</p>
            )}
            <div className="row">
              <button className={info ? undefined : "primary"} onClick={generate} disabled={busy}>
                {info ? "Створити новий ключ" : "Створити ключ"}
              </button>
              {info && (
                <button className="danger" onClick={revoke} disabled={busy}>
                  Відкликати
                </button>
              )}
            </div>
          </>
        )}

        {error && <p className="error">{error}</p>}

        <h2>Приклад налаштування</h2>
        <pre className="code-block">{config}</pre>
        <button onClick={() => copy("config", config)}>{copied === "config" ? "Скопійовано" : "Копіювати"}</button>
      </div>
    </div>
  );
}
