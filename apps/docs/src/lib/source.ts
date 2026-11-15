import { llms, loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { applyMdxPreset } from "fumadocs-mdx/config";
import { defineDocs } from "fumadocs-mdx/macro";

interface MarkdownTree {
  children: { type: string; depth?: number }[];
}

const remarkDropTitleHeading = () => (tree: MarkdownTree) => {
  tree.children = tree.children.filter((node) => node.type !== "heading" || node.depth !== 1);
};

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    async: true,
    mdxOptions: applyMdxPreset({ remarkPlugins: (plugins) => [...plugins, remarkDropTitleHeading] }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});

export const source = loader({
  source: docs.toFumadocsSource(),
  baseUrl: "/",
  plugins: [lucideIconsPlugin()],
});

export const docsLlms = llms(source, {
  renderPage: async (page) => `# ${page.data.title} (${page.url})

${await page.data.getText("processed")}`,
});
