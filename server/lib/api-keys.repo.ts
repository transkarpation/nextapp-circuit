import "server-only";
import type { ApiKeyInfo, CreatedApiKey } from "@/lib/sdk";
import { createHash, randomBytes } from "node:crypto";
import { adminAuth, adminDb } from "./firebase.admin";

const COLLECTION = "apiKeys";
const KEY_PREFIX = "ckt_";
const VISIBLE_CHARS = 8;

/** Id документа — uid, тож у користувача може бути лише один ключ. */
interface ApiKeyDoc {
  hash: string;
  /** Початок ключа, щоб упізнати його в списку налаштувань клієнта. */
  prefix: string;
  createdAt: number;
}

// Ключ — 256 випадкових біт, тому повільний хеш тут нічого не дає.
function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function getApiKeyInfo(uid: string): Promise<ApiKeyInfo | null> {
  const snap = await adminDb().collection(COLLECTION).doc(uid).get();
  if (!snap.exists) return null;
  const { prefix, createdAt } = snap.data() as ApiKeyDoc;
  return { prefix, createdAt };
}

/** Створює ключ, замінюючи попередній. Сам ключ не зберігається: його видно лише у цій відповіді. */
export async function createApiKey(uid: string): Promise<CreatedApiKey> {
  const key = KEY_PREFIX + randomBytes(32).toString("base64url");
  const doc: ApiKeyDoc = {
    hash: hashKey(key),
    prefix: key.slice(0, KEY_PREFIX.length + VISIBLE_CHARS),
    createdAt: Date.now(),
  };
  await adminDb().collection(COLLECTION).doc(uid).set(doc);
  return { key, prefix: doc.prefix, createdAt: doc.createdAt };
}

export async function revokeApiKey(uid: string): Promise<void> {
  await adminDb().collection(COLLECTION).doc(uid).delete();
}

/** Повертає uid власника ключа. Заблокований або видалений користувач доступу не має. */
export async function findUidByApiKey(key: string): Promise<string | null> {
  if (!key.startsWith(KEY_PREFIX)) return null;
  const snap = await adminDb()
    .collection(COLLECTION)
    .where("hash", "==", hashKey(key))
    .limit(1)
    .get();
  if (snap.empty) return null;

  const uid = snap.docs[0].id;
  try {
    const user = await adminAuth().getUser(uid);
    return user.disabled ? null : uid;
  } catch {
    return null;
  }
}
