"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AppUser, UserRole } from "@/lib/sdk";
import { useAuth } from "@/lib/auth-context";
import { adminApi } from "@/lib/admin-api";

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, loading, logout } = useAuth();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Форма створення.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [creating, setCreating] = useState(false);

  // Не залогінений — на /login.
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const load = useCallback(async () => {
    setError(null);
    try {
      setUsers(await adminApi.listUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user && isAdmin) load();
  }, [user, isAdmin, load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const created = await adminApi.createUser({ email: email.trim(), password, role });
      setUsers((prev) => [created, ...prev]);
      setEmail("");
      setPassword("");
      setRole("user");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося створити");
    } finally {
      setCreating(false);
    }
  }

  async function changeRole(u: AppUser, nextRole: UserRole) {
    setError(null);
    try {
      const updated = await adminApi.setRole(u.uid, { role: nextRole });
      setUsers((prev) => prev.map((x) => (x.uid === u.uid ? updated : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося змінити роль");
    }
  }

  async function remove(u: AppUser) {
    if (!window.confirm(`Видалити ${u.email}?`)) return;
    setError(null);
    try {
      await adminApi.deleteUser(u.uid);
      setUsers((prev) => prev.filter((x) => x.uid !== u.uid));
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

  return (
    <div className="container">
      <div className="topbar">
        <h1 style={{ margin: 0 }}>Користувачі</h1>
        <div className="row">
          <Link href="/todos">Мої todo</Link>
          <span className="muted">{user.email}</span>
          <button onClick={() => logout()}>Вийти</button>
        </div>
      </div>

      <div className="panel stack">
        <strong>Створити користувача</strong>
        <form className="stack" onSubmit={handleCreate}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="row">
            <input
              type="password"
              placeholder="Пароль (мін. 6)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <button className="primary" type="submit" disabled={creating}>
              Створити
            </button>
          </div>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="panel" style={{ marginTop: "1rem" }}>
        {fetching ? (
          <p className="muted">Завантаження списку…</p>
        ) : users.length === 0 ? (
          <p className="muted">Користувачів немає.</p>
        ) : (
          users.map((u) => {
            const isSelf = u.uid === user.uid;
            return (
              <div className="todo" key={u.uid}>
                <span className="title">
                  {u.email ?? "—"}
                  {isSelf && <span className="muted"> (це ти)</span>}
                </span>
                <select
                  value={u.role}
                  disabled={isSelf}
                  title={isSelf ? "Не можна змінювати власну роль" : "Змінити роль"}
                  onChange={(e) => changeRole(u, e.target.value as UserRole)}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
                <button
                  className="danger"
                  disabled={isSelf}
                  title={isSelf ? "Не можна видалити себе" : "Видалити"}
                  onClick={() => remove(u)}
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
