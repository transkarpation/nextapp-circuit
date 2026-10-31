import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Симулятор живе у workspace-пакеті як TypeScript — його збирає сам Next.
  transpilePackages: ["@app/circuit"],
};

export default nextConfig;
