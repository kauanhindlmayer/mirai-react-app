import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { reactRouter } from "@react-router/dev/vite"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: parseInt(process.env.PORT ?? "5173"),
    proxy: {
      "/api": {
        target:
          process.env["services__mirai-api__https__0"] ||
          process.env["services__mirai-api__http__0"] ||
          "https://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
