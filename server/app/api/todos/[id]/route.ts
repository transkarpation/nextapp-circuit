import { NextResponse } from "next/server";
import type { UpdateTodoInput } from "@app/sdk-api";
import { getUidFromRequest } from "@/lib/auth";
import { deleteTodo, updateTodo } from "@/lib/todos.repo";

// У Next 15+ params у route handler — це Promise.
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const uid = await getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as UpdateTodoInput;

  const patch: { title?: string; completed?: boolean } = {};
  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) return NextResponse.json({ error: "Назва не може бути порожньою" }, { status: 400 });
    patch.title = title;
  }
  if (typeof body.completed === "boolean") patch.completed = body.completed;

  const updated = await updateTodo(uid, id, patch);
  if (!updated) return NextResponse.json({ error: "Не знайдено" }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: Ctx) {
  const uid = await getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });

  const { id } = await params;
  const ok = await deleteTodo(uid, id);
  if (!ok) return NextResponse.json({ error: "Не знайдено" }, { status: 404 });

  return new NextResponse(null, { status: 204 });
}
