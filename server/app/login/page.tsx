"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase.client";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Уже залогінений — на сторінку todo.
  useEffect(() => {
    if (!loading && user) router.replace("/todos");
  }, [loading, user, router]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.replace("/todos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка входу");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.replace("/todos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка входу через Google");
    } finally {
      setBusy(false);
    }
  }

  if (loading || user) {
    return (
      <div className="container">
        <p className="muted">Завантаження…</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>{mode === "signin" ? "Вхід" : "Реєстрація"}</h1>

      <div className="panel stack">
        <button className="primary" onClick={handleGoogle} disabled={busy}>
          Продовжити з Google
        </button>

        <div className="divider">або</div>

        <form className="stack" onSubmit={handleEmailSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Пароль (мін. 6 символів)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
          <button className="primary" type="submit" disabled={busy}>
            {mode === "signin" ? "Увійти" : "Зареєструватися"}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        <p className="muted">
          {mode === "signin" ? "Немає акаунту? " : "Вже є акаунт? "}
          <button
            className="link"
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
          >
            {mode === "signin" ? "Зареєструватися" : "Увійти"}
          </button>
        </p>
      </div>
    </div>
  );
}
