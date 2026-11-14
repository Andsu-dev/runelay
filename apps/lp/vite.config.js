import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: { input: { en: "index.html", ptBr: "pt-br/index.html" } },
  },
});
