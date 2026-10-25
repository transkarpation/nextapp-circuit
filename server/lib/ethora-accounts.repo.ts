// Звʼязка "наш користувач (Firebase uid) → акаунт в Ethora".
// Тільки сервер. Запис у Firestore `ethoraAccounts/{uid}` робить створення
// ідемпотентним: повторні виклики (кожен вхід, кілька вкладок) не дублюють акаунт.
import "server-only";
import { EthoraApiError } from "ethora-b2b-sdk";
import type { EthoraAccountResult } from "@/lib/sdk";
import { adminDb } from "./firebase.admin";
import { getEthoraClient, isEthoraConfigured } from "./ethora";

const COLLECTION = "ethoraAccounts";
/** Через скільки "pending" вважається завислим (процес упав посеред створення). */
const STALE_PENDING_MS = 2 * 60 * 1000;

type DocStatus = "pending" | "created" | "exists";

interface EthoraAccountDoc {
  uid: string;
  email: string;
  status: DocStatus;
  ethoraUserId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface LocalUser {
  uid: string;
  email: string | null | undefined;
  displayName?: string | null;
}

// Ethora вимагає firstName + lastName. Беремо з displayName, інакше — з email.
function splitName(user: LocalUser, email: string): { firstName: string; lastName: string } {
  const parts = (user.displayName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  return { firstName: parts[0] ?? email.split("@")[0], lastName: "-" };
}

// Відповідь batch-створення нетипізована — шукаємо id першого юзера терпимо.
function extractEthoraUserId(res: unknown): string | null {
  const r = res as Record<string, unknown> | unknown[] | null;
  const pickList = (v: unknown) => (Array.isArray(v) ? v : null);
  const list =
    pickList(r) ??
    (r && typeof r === "object"
      ? (pickList((r as Record<string, unknown>).results) ??
        pickList((r as Record<string, unknown>).users) ??
        pickList((r as Record<string, unknown>).data))
      : null);
  const first = list?.[0] as Record<string, unknown> | undefined;
  const nested = (first?.user ?? first) as Record<string, unknown> | undefined;
  const id = nested?._id ?? nested?.id ?? nested?.userId;
  return id != null ? String(id) : null;
}

function toResult(doc: EthoraAccountDoc): EthoraAccountResult {
  const status = doc.status === "created" ? "linked" : doc.status;
  return { status, ethoraUserId: doc.ethoraUserId };
}

/**
 * Гарантує, що для користувача є акаунт в Ethora. Безпечно викликати скільки
 * завгодно разів. Кидає помилку, лише якщо сам виклик Ethora не вдався
 * (тоді запис-лок знімається, і наступний виклик спробує знову).
 */
export async function ensureEthoraAccount(user: LocalUser): Promise<EthoraAccountResult> {
  if (!isEthoraConfigured()) return { status: "skipped", reason: "ethora-not-configured" };
  if (!user.email) return { status: "skipped", reason: "no-email" };
  const email = user.email;

  const ref = adminDb().collection(COLLECTION).doc(user.uid);

  // Швидкий шлях: уже звʼязано.
  const existing = await ref.get();
  if (existing.exists && (existing.data() as EthoraAccountDoc).status !== "pending") {
    return toResult(existing.data() as EthoraAccountDoc);
  }

  // Захоплюємо лок транзакцією: створити може лише один запит.
  const now = Date.now();
  const claim = await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      const doc = snap.data() as EthoraAccountDoc;
      const stale = doc.status === "pending" && now - doc.updatedAt > STALE_PENDING_MS;
      if (!stale) return { claimed: false as const, doc };
    }
    const pending: EthoraAccountDoc = {
      uid: user.uid,
      email,
      status: "pending",
      ethoraUserId: null,
      createdAt: now,
      updatedAt: now,
    };
    tx.set(ref, pending);
    return { claimed: true as const };
  });

  if (!claim.claimed) return toResult(claim.doc);

  try {
    const res = await getEthoraClient().users.createSync(
      { email, ...splitName(user, email), uuid: user.uid },
      // Користувач реєструвався в нас, а не в Ethora — не шлемо йому їхній лист-підтвердження.
      { bypassEmailConfirmation: true },
    );
    const ethoraUserId = extractEthoraUserId(res);
    await ref.update({ status: "created", ethoraUserId, updatedAt: Date.now() });
    return { status: "created", ethoraUserId };
  } catch (err) {
    if (err instanceof EthoraApiError && err.status === 409) {
      // Такий email уже є в Ethora — фіксуємо, щоб не пробувати щоразу.
      await ref.update({ status: "exists", updatedAt: Date.now() });
      return { status: "exists", ethoraUserId: null };
    }
    await ref.delete(); // знімаємо лок — наступний виклик повторить
    throw err;
  }
}
