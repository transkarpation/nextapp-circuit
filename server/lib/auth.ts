import "server-only";
import type { UserRole } from "@app/sdk-api";
import { adminAuth } from "./firebase.admin";

export interface AuthInfo {
  uid: string;
  role: UserRole;
}

/**
 * Розбирає заголовок Authorization: Bearer <idToken> і повертає uid + роль.
 * Роль береться з custom claim `role` (ставиться через CLI або адмін-панель).
 * Повертає null, якщо токена немає або він недійсний.
 */
export async function getAuthFromRequest(req: Request): Promise<AuthInfo | null> {
  const match = (req.headers.get("authorization") ?? "").match(/^Bearer (.+)$/);
  if (!match) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(match[1]);
    return { uid: decoded.uid, role: decoded.role === "admin" ? "admin" : "user" };
  } catch {
    return null;
  }
}

/** Зручний шорткат для роутів, яким потрібен лише uid (наприклад, todo). */
export async function getUidFromRequest(req: Request): Promise<string | null> {
  return (await getAuthFromRequest(req))?.uid ?? null;
}

/** Повертає AuthInfo, лише якщо користувач — адмін; інакше null. */
export async function requireAdmin(req: Request): Promise<AuthInfo | null> {
  const auth = await getAuthFromRequest(req);
  return auth && auth.role === "admin" ? auth : null;
}
