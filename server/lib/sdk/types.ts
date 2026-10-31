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

// ── Схеми ────────────────────────────────────────────────────────────

/** Схема без тексту — те, що показує список. */
export interface CircuitSummary {
  id: string;
  title: string;
  /** Схему може відкрити за посиланням будь-хто, навіть без входу. */
  isPublic: boolean;
  /** Unix-час у мілісекундах. */
  createdAt: number;
  updatedAt: number;
}

export interface Circuit extends CircuitSummary {
  /** Текст схеми у форматі симулятора. */
  content: string;
}

/** Схема, відкрита за посиланням: чужу публічну можна лише переглядати. */
export interface CircuitView extends Circuit {
  isOwner: boolean;
}

export interface CreateCircuitInput {
  title: string;
  content: string;
}

export interface UpdateCircuitInput {
  title?: string;
  content?: string;
  isPublic?: boolean;
}
