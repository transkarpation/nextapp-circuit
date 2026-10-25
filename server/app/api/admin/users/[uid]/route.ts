import { NextResponse } from "next/server";
import type { SetRoleInput, UserRole } from "@/lib/sdk";
import { requireAdmin } from "@/lib/auth";
import { deleteUser, setUserRole } from "@/lib/users.repo";

type Ctx = { params: Promise<{ uid: string }> };

function isRole(value: unknown): value is UserRole {
  return value === "admin" || value === "user";
}

export async function PATCH(req: Request, { params }: Ctx) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Лише для адміністраторів" }, { status: 403 });

  const { uid } = await params;
  if (uid === admin.uid) {
    return NextResponse.json({ error: "Не можна змінювати власну роль" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as SetRoleInput;
  if (!isRole(body.role)) {
    return NextResponse.json({ error: "role має бути admin або user" }, { status: 400 });
  }

  const user = await setUserRole(uid, body.role);
  return NextResponse.json(user);
}

export async function DELETE(req: Request, { params }: Ctx) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Лише для адміністраторів" }, { status: 403 });

  const { uid } = await params;
  if (uid === admin.uid) {
    return NextResponse.json({ error: "Не можна видалити власний акаунт" }, { status: 400 });
  }

  await deleteUser(uid);
  return new NextResponse(null, { status: 204 });
}
