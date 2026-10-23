export interface ApiClientOptions {
  /** Базова адреса. Порожня = відносні запити до того ж origin (зручно для браузера). */
  baseUrl?: string;
  /**
   * Функція, що повертає актуальний ID-токен (або null, якщо користувач не залогінений).
   * Сервер (Next.js) передає сюди Firebase getIdToken — так бібліотека не залежить від Firebase.
   */
  getToken: () => Promise<string | null>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Базовий HTTP-клієнт: додає Bearer-токен і розбирає помилки. */
export abstract class HttpClient {
  protected readonly baseUrl: string;
  private readonly getToken: () => Promise<string | null>;

  constructor(options: ApiClientOptions) {
    this.baseUrl = (options.baseUrl ?? "").replace(/\/$/, "");
    this.getToken = options.getToken;
  }

  protected async request<T>(path: string, init: RequestInit = {}): Promise<T> {
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
      throw new ApiError(message, res.status);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }
}
