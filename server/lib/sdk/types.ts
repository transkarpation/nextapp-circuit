// Спільні типи todo-/admin-API.

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

// ── Ethora B2B SDK: метадані операцій (спільні між сервером і браузером) ──

/** Тип поля вводу для параметра операції. */
export type EthoraParamKind = "string" | "number" | "boolean" | "json";

export interface EthoraParamMeta {
  name: string;
  label: string;
  kind: EthoraParamKind;
  required?: boolean;
  placeholder?: string;
}

/** Опис однієї дозволеної операції SDK (без самої функції — її знає лише сервер). */
export interface EthoraOpMeta {
  id: string;
  label: string;
  /** Група для UI, напр. "apps", "users". */
  group: string;
  /** Небезпечна (змінює дані) — UI просить підтвердження. */
  danger?: boolean;
  params: EthoraParamMeta[];
}
