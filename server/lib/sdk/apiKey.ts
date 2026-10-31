import { HttpClient } from "./http";
import type { ApiKeyInfo, CreatedApiKey } from "./types";

/** Типізований клієнт до API-ключа для агентів. */
export class ApiKeyApi extends HttpClient {
  get(): Promise<ApiKeyInfo | null> {
    return this.request<ApiKeyInfo | null>("/api/api-key");
  }

  /** Попередній ключ перестає працювати. */
  create(): Promise<CreatedApiKey> {
    return this.request<CreatedApiKey>("/api/api-key", { method: "POST" });
  }

  revoke(): Promise<void> {
    return this.request<void>("/api/api-key", { method: "DELETE" });
  }
}
