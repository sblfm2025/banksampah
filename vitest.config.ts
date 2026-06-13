import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    maxWorkers: 4,
    env: {
      VITE_USE_DEMO_DATA: 'true',
      VITE_DATA_PROVIDER: 'firestore',
    },
  },
});
