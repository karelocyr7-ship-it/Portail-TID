import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ client: vi.fn(), adapter: vi.fn() }));
vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    constructor() {
      mocks.client();
    }
  },
}));
vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: class {
    constructor() {
      mocks.adapter();
    }
  },
}));
const globalCache = globalThis as typeof globalThis & { prisma?: unknown };
beforeEach(() => {
  delete globalCache.prisma;
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv("DATABASE_URL", "postgresql://synthetic@db.invalid/fixture");
});
afterEach(() => {
  delete globalCache.prisma;
  vi.unstubAllEnvs();
});
it.each(["production", "development"])(
  "uses one client/pool for repeated worker lookups in %s",
  async (environment) => {
    vi.stubEnv("NODE_ENV", environment);
    const { getPrisma } = await import("@/lib/prisma");
    const first = getPrisma();
    for (let job = 0; job < 250; job++) expect(getPrisma()).toBe(first);
    expect(mocks.client).toHaveBeenCalledOnce();
    expect(mocks.adapter).toHaveBeenCalledOnce();
  },
);
it("fails before creating a pool if no database URL is configured", async () => {
  vi.stubEnv("DATABASE_URL", "");
  const { getPrisma } = await import("@/lib/prisma");
  expect(() => getPrisma()).toThrow("DATABASE_URL is required");
  expect(mocks.client).not.toHaveBeenCalled();
});
