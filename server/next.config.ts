import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Симулятор живе у workspace-пакеті як TypeScript — його збирає сам Next.
  transpilePackages: ["@app/circuit"],
  // MCP читає шаблони з диска, а public/ у серверну функцію Vercel не потрапляє.
  outputFileTracingIncludes: {
    "/api/mcp": ["./public/templates/**/*"],
  },
};

export default nextConfig;
