import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts?(x)", "src/**/test.ts?(x)"],
  },
});
