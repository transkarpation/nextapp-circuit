import { HttpClient } from "./http";
import type { AppUser, CreateUserInput, SetRoleInput } from "./types";

/** Клієнт адмін-API: керування користувачами. Доступний лише адмінам (перевіряє сервер). */
export class AdminApi extends HttpClient {
  listUsers(): Promise<AppUser[]> {
    return this.request<AppUser[]>("/api/admin/users");
  }

  createUser(input: CreateUserInput): Promise<AppUser> {
    return this.request<AppUser>("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  setRole(uid: string, input: SetRoleInput): Promise<AppUser> {
    return this.request<AppUser>(`/api/admin/users/${uid}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  deleteUser(uid: string): Promise<void> {
    return this.request<void>(`/api/admin/users/${uid}`, { method: "DELETE" });
  }
}
