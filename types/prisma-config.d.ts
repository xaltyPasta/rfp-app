// prisma.config.d.ts
declare module "prisma/config" {
  // define the minimal helpers used in prisma.config.ts
  export function defineConfig<T = any>(cfg: T): T;
  export function env<T = any>(name: string): T;

  // default export for convenience
  export default defineConfig;
}

