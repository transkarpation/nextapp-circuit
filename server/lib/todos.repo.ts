import "server-only";
import type { Todo } from "@app/sdk-api";
import {
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { adminDb } from "./firebase.admin";

const COLLECTION = "todos";

interface TodoDoc {
  uid: string;
  title: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

function toTodo(snap: QueryDocumentSnapshot<DocumentData>): Todo {
  const data = snap.data() as TodoDoc;
  return {
    id: snap.id,
    title: data.title,
    completed: data.completed,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/** Усі todo користувача, найновіші зверху (сортуємо в пам'яті — composite index не потрібен). */
export async function listTodos(uid: string): Promise<Todo[]> {
  const snap = await adminDb().collection(COLLECTION).where("uid", "==", uid).get();
  return snap.docs.map(toTodo).sort((a, b) => b.createdAt - a.createdAt);
}

export async function createTodo(uid: string, title: string): Promise<Todo> {
  const now = Date.now();
  const doc: TodoDoc = { uid, title, completed: false, createdAt: now, updatedAt: now };
  const ref = await adminDb().collection(COLLECTION).add(doc);
  return { id: ref.id, title, completed: false, createdAt: now, updatedAt: now };
}

/** Повертає null, якщо запис не існує або належить іншому користувачу. */
export async function updateTodo(
  uid: string,
  id: string,
  patch: { title?: string; completed?: boolean },
): Promise<Todo | null> {
  const ref = adminDb().collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists || (snap.data() as TodoDoc).uid !== uid) return null;

  const update: Partial<TodoDoc> = { updatedAt: Date.now() };
  if (typeof patch.title === "string") update.title = patch.title;
  if (typeof patch.completed === "boolean") update.completed = patch.completed;

  await ref.update(update);
  const updated = await ref.get();
  return toTodo(updated as QueryDocumentSnapshot<DocumentData>);
}

/** Повертає false, якщо запис не існує або належить іншому користувачу. */
export async function deleteTodo(uid: string, id: string): Promise<boolean> {
  const ref = adminDb().collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists || (snap.data() as TodoDoc).uid !== uid) return false;
  await ref.delete();
  return true;
}
