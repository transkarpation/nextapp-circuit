import { NextResponse } from "next/server";
import type { CreateUserInput, UserRole } from "@app/sdk-api";
import { requireAdmin } from "@/lib/auth";
import { createUser, listUsers } from "@/lib/users.repo";

function isRole(value: unknown): value is UserRole {
  return value === "admin" || value === "user";
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Лише для адміністраторів" }, { status: 403 });

  return NextResponse.json(await listUsers());
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Лише для адміністраторів" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as CreateUserInput;
  const email = (body.email ?? "").trim();
  const password = body.password ?? "";
  const role: UserRole = isRole(body.role) ? body.role : "user";

  if (!email) return NextResponse.json({ error: "Email обов'язковий" }, { status: 400 });
  if (password.length < 6) {
    return NextResponse.json({ error: "Пароль має бути щонайменше 6 символів" }, { status: 400 });
  }

  try {
    const user = await createUser(email, password, role);
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    // Найчастіше — email уже зайнятий або некоректний.
    const message = err instanceof Error ? err.message : "Не вдалося створити користувача";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
