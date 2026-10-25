import { NextResponse } from "next/server";
import type { CreateTodoInput } from "@/lib/sdk";
import { getUidFromRequest } from "@/lib/auth";
import { createTodo, listTodos } from "@/lib/todos.repo";

export async function GET(req: Request) {
  const uid = await getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });

  const todos = await listTodos(uid);
  return NextResponse.json(todos);
}

export async function POST(req: Request) {
  const uid = await getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as CreateTodoInput;
  const title = (body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Назва обов'язкова" }, { status: 400 });

  const todo = await createTodo(uid, title);
  return NextResponse.json(todo, { status: 201 });
}
