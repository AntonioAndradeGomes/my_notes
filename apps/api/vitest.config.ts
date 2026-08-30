import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Resolução de paths do tsconfig é nativa do Vite desde a v8 — o plugin
  // vite-tsconfig-paths não é mais necessário.
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts'],
  },
});
