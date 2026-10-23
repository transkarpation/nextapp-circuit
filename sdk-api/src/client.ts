import type { CreateTodoInput, Todo, UpdateTodoInput } from "./types";

export interface TodoApiOptions {
  /** Базова адреса. Порожня = відносні запити до того ж origin (зручно для браузера). */
  baseUrl?: string;
  /**
   * Функція, що повертає актуальний ID-токен (або null, якщо користувач не залогінений).
   * Сервер (Next.js) передає сюди Firebase getIdToken — так бібліотека не залежить від Firebase.
   */
  getToken: () => Promise<string | null>;
}

export class TodoApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "TodoApiError";
  }
}

/**
 * Типізований клієнт до todo-API. Фреймворк-незалежний: працює скрізь, де є fetch.
 */
export class TodoApi {
  private readonly baseUrl: string;
  private readonly getToken: () => Promise<string | null>;

  constructor(options: TodoApiOptions) {
    this.baseUrl = (options.baseUrl ?? "").replace(/\/$/, "");
    this.getToken = options.getToken;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers });

    if (!res.ok) {
      let message = `Запит не вдався (${res.status})`;
      try {
        const data = (await res.json()) as { error?: string };
        if (data?.error) message = data.error;
      } catch {
        // тіло не JSON — лишаємо дефолтне повідомлення
      }
      throw new TodoApiError(message, res.status);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  list(): Promise<Todo[]> {
    return this.request<Todo[]>("/api/todos");
  }

  create(input: CreateTodoInput): Promise<Todo> {
    return this.request<Todo>("/api/todos", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  update(id: string, input: UpdateTodoInput): Promise<Todo> {
    return this.request<Todo>(`/api/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  remove(id: string): Promise<void> {
    return this.request<void>(`/api/todos/${id}`, { method: "DELETE" });
  }
}
