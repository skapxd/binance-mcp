import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.ts"],
    testTimeout: 30000, // Aumentamos a 30s para carga masiva
    fileParallelism: false // Evitamos problemas de concurrencia en stdio
  },
});
