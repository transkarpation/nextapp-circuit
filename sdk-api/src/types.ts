// Спільні типи для todo, які використовують і клієнт, і сервер.

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
