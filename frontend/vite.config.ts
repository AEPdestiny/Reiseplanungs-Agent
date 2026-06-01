import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue()],
  cacheDir: "node_modules/.vite",
  optimizeDeps: {
    include: ["vue", "vue-router", "pinia"]
  },
  server: {
    fs: {
      allow: [fileURLToPath(new URL("..", import.meta.url))]
    },
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@travel-agent/shared": fileURLToPath(new URL("../shared/src/index.ts", import.meta.url))
    }
  }
});
