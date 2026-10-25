import { HttpClient } from "./http";
import type { EthoraOpMeta } from "./types";

export interface EthoraRunResult {
  /** `true` — операція успішна; `false` — помилка з боку Ethora API. */
  ok: boolean;
  /** Тіло відповіді SDK (будь-який JSON) при успіху. */
  data?: unknown;
  /** Повідомлення про помилку при `ok: false`. */
  error?: string;
  /** HTTP-статус / код помилки Ethora, якщо є. */
  status?: number;
  code?: string;
}

/**
 * Клієнт сторінки /ethora-admin. Не містить самого Ethora SDK — лише ходить
 * у наш Next.js-роут /api/ethora, який (під адмін-гардом) викликає SDK на сервері.
 */
export class EthoraAdminApi extends HttpClient {
  /** Перелік дозволених операцій (метадані для побудови форми). */
  catalog(): Promise<EthoraOpMeta[]> {
    return this.request<EthoraOpMeta[]>("/api/ethora");
  }

  /** Викликати операцію за її id з уже підготованими аргументами. */
  run(id: string, args: Record<string, unknown>): Promise<EthoraRunResult> {
    return this.request<EthoraRunResult>("/api/ethora", {
      method: "POST",
      body: JSON.stringify({ id, args }),
    });
  }
}
