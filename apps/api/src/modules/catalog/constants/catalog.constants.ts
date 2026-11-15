import type { GoogleService } from "@runelay/shared";
import { env } from "@/config/env";
import type { CatalogEntry, CatalogSection } from "@/modules/catalog/types/catalog.types";
import { GOOGLE_SOURCE_URL } from "@/modules/google/constants/google.constants";
import { GITHUB_BROKER_CLIENT_ID } from "@/modules/oauth/constants/oauth.constants";
import { hashUrl } from "@/modules/sources/utils/url-hash";

const GITHUB_CLIENT_ID = env.RUNELAY_GITHUB_CLIENT_ID || GITHUB_BROKER_CLIENT_ID;

export const CATALOG: CatalogSection[] = [
  {
    id: "popular",
    title: "Populares",
    items: [
      {
        id: "linear",
        name: "Linear",
        description: "Issues, projetos e ciclos do seu time.",
        url: "https://mcp.linear.app/mcp",
        icon: "linear",
        auth: "oauth",
      },
      {
        id: "github",
        name: "GitHub",
        description: "Repositórios, issues e pull requests.",
        url: "https://api.githubcopilot.com/mcp/",
        icon: "github",
        auth: "oauth",
        broker: { provider: "github", clientId: GITHUB_CLIENT_ID, scopes: ["repo", "read:user"] },
      },
      {
        id: "google_calendar",
        name: "Google Agenda",
        description: "Eventos e agendas da sua conta.",
        url: "https://calendarmcp.googleapis.com/mcp/v1",
        icon: "googlecalendar",
        auth: "oauth",
        googleService: "calendar",
      },
      {
        id: "gmail",
        name: "Gmail",
        description: "Envie e-mails pela sua conta.",
        url: "https://gmail.googleapis.com",
        icon: "gmail",
        auth: "oauth",
        googleService: "gmail",
      },
      {
        id: "notion",
        name: "Notion",
        description: "Páginas, bancos e busca no workspace.",
        url: "https://mcp.notion.com/mcp",
        icon: "notion",
        auth: "oauth",
      },
      {
        id: "atlassian",
        name: "Atlassian",
        description: "Jira e Confluence num lugar só.",
        url: "https://mcp.atlassian.com/v1/mcp",
        icon: "atlassian",
        auth: "oauth",
      },
      {
        id: "stripe",
        name: "Stripe",
        description: "Clientes, pagamentos e assinaturas.",
        url: "https://mcp.stripe.com",
        icon: "stripe",
        auth: "oauth",
      },
      {
        id: "canva",
        name: "Canva",
        description: "Crie e edite designs pelo agente.",
        url: "https://mcp.canva.com/mcp",
        icon: "canva",
        auth: "oauth",
      },
    ],
  },
  {
    id: "dev",
    title: "Para desenvolver",
    items: [
      {
        id: "vercel",
        name: "Vercel",
        description: "Deploys, projetos e logs.",
        url: "https://mcp.vercel.com",
        icon: "vercel",
        auth: "oauth",
      },
      {
        id: "supabase",
        name: "Supabase",
        description: "Banco, tabelas, migrations e logs.",
        url: "https://mcp.supabase.com/mcp",
        icon: "supabase",
        auth: "oauth",
      },
      {
        id: "sentry",
        name: "Sentry",
        description: "Erros, issues e releases.",
        url: "https://mcp.sentry.dev/mcp",
        icon: "sentry",
        auth: "oauth",
      },
      {
        id: "cloudflare",
        name: "Cloudflare",
        description: "Workers, DNS, R2, D1 e o resto da conta pela API.",
        url: "https://mcp.cloudflare.com/mcp",
        icon: "cloudflare",
        auth: "oauth",
      },
      {
        id: "cloudflare_docs",
        name: "Cloudflare Docs",
        description: "Busca na documentação da Cloudflare.",
        url: "https://docs.mcp.cloudflare.com/mcp",
        icon: "cloudflare",
        auth: "none",
      },
      {
        id: "neon",
        name: "Neon",
        description: "Postgres serverless, branches e SQL.",
        url: "https://mcp.neon.tech/mcp",
        icon: "neon",
        auth: "oauth",
      },
      {
        id: "posthog",
        name: "PostHog",
        description: "Eventos, insights e feature flags.",
        url: "https://mcp.posthog.com/mcp",
        icon: "posthog",
        auth: "oauth",
      },
      {
        id: "netlify",
        name: "Netlify",
        description: "Sites, deploys e variáveis de ambiente.",
        url: "https://mcp.netlify.com/mcp",
        icon: "netlify",
        auth: "oauth",
      },
      {
        id: "prisma",
        name: "Prisma Postgres",
        description: "Bancos Prisma Postgres e migrations.",
        url: "https://mcp.prisma.io/mcp",
        icon: "prisma",
        auth: "oauth",
      },
      {
        id: "deepwiki",
        name: "DeepWiki",
        description: "Pergunte sobre qualquer repositório público.",
        url: "https://mcp.deepwiki.com/mcp",
        icon: null,
        auth: "none",
      },
      {
        id: "context7",
        name: "Context7",
        description: "Documentação atualizada de bibliotecas.",
        url: "https://mcp.context7.com/mcp",
        icon: null,
        auth: "none",
      },
      {
        id: "huggingface",
        name: "Hugging Face",
        description: "Modelos, datasets e Spaces.",
        url: "https://huggingface.co/mcp",
        icon: "huggingface",
        auth: "none",
      },
    ],
  },
  {
    id: "work",
    title: "Trabalho e conteúdo",
    items: [
      {
        id: "google_drive",
        name: "Google Drive",
        description: "Arquivos criados pelo runelay no seu Drive.",
        url: "https://www.googleapis.com/drive/v3",
        icon: "googledrive",
        auth: "oauth",
        googleService: "drive",
      },
      {
        id: "google_docs",
        name: "Google Docs",
        description: "Crie, leia e edite documentos.",
        url: "https://docsmcp.googleapis.com/mcp/v1",
        icon: "googledocs",
        auth: "oauth",
        googleService: "docs",
      },
      {
        id: "google_sheets",
        name: "Google Sheets",
        description: "Crie planilhas e edite células.",
        url: "https://sheetsmcp.googleapis.com/mcp/v1",
        icon: "googlesheets",
        auth: "oauth",
        googleService: "sheets",
      },
      {
        id: "google_slides",
        name: "Google Slides",
        description: "Crie apresentações e slides.",
        url: "https://slidesmcp.googleapis.com/mcp/v1",
        icon: "googleslides",
        auth: "oauth",
        googleService: "slides",
      },
      {
        id: "google_forms",
        name: "Google Forms",
        description: "Crie formulários e perguntas.",
        url: "https://forms.googleapis.com",
        icon: "googleforms",
        auth: "oauth",
        googleService: "forms",
      },
      {
        id: "google_meet",
        name: "Google Meet",
        description: "Crie salas de reunião com link.",
        url: "https://meet.googleapis.com",
        icon: "googlemeet",
        auth: "oauth",
        googleService: "meet",
      },
      {
        id: "asana",
        name: "Asana",
        description: "Tarefas, projetos e prazos.",
        url: "https://mcp.asana.com/v2/mcp",
        icon: "asana",
        auth: "oauth",
      },
      {
        id: "hubspot",
        name: "HubSpot",
        description: "Contatos, empresas e negócios do CRM.",
        url: "https://mcp.hubspot.com/",
        icon: "hubspot",
        auth: "oauth",
      },
      {
        id: "monday",
        name: "monday.com",
        description: "Quadros, itens e atualizações.",
        url: "https://mcp.monday.com/mcp",
        icon: null,
        auth: "oauth",
      },
      {
        id: "resend",
        name: "Resend",
        description: "Envio de e-mails, domínios e contatos.",
        url: "https://mcp.resend.com/mcp",
        icon: "resend",
        auth: "oauth",
      },
      {
        id: "buffer",
        name: "Buffer",
        description: "Posts agendados, ideias e métricas das redes sociais.",
        url: "https://mcp.buffer.com/mcp",
        icon: "buffer",
        auth: "api_key",
        tokenUrl: "https://publish.buffer.com/settings/api",
      },
      {
        id: "webflow",
        name: "Webflow",
        description: "Sites, páginas e coleções do CMS.",
        url: "https://mcp.webflow.com/mcp",
        icon: "webflow",
        auth: "oauth",
      },
      {
        id: "box",
        name: "Box",
        description: "Arquivos e pastas na nuvem.",
        url: "https://mcp.box.com",
        icon: "box",
        auth: "oauth",
      },
      {
        id: "paypal",
        name: "PayPal",
        description: "Faturas, pedidos e transações.",
        url: "https://mcp.paypal.com/mcp",
        icon: "paypal",
        auth: "oauth",
      },
    ],
  },
];

const CATALOG_ITEMS = CATALOG.flatMap((section) => section.items);

const GOOGLE_CATALOG_URLS: Partial<Record<GoogleService, string>> = Object.fromEntries(
  CATALOG_ITEMS.flatMap((item) => (item.googleService ? [[item.googleService, item.url]] : [])),
);

export const googleSourceUrl = (services: GoogleService[]) => {
  const [only, ...rest] = services;
  return (only && rest.length === 0 && GOOGLE_CATALOG_URLS[only]) || GOOGLE_SOURCE_URL;
};

const MULTI_SERVICE_GOOGLE: Pick<CatalogEntry, "url" | "icon" | "auth" | "tokenUrl"> = {
  url: GOOGLE_SOURCE_URL,
  icon: "google",
  auth: "oauth",
};

export const CATALOG_BY_URL_HASH = JSON.stringify(
  Object.fromEntries(
    [MULTI_SERVICE_GOOGLE, ...CATALOG_ITEMS].map((item) => [
      hashUrl(item.url),
      { icon: item.icon, auth: item.auth, tokenUrl: item.tokenUrl ?? null },
    ]),
  ),
);
