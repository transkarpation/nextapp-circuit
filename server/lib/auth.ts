import "server-only";
import type { UserRole } from "@/lib/sdk";
import { findUidByApiKey } from "./api-keys.repo";
import { adminAuth } from "./firebase.admin";

export interface AuthInfo {
  uid: string;
  role: UserRole;
}

function getBearerToken(req: Request): string | null {
  return (req.headers.get("authorization") ?? "").match(/^Bearer (.+)$/)?.[1] ?? null;
}

/**
 * Розбирає заголовок Authorization: Bearer <idToken> і повертає uid + роль.
 * Роль береться з custom claim `role` (ставиться через CLI або адмін-панель).
 * Повертає null, якщо токена немає або він недійсний.
 */
export async function getAuthFromRequest(req: Request): Promise<AuthInfo | null> {
  const token = getBearerToken(req);
  if (!token) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    return { uid: decoded.uid, role: decoded.role === "admin" ? "admin" : "user" };
  } catch {
    return null;
  }
}

/** Зручний шорткат для роутів, яким потрібен лише uid (наприклад, todo). */
export async function getUidFromRequest(req: Request): Promise<string | null> {
  return (await getAuthFromRequest(req))?.uid ?? null;
}

/** Для агентів: заголовок Authorization: Bearer <API-ключ> замість короткоживучого ID-токена. */
export async function getUidFromApiKey(req: Request): Promise<string | null> {
  const token = getBearerToken(req);
  return token ? findUidByApiKey(token) : null;
}

/** Повертає AuthInfo, лише якщо користувач — адмін; інакше null. */
export async function requireAdmin(req: Request): Promise<AuthInfo | null> {
  const auth = await getAuthFromRequest(req);
  return auth && auth.role === "admin" ? auth : null;
}
