import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Дозволяє Next.js компілювати TS-сорси локальної бібліотеки напряму,
  // без окремого кроку збірки sdk-api.
  transpilePackages: ["@app/sdk-api"],
};

export default nextConfig;
