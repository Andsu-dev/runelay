import { defineConfig } from "vite";

const cleanUrls = {
  name: "clean-urls",
  configureServer(server) {
    server.middlewares.use((request, _response, next) => {
      const [path, query = ""] = request.url.split("?");
      if (/^\/(pt-br\/)?setup$/.test(path)) request.url = `${path}/${query && `?${query}`}`;
      next();
    });
  },
};

export default defineConfig({
  appType: "mpa",
  plugins: [cleanUrls],
  build: {
    rollupOptions: {
      input: { en: "index.html", ptBr: "pt-br/index.html", setup: "setup/index.html", ptBrSetup: "pt-br/setup/index.html" },
    },
  },
});
