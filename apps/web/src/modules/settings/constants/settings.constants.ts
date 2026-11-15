import { ComputerIcon, Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import type { MessageKey } from "@/lib/i18n";
import type { Theme } from "@/lib/theme";

export const AVATAR_SIZE = 256;

export const AVATAR_QUALITY = 0.85;

export const AVATAR_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const AVATAR_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const THEME_OPTIONS = [
  { value: "system", label: "settings.preferences.themes.system", icon: ComputerIcon },
  { value: "light", label: "settings.preferences.themes.light", icon: Sun03Icon },
  { value: "dark", label: "settings.preferences.themes.dark", icon: Moon02Icon },
] as const satisfies readonly { value: Theme; label: MessageKey; icon: IconSvgElement }[];

export const LOCAL_HOSTNAMES = ["localhost", "127.0.0.1", "[::1]"];

export const TAILNET_IP = /^100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/;

export const TAILNET_DOMAIN_SUFFIX = ".ts.net";

export const MCP_PATH = "/v1/mcp";

export const REPOSITORY_URL = "https://github.com/Andsu-dev/runelay";

export const SERVER_NAME_MAX_LENGTH = 60;
