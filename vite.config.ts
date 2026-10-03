import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: "dev.html"
    }
  },
  server: {
    host: "127.0.0.1",
    port: 5173
  },
  preview: {
    host: "127.0.0.1",
    port: 4173
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node"
  }
});
