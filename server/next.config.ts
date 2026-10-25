import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ethora-b2b-sdk — CommonJS-пакет, що використовує node:crypto. Лишаємо його
  // зовнішнім, щоб Next не бандлив, а require-ив у рантаймі (тільки на сервері).
  serverExternalPackages: ["ethora-b2b-sdk"],
};

export default nextConfig;
