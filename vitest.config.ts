import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/components/**/*.test.{ts,tsx}'],
    reporters: ['verbose', 'json'],
    outputFile: { json: './reports/vitest-results.json' },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      reportsDirectory: './reports/coverage',
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
