import "server-only";
import type { AppUser, UserRole } from "@/lib/sdk";
import type { UserRecord } from "firebase-admin/auth";
import { adminAuth } from "./firebase.admin";

function toAppUser(u: UserRecord): AppUser {
  const claim = (u.customClaims as { role?: unknown } | undefined)?.role;
  return {
    uid: u.uid,
    email: u.email ?? null,
    role: claim === "admin" ? "admin" : "user",
    disabled: u.disabled,
    createdAt: u.metadata.creationTime,
  };
}

/** Усі користувачі, найновіші зверху. */
export async function listUsers(): Promise<AppUser[]> {
  const { users } = await adminAuth().listUsers(1000);
  return users
    .map(toAppUser)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function createUser(
  email: string,
  password: string,
  role: UserRole,
): Promise<AppUser> {
  const user = await adminAuth().createUser({ email, password });
  await adminAuth().setCustomUserClaims(user.uid, { role });
  return toAppUser(await adminAuth().getUser(user.uid));
}

export async function setUserRole(uid: string, role: UserRole): Promise<AppUser> {
  await adminAuth().setCustomUserClaims(uid, { role });
  return toAppUser(await adminAuth().getUser(uid));
}

export async function deleteUser(uid: string): Promise<void> {
  await adminAuth().deleteUser(uid);
}
