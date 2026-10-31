"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CircuitSummary } from "@/lib/sdk";
import { useAuth } from "@/lib/auth-context";
import { circuitApi } from "@/lib/circuit-api";
import {
  BLANK_CIRCUIT,
  fetchTemplate,
  fetchTemplateGroups,
  type CircuitTemplate,
  type TemplateGroup,
} from "@/lib/circuit-templates";

function formatDate(ms: number) {
  return new Date(ms).toLocaleString("uk-UA", { dateStyle: "medium", timeStyle: "short" });
}

export default function CircuitsPage() {
  const router = useRouter();
  const { user, isAdmin, loading, logout } = useAuth();

  const [circuits, setCircuits] = useState<CircuitSummary[]>([]);
  const [groups, setGroups] = useState<TemplateGroup[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Не залогінений — на /login.
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, templates] = await Promise.all([circuitApi.list(), fetchTemplateGroups()]);
      setCircuits(list);
      setGroups(templates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const visibleGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return groups;
    return groups
      .map((group) => ({
        ...group,
        templates: group.templates.filter(
          (t) =>
            t.title.toLowerCase().includes(query) || group.title.toLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.templates.length > 0);
  }, [groups, search]);

  // Нова схема одразу відкривається в редакторі.
  async function createAndOpen(makeInput: () => Promise<{ title: string; content: string }>) {
    setError(null);
    setBusy(true);
    try {
      const created = await circuitApi.create(await makeInput());
      router.push(`/circuits/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося створити");
      setBusy(false);
    }
  }

  function addBlank(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    createAndOpen(async () => ({ title, content: BLANK_CIRCUIT }));
  }

  function addFromTemplate(template: CircuitTemplate) {
    createAndOpen(async () => ({
      title: template.title,
      content: await fetchTemplate(template.file),
    }));
  }

  async function rename(circuit: CircuitSummary) {
    const title = window.prompt("Нова назва:", circuit.title);
    if (title === null) return;
    const trimmed = title.trim();
    if (!trimmed || trimmed === circuit.title) return;
    try {
      const updated = await circuitApi.update(circuit.id, { title: trimmed });
      setCircuits((prev) => prev.map((c) => (c.id === circuit.id ? updated : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося перейменувати");
    }
  }

  async function duplicate(circuit: CircuitSummary) {
    setError(null);
    setBusy(true);
    try {
      const { content } = await circuitApi.get(circuit.id);
      const created = await circuitApi.create({ title: `${circuit.title} (копія)`, content });
      setCircuits((prev) => [created, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося скопіювати");
    } finally {
      setBusy(false);
    }
  }

  async function remove(circuit: CircuitSummary) {
    if (!window.confirm(`Видалити схему «${circuit.title}»?`)) return;
    try {
      await circuitApi.remove(circuit.id);
      setCircuits((prev) => prev.filter((c) => c.id !== circuit.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося видалити");
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
    <div className="container wide">
      <div className="topbar">
        <h1 style={{ margin: 0 }}>Мої схеми</h1>
        <div className="row">
          {isAdmin && <Link href="/admin">Адмінка</Link>}
          <Link href="/settings">Агент</Link>
          <span className="muted">{user.email ?? user.displayName}</span>
          <button onClick={() => logout()}>Вийти</button>
        </div>
      </div>

      <div className="panel">
        <form className="row" onSubmit={addBlank}>
          <input
            type="text"
            placeholder="Назва нової схеми"
            maxLength={120}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button className="primary" type="submit" disabled={busy}>
            Створити порожню
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        <div style={{ marginTop: "1rem" }}>
          {fetching ? (
            <p className="muted">Завантаження списку…</p>
          ) : circuits.length === 0 ? (
            <p className="muted">Поки що порожньо. Створи схему або вибери шаблон нижче.</p>
          ) : (
            circuits.map((circuit) => (
              <div className="circuit" key={circuit.id}>
                <div className="title">
                  <Link href={`/circuits/${circuit.id}`}>{circuit.title}</Link>
                  <div className="muted">
                    {circuit.isPublic && "Публічна · "}Змінено {formatDate(circuit.updatedAt)}
                  </div>
                </div>
                <button onClick={() => rename(circuit)} title="Перейменувати">
                  ✎
                </button>
                <button onClick={() => duplicate(circuit)} disabled={busy} title="Копіювати">
                  ⧉
                </button>
                <button className="danger" onClick={() => remove(circuit)} title="Видалити">
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <h2>Шаблони</h2>
      <div className="panel">
        <input
          type="text"
          placeholder="Пошук шаблону"
          aria-label="Пошук шаблону"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%" }}
        />
        <div style={{ marginTop: "0.75rem" }}>
          {visibleGroups.map((group) => (
            <details key={group.title} className="template-group" open={search.trim() !== ""}>
              <summary>
                {group.title} <span className="muted">({group.templates.length})</span>
              </summary>
              <div className="templates">
                {group.templates.map((template) => (
                  <button
                    key={template.file}
                    disabled={busy}
                    onClick={() => addFromTemplate(template)}
                  >
                    {template.title}
                  </button>
                ))}
              </div>
            </details>
          ))}
          {!fetching && visibleGroups.length === 0 && (
            <p className="muted">Нічого не знайдено.</p>
          )}
        </div>
      </div>
    </div>
  );
}
