import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    css: true,
    globals: true,
    mockReset: true,
    restoreMocks: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      exclude: [
        "coverage/**",
        "dist/**",
        "playwright/**",
        "scripts/**",
        "**/*.config.{js,ts}",
        "eslint.config.js",
        "playwright-fixture.ts",
        "src/components/ui/**",
        "src/integrations/**",
        "src/main.tsx",
        "src/test/**",
        "src/vite-env.d.ts",
      ],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
