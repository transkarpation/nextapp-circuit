import { HttpClient } from "./http";
import type { EthoraAccountResult } from "./types";

/** Клієнт API поточного користувача (не адмінський). */
export class AccountApi extends HttpClient {
  /** Гарантувати акаунт в Ethora для поточного користувача (ідемпотентно). */
  ensureEthoraAccount(): Promise<EthoraAccountResult> {
    return this.request<EthoraAccountResult>("/api/me/ethora", { method: "POST" });
  }
}
