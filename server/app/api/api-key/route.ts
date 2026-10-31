import { NextResponse } from "next/server";
import { getUidFromRequest } from "@/lib/auth";
import { createApiKey, getApiKeyInfo, revokeApiKey } from "@/lib/api-keys.repo";

// Лише Firebase ID-токен: сам API-ключ не може випустити собі заміну.
export async function GET(req: Request) {
  const uid = await getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });

  return NextResponse.json(await getApiKeyInfo(uid));
}

export async function POST(req: Request) {
  const uid = await getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });

  return NextResponse.json(await createApiKey(uid), { status: 201 });
}

export async function DELETE(req: Request) {
  const uid = await getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });

  await revokeApiKey(uid);
  return new NextResponse(null, { status: 204 });
}
