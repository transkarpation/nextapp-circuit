// Спільні типи, які використовують і клієнт, і сервер.

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  /** Unix-час у мілісекундах. */
  createdAt: number;
  updatedAt: number;
}

export interface CreateTodoInput {
  title: string;
}

export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
}

// ── Користувачі / ролі ───────────────────────────────────────────────

export type UserRole = "admin" | "user";

export interface AppUser {
  uid: string;
  email: string | null;
  role: UserRole;
  disabled: boolean;
  /** ISO-рядок часу створення (з Firebase metadata). */
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role?: UserRole;
}

export interface SetRoleInput {
  role: UserRole;
}
