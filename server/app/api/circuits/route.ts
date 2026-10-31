import { NextResponse } from "next/server";
import type { CreateCircuitInput } from "@/lib/sdk";
import { getUidFromRequest } from "@/lib/auth";
import { createCircuit, listCircuits } from "@/lib/circuits.repo";
import { validateContent, validateTitle } from "@/lib/circuits.validation";

export async function GET(req: Request) {
  const uid = await getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });

  const circuits = await listCircuits(uid);
  return NextResponse.json(circuits);
}

export async function POST(req: Request) {
  const uid = await getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Partial<CreateCircuitInput>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const error = validateTitle(title) ?? validateContent(body.content);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const circuit = await createCircuit(uid, title, body.content as string);
  return NextResponse.json(circuit, { status: 201 });
}
