import {
  Activity01Icon,
  Brain02Icon,
  Building03Icon,
  CheckmarkCircle02Icon,
  ComputerTerminal01Icon,
  DashboardSquare01Icon,
  Folder01Icon,
  Home01Icon,
  InformationCircleIcon,
  Key01Icon,
  Link01Icon,
  MagicWand01Icon,
  Message01Icon,
  PinIcon,
  PlugSocketIcon,
  ServerStack01Icon,
  Settings01Icon,
  SlidersHorizontalIcon,
  Store01Icon,
  UserGroupIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { linkOptions } from "@tanstack/react-router";
import type { NavCategory } from "./nav.types";

export const NAV_SEARCH_DEFAULTS: Record<string, string> = { tab: "catalog", filter: "all" };

export const HOME_CATEGORY = {
  id: "home",
  label: "layout.nav.home",
  icon: Home01Icon,
  link: linkOptions({ to: "/overview" }),
  paths: ["/overview", "/activity"],
  sections: [
    {
      label: "layout.nav.home",
      items: [
        { label: "layout.nav.overview", icon: DashboardSquare01Icon, link: linkOptions({ to: "/overview" }) },
        { label: "layout.nav.activity", icon: Activity01Icon, link: linkOptions({ to: "/activity" }) },
      ],
    },
  ],
} satisfies NavCategory;

export const NAV_CATEGORIES: NavCategory[] = [
  HOME_CATEGORY,
  {
    id: "connections",
    label: "layout.nav.connections",
    icon: PlugSocketIcon,
    link: linkOptions({ to: "/connectors" }),
    paths: ["/connectors"],
    showInstalled: true,
    sections: [
      {
        label: "layout.nav.connectors",
        items: [
          {
            label: "layout.nav.catalog",
            icon: Store01Icon,
            link: linkOptions({ to: "/connectors", search: { tab: "catalog" } }),
          },
          {
            label: "layout.nav.installed",
            icon: CheckmarkCircle02Icon,
            link: linkOptions({ to: "/connectors", search: { tab: "installed" } }),
          },
        ],
      },
    ],
  },
  {
    id: "context",
    label: "layout.nav.context",
    icon: Brain02Icon,
    link: linkOptions({ to: "/memory" }),
    paths: ["/memory", "/skills"],
    sections: [
      {
        label: "layout.nav.memory",
        items: [
          {
            label: "layout.nav.allMemories",
            icon: Brain02Icon,
            link: linkOptions({ to: "/memory", search: { filter: "all" } }),
          },
          {
            label: "layout.nav.pinned",
            icon: PinIcon,
            link: linkOptions({ to: "/memory", search: { filter: "pinned" } }),
          },
        ],
      },
      {
        label: "layout.nav.types",
        items: [
          {
            label: "layout.nav.user",
            icon: UserIcon,
            link: linkOptions({ to: "/memory", search: { filter: "user" } }),
          },
          {
            label: "layout.nav.feedback",
            icon: Message01Icon,
            link: linkOptions({ to: "/memory", search: { filter: "feedback" } }),
          },
          {
            label: "layout.nav.project",
            icon: Folder01Icon,
            link: linkOptions({ to: "/memory", search: { filter: "project" } }),
          },
          {
            label: "layout.nav.reference",
            icon: Link01Icon,
            link: linkOptions({ to: "/memory", search: { filter: "reference" } }),
          },
        ],
      },
      {
        label: "layout.nav.skills",
        items: [{ label: "layout.nav.allSkills", icon: MagicWand01Icon, link: linkOptions({ to: "/skills" }) }],
      },
    ],
  },
  {
    id: "access",
    label: "layout.nav.access",
    icon: Key01Icon,
    link: linkOptions({ to: "/api-keys" }),
    paths: ["/api-keys", "/setup"],
    sections: [
      {
        label: "layout.nav.agents",
        items: [
          { label: "layout.nav.apiKeys", icon: Key01Icon, link: linkOptions({ to: "/api-keys" }) },
          { label: "layout.nav.setupAgents", icon: ComputerTerminal01Icon, link: linkOptions({ to: "/setup" }) },
        ],
      },
      {
        label: "layout.nav.organization",
        items: [{ label: "layout.nav.members", icon: UserGroupIcon, soon: true }],
      },
    ],
  },
];

export const SETTINGS_CATEGORY = {
  id: "settings",
  label: "layout.nav.settings",
  icon: Settings01Icon,
  link: linkOptions({ to: "/settings/server" }),
  paths: ["/settings"],
  sections: [
    {
      label: "layout.nav.settings",
      items: [
        { label: "layout.nav.server", icon: ServerStack01Icon, link: linkOptions({ to: "/settings/server" }) },
        { label: "layout.nav.profile", icon: UserIcon, link: linkOptions({ to: "/settings/profile" }) },
        {
          label: "layout.nav.organization",
          icon: Building03Icon,
          link: linkOptions({ to: "/settings/organization" }),
        },
        {
          label: "layout.nav.preferences",
          icon: SlidersHorizontalIcon,
          link: linkOptions({ to: "/settings/preferences" }),
        },
        { label: "layout.nav.about", icon: InformationCircleIcon, link: linkOptions({ to: "/settings/about" }) },
      ],
    },
  ],
} satisfies NavCategory;
