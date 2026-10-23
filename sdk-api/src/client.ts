import { HttpClient } from "./http";
import type { CreateTodoInput, Todo, UpdateTodoInput } from "./types";

/** Типізований клієнт до todo-API. */
export class TodoApi extends HttpClient {
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
