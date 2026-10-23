import "server-only";
import { adminAuth } from "./firebase.admin";

/**
 * Дістає uid з заголовка Authorization: Bearer <idToken>.
 * Повертає null, якщо токена немає або він недійсний.
 */
export async function getUidFromRequest(req: Request): Promise<string | null> {
  const match = (req.headers.get("authorization") ?? "").match(/^Bearer (.+)$/);
  if (!match) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(match[1]);
    return decoded.uid;
  } catch {
    return null;
  }
}
