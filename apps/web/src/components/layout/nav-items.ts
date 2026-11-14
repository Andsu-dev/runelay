import {
  Activity01Icon,
  Brain02Icon,
  CheckmarkCircle02Icon,
  ComputerTerminal01Icon,
  DashboardSquare01Icon,
  Folder01Icon,
  Home01Icon,
  Key01Icon,
  Link01Icon,
  MagicWand01Icon,
  Message01Icon,
  PinIcon,
  PlugSocketIcon,
  Settings01Icon,
  Store01Icon,
  UserGroupIcon,
  UserIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";
import { linkOptions } from "@tanstack/react-router";
import type { NavCategory } from "./nav.types";

export const NAV_SEARCH_DEFAULTS: Record<string, string> = { tab: "catalog", filter: "all" };

export const HOME_CATEGORY = {
  id: "home",
  label: "Início",
  icon: Home01Icon,
  link: linkOptions({ to: "/overview" }),
  paths: ["/overview"],
  sections: [
    {
      label: "Início",
      items: [
        { label: "Visão geral", icon: DashboardSquare01Icon, link: linkOptions({ to: "/overview" }) },
        { label: "Atividade", icon: Activity01Icon, soon: true },
      ],
    },
  ],
} satisfies NavCategory;

export const NAV_CATEGORIES: NavCategory[] = [
  HOME_CATEGORY,
  {
    id: "connections",
    label: "Conexões",
    icon: PlugSocketIcon,
    link: linkOptions({ to: "/connectors" }),
    paths: ["/connectors"],
    showInstalled: true,
    sections: [
      {
        label: "Conectores",
        items: [
          {
            label: "Catálogo",
            icon: Store01Icon,
            link: linkOptions({ to: "/connectors", search: { tab: "catalog" } }),
          },
          {
            label: "Instalados",
            icon: CheckmarkCircle02Icon,
            link: linkOptions({ to: "/connectors", search: { tab: "installed" } }),
          },
          { label: "Tools", icon: Wrench01Icon, soon: true },
        ],
      },
    ],
  },
  {
    id: "context",
    label: "Contexto",
    icon: Brain02Icon,
    link: linkOptions({ to: "/memory" }),
    paths: ["/memory", "/skills"],
    sections: [
      {
        label: "Memória",
        items: [
          { label: "Todas", icon: Brain02Icon, link: linkOptions({ to: "/memory", search: { filter: "all" } }) },
          { label: "Fixadas", icon: PinIcon, link: linkOptions({ to: "/memory", search: { filter: "pinned" } }) },
        ],
      },
      {
        label: "Tipos",
        items: [
          { label: "Usuário", icon: UserIcon, link: linkOptions({ to: "/memory", search: { filter: "user" } }) },
          {
            label: "Feedback",
            icon: Message01Icon,
            link: linkOptions({ to: "/memory", search: { filter: "feedback" } }),
          },
          { label: "Projeto", icon: Folder01Icon, link: linkOptions({ to: "/memory", search: { filter: "project" } }) },
          {
            label: "Referência",
            icon: Link01Icon,
            link: linkOptions({ to: "/memory", search: { filter: "reference" } }),
          },
        ],
      },
      {
        label: "Habilidades",
        items: [{ label: "Todas as habilidades", icon: MagicWand01Icon, link: linkOptions({ to: "/skills" }) }],
      },
    ],
  },
  {
    id: "access",
    label: "Acesso",
    icon: Key01Icon,
    link: linkOptions({ to: "/api-keys" }),
    paths: ["/api-keys", "/setup"],
    sections: [
      {
        label: "Agentes",
        items: [
          { label: "Chaves de API", icon: Key01Icon, link: linkOptions({ to: "/api-keys" }) },
          { label: "Configurar agentes", icon: ComputerTerminal01Icon, link: linkOptions({ to: "/setup" }) },
        ],
      },
      {
        label: "Organização",
        items: [
          { label: "Membros", icon: UserGroupIcon, soon: true },
          { label: "Configurações", icon: Settings01Icon, soon: true },
        ],
      },
    ],
  },
];
