import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ethoraCatalog, isKnownEthoraOp, runEthoraOp } from "@/lib/ethora-ops";

/** GET /api/ethora — перелік дозволених операцій SDK (лише адмінам). */
export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Лише для адміністраторів" }, { status: 403 });

  return NextResponse.json(ethoraCatalog());
}

/** POST /api/ethora — викликати операцію `{ id, args }` через серверний SDK. */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Лише для адміністраторів" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as {
    id?: unknown;
    args?: Record<string, unknown>;
  };

  if (!isKnownEthoraOp(body.id)) {
    return NextResponse.json({ error: "Невідома або недозволена операція" }, { status: 400 });
  }

  const args = body.args && typeof body.args === "object" ? body.args : {};

  try {
    // runEthoraOp сам ловить помилки Ethora і повертає { ok: false, ... }.
    return NextResponse.json(await runEthoraOp(body.id, args));
  } catch (err) {
    // Сюди доходять лише помилки конфігу (немає env) чи невідомий збій.
    const message = err instanceof Error ? err.message : "Не вдалося виконати запит";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
