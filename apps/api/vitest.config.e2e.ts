import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    // Testes e2e compartilham o banco: rodar em paralelo produz interferência.
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
