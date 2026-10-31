"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { EditorHandle } from "@app/circuit/editor";
import "@app/circuit/editor.css";
import { ApiError } from "@/lib/sdk";
import { useAuth } from "@/lib/auth-context";
import { circuitApi } from "@/lib/circuit-api";

// Пауза після останньої правки, перш ніж зберегти.
const AUTOSAVE_DELAY_MS = 2000;
// Скільки кнопка показує «Скопійовано».
const COPIED_RESET_MS = 2000;

type SaveStatus = "saved" | "dirty" | "saving" | "error";

const STATUS_TEXT: Record<SaveStatus, string> = {
  saved: "Збережено",
  dirty: "Є незбережені зміни",
  saving: "Збереження…",
  error: "Не вдалося зберегти",
};

export default function CircuitEditorPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [ready, setReady] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const savedTitleRef = useRef("");
  const editorRef = useRef<EditorHandle | null>(null);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef<Promise<boolean> | null>(null);

  // Одночасно йде лише одне збереження; правки, зроблені під час нього, зберігає наступний цикл.
  const save = useCallback((): Promise<boolean> => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (savingRef.current) return savingRef.current;

    const run = (async () => {
      while (dirtyRef.current && editorRef.current) {
        dirtyRef.current = false;
        setStatus("saving");
        try {
          await circuitApi.update(id, { content: editorRef.current.getText() });
        } catch {
          dirtyRef.current = true;
          setStatus("error");
          return false;
        }
      }
      setStatus("saved");
      return true;
    })().finally(() => {
      savingRef.current = null;
    });

    savingRef.current = run;
    return run;
  }, [id]);

  const handleChange = useCallback(() => {
    dirtyRef.current = true;
    setStatus("dirty");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, AUTOSAVE_DELAY_MS);
  }, [save]);

  // Чекаємо лише завершення перевірки входу: публічну схему відкриваємо й без користувача.
  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    let editor: EditorHandle | null = null;

    (async () => {
      try {
        // Симулятор великий і працює лише в браузері — вантажимо його тільки тут.
        const [circuit, { mountEditor }] = await Promise.all([
          circuitApi.get(id),
          import("@app/circuit/editor"),
        ]);
        if (cancelled || !stageRef.current) return;
        setTitle(circuit.title);
        savedTitleRef.current = circuit.title;
        setIsOwner(circuit.isOwner);
        setIsPublic(circuit.isPublic);
        editor = mountEditor(stageRef.current, {
          text: circuit.content,
          // Глядач може гратися зі схемою, але без onChange нічого не зберігається.
          onChange: circuit.isOwner ? handleChange : undefined,
          fileName: () => `${savedTitleRef.current}.txt`,
        });
        editorRef.current = editor;
        setReady(true);
      } catch (err) {
        if (cancelled) return;
        // Схема не публічна, а користувач не залогінений — на /login.
        if (err instanceof ApiError && err.status === 401 && !user) router.replace("/login");
        else setError(err instanceof Error ? err.message : "Не вдалося відкрити схему");
      }
    })();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (!editor) return;
      // Сюди потрапляємо і при переході кнопкою «назад» у браузері: останні правки не губимо.
      if (dirtyRef.current) {
        dirtyRef.current = false;
        circuitApi.update(id, { content: editor.getText() }).catch(() => {});
      }
      editor.destroy();
      editorRef.current = null;
    };
  }, [loading, user, id, handleChange, router]);

  // Попередження при закритті вкладки з незбереженими змінами.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current || savingRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  async function commitTitle() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === savedTitleRef.current) {
      setTitle(savedTitleRef.current);
      return;
    }
    try {
      const updated = await circuitApi.update(id, { title: trimmed });
      setTitle(updated.title);
      savedTitleRef.current = updated.title;
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося перейменувати");
    }
  }

  async function togglePublic(next: boolean) {
    setSharing(true);
    try {
      const updated = await circuitApi.update(id, { isPublic: next });
      setIsPublic(updated.isPublic);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося змінити доступ");
    } finally {
      setSharing(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      setError("Не вдалося скопіювати посилання");
    }
  }

  async function leave(e: React.MouseEvent) {
    e.preventDefault();
    const ok = await save();
    if (ok || window.confirm("Зміни не збережено. Все одно вийти?")) router.push("/circuits");
  }

  if (loading) {
    return (
      <div className="container">
        <p className="muted">Завантаження…</p>
      </div>
    );
  }

  const readOnly = ready && !isOwner;

  return (
    <div className="editor-page">
      <div className="editor-bar">
        {user ? (
          <Link href="/circuits" onClick={leave}>
            ← Мої схеми
          </Link>
        ) : (
          <Link href="/login">Увійти</Link>
        )}
        {readOnly ? (
          <>
            <strong className="editor-title">{title}</strong>
            <span className="muted">Перегляд: зміни не зберігаються</span>
          </>
        ) : (
          <>
            <input
              type="text"
              aria-label="Назва схеми"
              maxLength={120}
              value={title}
              disabled={!ready}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
            />
            {ready && (
              <span
                className={status === "error" ? "error" : "muted"}
                style={{ margin: 0 }}
                role="status"
              >
                {STATUS_TEXT[status]}
              </span>
            )}
            {ready && (
              <label className="editor-share" title="Схему зможе відкрити кожен, хто має посилання">
                <input
                  type="checkbox"
                  checked={isPublic}
                  disabled={sharing}
                  onChange={(e) => togglePublic(e.target.checked)}
                />
                Публічна
              </label>
            )}
            {ready && isPublic && (
              <button onClick={copyLink}>{copied ? "Скопійовано" : "Копіювати посилання"}</button>
            )}
            <button
              className="primary"
              onClick={() => save()}
              disabled={!ready || status === "saved" || status === "saving"}
              title="Ctrl+S"
            >
              Зберегти
            </button>
          </>
        )}
      </div>
      {error && <p className="error editor-error">{error}</p>}
      {!ready && !error && <p className="muted editor-error">Завантаження схеми…</p>}
      <div ref={stageRef} className="editor-stage" />
    </div>
  );
}
