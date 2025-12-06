// prisma.config.ts
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

/**
 * Load local env files in priority order:
 * 1. .env.local (optional, developer overrides)
 * 2. .env       (shared local defaults)
 *
 * In CI / Vercel, set DATABASE_URL / DIRECT_URL in environment variables directly.
 */
dotenv.config({ path: ".env.local", override: true });
dotenv.config({ path: ".env", override: false });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Primary connection used by Prisma CLI for migrations
    url: env("DATABASE_URL"),
    // Optional direct connection used by Prisma Client for dev/runtime when preferred
    directUrl: env("DIRECT_URL"),
  },
});
