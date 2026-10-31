import "server-only";
import type { Circuit, CircuitSummary } from "@/lib/sdk";
import {
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { adminDb } from "./firebase.admin";

const COLLECTION = "circuits";

interface CircuitDoc {
  uid: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

function toSummary(snap: QueryDocumentSnapshot<DocumentData>): CircuitSummary {
  const data = snap.data() as CircuitDoc;
  return {
    id: snap.id,
    title: data.title,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function toCircuit(snap: QueryDocumentSnapshot<DocumentData>): Circuit {
  return { ...toSummary(snap), content: (snap.data() as CircuitDoc).content };
}

/** Схеми користувача без тексту, останні змінені зверху (сортуємо в пам'яті — composite index не потрібен). */
export async function listCircuits(uid: string): Promise<CircuitSummary[]> {
  const snap = await adminDb()
    .collection(COLLECTION)
    .where("uid", "==", uid)
    .select("title", "createdAt", "updatedAt")
    .get();
  return snap.docs.map(toSummary).sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Повертає null, якщо схема не існує або належить іншому користувачу. */
export async function getCircuit(uid: string, id: string): Promise<Circuit | null> {
  const snap = await adminDb().collection(COLLECTION).doc(id).get();
  if (!snap.exists || (snap.data() as CircuitDoc).uid !== uid) return null;
  return toCircuit(snap as QueryDocumentSnapshot<DocumentData>);
}

export async function createCircuit(uid: string, title: string, content: string): Promise<Circuit> {
  const now = Date.now();
  const doc: CircuitDoc = { uid, title, content, createdAt: now, updatedAt: now };
  const ref = await adminDb().collection(COLLECTION).add(doc);
  return { id: ref.id, title, content, createdAt: now, updatedAt: now };
}

/** Повертає null, якщо схема не існує або належить іншому користувачу. */
export async function updateCircuit(
  uid: string,
  id: string,
  patch: { title?: string; content?: string },
): Promise<Circuit | null> {
  const ref = adminDb().collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists || (snap.data() as CircuitDoc).uid !== uid) return null;

  await ref.update({ ...patch, updatedAt: Date.now() });
  const updated = await ref.get();
  return toCircuit(updated as QueryDocumentSnapshot<DocumentData>);
}

/** Повертає false, якщо схема не існує або належить іншому користувачу. */
export async function deleteCircuit(uid: string, id: string): Promise<boolean> {
  const ref = adminDb().collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists || (snap.data() as CircuitDoc).uid !== uid) return false;
  await ref.delete();
  return true;
}
