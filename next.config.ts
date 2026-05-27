import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

// Force-load .env.local before the config is evaluated so that
// process.env vars are available to API route handlers at runtime.
loadEnvConfig(process.cwd());

const nextConfig: NextConfig = {
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
  },
};

export default nextConfig;
