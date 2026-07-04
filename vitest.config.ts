import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // Node's built-in `localStorage` (stable since Node 22, gated behind this
    // flag when disabled) shadows jsdom's own implementation and is missing
    // methods like `.clear()`. Setting this here (not just via NODE_OPTIONS
    // in package.json's scripts) so it also applies when Vitest is launched
    // by an IDE extension rather than `pnpm test`.
    execArgv: ["--no-experimental-webstorage"],
  },
})
