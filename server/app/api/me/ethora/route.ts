import { NextResponse } from "next/server";
import { getUidFromRequest } from "@/lib/auth";
import { adminAuth } from "@/lib/firebase.admin";
import { ensureEthoraAccount } from "@/lib/ethora-accounts.repo";

/**
 * POST /api/me/ethora — гарантує акаунт в Ethora для поточного користувача.
 * Ідемпотентний; клієнт викликає його після кожного входу/реєстрації.
 * Email та імʼя беремо з Firebase, а не з тіла запиту — щоб їх не можна було підмінити.
 */
export async function POST(req: Request) {
  const uid = await getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });

  try {
    const user = await adminAuth().getUser(uid);
    const result = await ensureEthoraAccount({
      uid,
      email: user.email,
      displayName: user.displayName,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[ethora] не вдалося створити акаунт для", uid, err);
    const message = err instanceof Error ? err.message : "Не вдалося створити акаунт в Ethora";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
