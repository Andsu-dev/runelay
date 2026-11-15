import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";
import { useFumadocsLoader } from "fumadocs-core/source/client";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";
import { Suspense, use } from "react";
import { useMDXComponents } from "@/components/mdx";
import { baseOptions, githubUrl } from "@/lib/layout.shared";
import { docs, source } from "@/lib/source";

export const Route = createFileRoute("/$")({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split("/").filter(Boolean) ?? [];
    const data = await loader({ data: slugs });
    await docs.getPage(data.path)?.preload();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.title === "Introduction" ? "runelay docs" : `${loaderData.title} | runelay docs` },
          { name: "description", content: loaderData.description },
          {
            property: "og:title",
            content: loaderData.title === "Introduction" ? "runelay docs" : `${loaderData.title} | runelay docs`,
          },
          { property: "og:description", content: loaderData.description },
          { property: "og:image", content: loaderData.ogImage },
          { name: "twitter:image", content: loaderData.ogImage },
        ]
      : [],
  }),
});

const loader = createServerFn({ method: "GET" })
  .validator((slugs: string[]) => slugs)
  .middleware([staticFunctionMiddleware])
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs);
    if (!page) throw notFound();

    return {
      path: page.path,
      title: page.data.title,
      description: page.data.description ?? "",
      markdownUrl: page.url === "/" ? "/index.md" : `${page.url}.md`,
      ogImage: `https://docs.runelay.com/og${page.url === "/" ? "/index" : page.url}.png`,
      pageTree: await source.serializePageTree(source.getPageTree()),
    };
  });

function Content({ path, markdownUrl }: { path: string; markdownUrl: string }) {
  const page = docs.getPage(path);
  if (!page) throw new Error(`unknown page: ${path}`);

  const { toc } = use(page.load());
  const MDX = page.body;

  return (
    <DocsPage toc={toc}>
      <DocsTitle>{page.title}</DocsTitle>
      <DocsDescription>{page.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b -mt-4 pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`${githubUrl}/blob/main/apps/docs/content/docs/${encodeURI(path)}`}
        />
      </div>
      <DocsBody>
        <MDX components={useMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

function Page() {
  const { path, pageTree, markdownUrl } = useFumadocsLoader(Route.useLoaderData());

  return (
    <DocsLayout {...baseOptions()} tree={pageTree}>
      <Suspense>
        <Content path={path} markdownUrl={markdownUrl} />
      </Suspense>
    </DocsLayout>
  );
}
