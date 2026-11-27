import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    // Les fichiers partagent un seul Redis et une seule base, et plusieurs font redis.flushall() : exécutés en parallèle
    // ils effacent les sessions les uns des autres (401 aléatoires). On les exécute donc un par un.
    fileParallelism: false,
  },
});
