import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/**/*.spec.ts', 'node_modules'],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/api-errors.ts',
        'src/lib/api-schemas.ts',
        'src/lib/rate-limit.ts',
        'src/lib/utm.ts',
        'src/app/api/debate/score/route.ts',
        'src/app/api/debates/route.ts',
        'src/app/api/stats/route.ts',
      ],
      reporter: ['text', 'text-summary'],
    },
    setupFiles: ['tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
