import { NextResponse } from "next/server";
import type { UpdateCircuitInput } from "@/lib/sdk";
import { getUidFromRequest } from "@/lib/auth";
import { deleteCircuit, getCircuitView, updateCircuit } from "@/lib/circuits.repo";
import { validateContent, validateTitle } from "@/lib/circuits.validation";

// У Next 15+ params у route handler — це Promise.
type Ctx = { params: Promise<{ id: string }> };

// Єдиний роут без обов'язкового входу: публічну схему може прочитати будь-хто.
export async function GET(req: Request, { params }: Ctx) {
  const uid = await getUidFromRequest(req);
  const { id } = await params;

  const circuit = await getCircuitView(uid, id);
  if (!circuit) {
    return uid
      ? NextResponse.json({ error: "Не знайдено" }, { status: 404 })
      : NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  }

  return NextResponse.json(circuit);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const uid = await getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as UpdateCircuitInput;

  const patch: { title?: string; content?: string; isPublic?: boolean } = {};
  if (typeof body.title === "string") {
    const title = body.title.trim();
    const error = validateTitle(title);
    if (error) return NextResponse.json({ error }, { status: 400 });
    patch.title = title;
  }
  if (body.content !== undefined) {
    const error = validateContent(body.content);
    if (error) return NextResponse.json({ error }, { status: 400 });
    patch.content = body.content;
  }
  if (body.isPublic !== undefined) {
    if (typeof body.isPublic !== "boolean") {
      return NextResponse.json({ error: "Некоректне значення isPublic" }, { status: 400 });
    }
    patch.isPublic = body.isPublic;
  }

  const updated = await updateCircuit(uid, id, patch);
  if (!updated) return NextResponse.json({ error: "Не знайдено" }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: Ctx) {
  const uid = await getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });

  const { id } = await params;
  const ok = await deleteCircuit(uid, id);
  if (!ok) return NextResponse.json({ error: "Не знайдено" }, { status: 404 });

  return new NextResponse(null, { status: 204 });
}
