"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Todo } from "@app/sdk-api";
import { useAuth } from "@/lib/auth-context";
import { todoApi } from "@/lib/todo-api";

export default function TodosPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Не залогінений — на /login.
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const load = useCallback(async () => {
    setError(null);
    try {
      setTodos(await todoApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setError(null);
    try {
      const created = await todoApi.create({ title });
      setTodos((prev) => [created, ...prev]);
      setNewTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося створити");
    }
  }

  async function toggle(todo: Todo) {
    try {
      const updated = await todoApi.update(todo.id, { completed: !todo.completed });
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося оновити");
    }
  }

  async function rename(todo: Todo) {
    const title = window.prompt("Нова назва:", todo.title);
    if (title === null) return;
    const trimmed = title.trim();
    if (!trimmed || trimmed === todo.title) return;
    try {
      const updated = await todoApi.update(todo.id, { title: trimmed });
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося перейменувати");
    }
  }

  async function remove(todo: Todo) {
    try {
      await todoApi.remove(todo.id);
      setTodos((prev) => prev.filter((t) => t.id !== todo.id));
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
    <div className="container">
      <div className="topbar">
        <h1 style={{ margin: 0 }}>Мої todo</h1>
        <div className="row">
          <span className="muted">{user.email ?? user.displayName}</span>
          <button onClick={() => logout()}>Вийти</button>
        </div>
      </div>

      <div className="panel">
        <form className="row" onSubmit={addTodo}>
          <input
            type="text"
            placeholder="Що потрібно зробити?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button className="primary" type="submit">
            Додати
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        <div style={{ marginTop: "1rem" }}>
          {fetching ? (
            <p className="muted">Завантаження списку…</p>
          ) : todos.length === 0 ? (
            <p className="muted">Поки що порожньо. Додай перший запис 👆</p>
          ) : (
            todos.map((todo) => (
              <div className="todo" key={todo.id}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggle(todo)}
                />
                <span
                  className={`title${todo.completed ? " done" : ""}`}
                  onDoubleClick={() => rename(todo)}
                  title="Подвійний клік — перейменувати"
                >
                  {todo.title}
                </span>
                <button onClick={() => rename(todo)}>✎</button>
                <button className="danger" onClick={() => remove(todo)}>
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
