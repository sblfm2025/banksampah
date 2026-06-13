import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'tests/firestore-rules/**/*.test.ts',
      'tests/firebase-integration/**/*.test.ts'
    ],
    fileParallelism: false,
  },
});
