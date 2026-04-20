import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['server/tests/**/*.test.ts'],
    exclude: ['src/**', 'node_modules/**', 'dist/**'],
    environment: 'node',
    globals: true,
  },
});
