import { defineConfig } from "vite";

const cleanUrls = {
  name: "clean-urls",
  configureServer(server) {
    server.middlewares.use((request, _response, next) => {
      const [path, query = ""] = request.url.split("?");
      if (/^\/(pt-br\/)?(setup|download)$/.test(path)) request.url = `${path}/${query && `?${query}`}`;
      next();
    });
  },
};

const inlineCss = {
  name: "inline-css",
  apply: "build",
  enforce: "post",
  generateBundle(_options, bundle) {
    const styles = Object.values(bundle).filter((file) => file.fileName.endsWith(".css"));
    for (const file of Object.values(bundle)) {
      if (!file.fileName.endsWith(".html")) continue;
      let html = String(file.source);
      for (const style of styles) {
        const link = new RegExp(`<link rel="stylesheet"[^>]*href="/${style.fileName}"[^>]*>`);
        html = html.replace(link, `<style>${style.source}</style>`);
      }
      file.source = html;
    }
  },
};

export default defineConfig({
  appType: "mpa",
  plugins: [cleanUrls, inlineCss],
  build: {
    target: "es2022",
    rollupOptions: {
      input: { en: "index.html", ptBr: "pt-br/index.html", setup: "setup/index.html", ptBrSetup: "pt-br/setup/index.html", download: "download/index.html", ptBrDownload: "pt-br/download/index.html", notFound: "404.html" },
    },
  },
});
