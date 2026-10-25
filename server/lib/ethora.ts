// Побудова серверного клієнта Ethora B2B SDK з env. Тільки сервер:
// підписує токени app-секретом і ходить у бекенд Ethora — у браузер не потрапляє.
import "server-only";
import { EthoraB2BClient } from "ethora-b2b-sdk";

let cached: EthoraB2BClient | null = null;

/**
 * Повертає (кешований) клієнт Ethora. Конфіг — з .env.local:
 *  - ETHORA_BASE_URL — обовʼязковий;
 *  - ETHORA_SERVER_TOKEN — готовий серверний токен (варіант A), АБО
 *  - ETHORA_APP_ID + ETHORA_APP_SECRET (+ ETHORA_TENANT_ID) — підпис локально (варіант B).
 *
 * Кидає Error зі зрозумілим повідомленням, якщо конфіг неповний.
 */
export function getEthoraClient(): EthoraB2BClient {
  if (cached) return cached;

  const baseUrl = process.env.ETHORA_BASE_URL;
  if (!baseUrl) {
    throw new Error("ETHORA_BASE_URL не задано (див. .env.local.example)");
  }

  const token = process.env.ETHORA_SERVER_TOKEN;
  if (token) {
    cached = new EthoraB2BClient({ baseUrl, token });
    return cached;
  }

  const appId = process.env.ETHORA_APP_ID;
  const appSecret = process.env.ETHORA_APP_SECRET;
  if (appId && appSecret) {
    cached = EthoraB2BClient.withAppSecret({
      baseUrl,
      appId,
      appSecret,
      tenantId: process.env.ETHORA_TENANT_ID || undefined,
    });
    return cached;
  }

  throw new Error(
    "Немає креденшелів Ethora: задай ETHORA_SERVER_TOKEN або ETHORA_APP_ID + ETHORA_APP_SECRET",
  );
}

/** Чи заданий конфіг Ethora в env (без нього інтеграція просто вимкнена). */
export function isEthoraConfigured(): boolean {
  return Boolean(
    process.env.ETHORA_BASE_URL &&
      (process.env.ETHORA_SERVER_TOKEN ||
        (process.env.ETHORA_APP_ID && process.env.ETHORA_APP_SECRET)),
  );
}

/** Секрет для внутрішніх запитів (verifyToken → x-internal-secret), якщо заданий. */
export function getEthoraInternalSecret(): string | undefined {
  return process.env.ETHORA_INTERNAL_SECRET || undefined;
}
