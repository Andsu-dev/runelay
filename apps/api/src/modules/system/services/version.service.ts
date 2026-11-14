import { fail, type OrganizationRole, ok, type Result, type VersionView } from "@runelay/shared";
import { env } from "@/config/env";
import { GATEWAY_INFO } from "@/modules/gateway/constants/gateway.constants";
import {
  LATEST_RELEASE_TIMEOUT_MS,
  LATEST_RELEASE_TTL_MS,
  LATEST_RELEASE_URL,
} from "@/modules/system/constants/system.constants";

interface LatestRelease {
  version: string;
  notes: string | null;
  url: string | null;
}

let latestCache: { release: LatestRelease | null; checkedAt: number } | null = null;

export const resetLatestCache = () => {
  latestCache = null;
};

const fetchLatestRelease = async (): Promise<LatestRelease | null> => {
  try {
    const response = await fetch(LATEST_RELEASE_URL, {
      headers: { accept: "application/vnd.github+json", "user-agent": "runelay" },
      signal: AbortSignal.timeout(LATEST_RELEASE_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const release = (await response.json()) as { tag_name?: string; body?: string | null; html_url?: string };
    if (!release.tag_name) return null;
    return {
      version: release.tag_name.replace(/^v/, ""),
      notes: release.body?.trim() || null,
      url: release.html_url ?? null,
    };
  } catch {
    return null;
  }
};

const latestRelease = async () => {
  if (latestCache && Date.now() - latestCache.checkedAt < LATEST_RELEASE_TTL_MS) return latestCache.release;
  latestCache = { release: await fetchLatestRelease(), checkedAt: Date.now() };
  return latestCache.release;
};

export const isNewerVersion = (candidate: string, current: string) => {
  const a = candidate.split(".").map(Number);
  const b = current.split(".").map(Number);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const diff = (a[index] ?? 0) - (b[index] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
};

const updaterConfigured = () => Boolean(env.RUNELAY_UPDATER_URL && env.RUNELAY_UPDATER_TOKEN);

export const canManageUpdates = (role: OrganizationRole | null) => role === "owner" || role === "admin";

export const describeVersion = async (role: OrganizationRole | null): Promise<Result<VersionView>> => {
  const release = await latestRelease();
  return ok({
    current: GATEWAY_INFO.version,
    latest: release?.version ?? null,
    notes: release?.notes ?? null,
    releaseUrl: release?.url ?? null,
    updateAvailable: release !== null && isNewerVersion(release.version, GATEWAY_INFO.version),
    canUpdate: updaterConfigured() && canManageUpdates(role),
    desktop: env.RUNELAY_DESKTOP,
  });
};

export const startUpdate = (role: OrganizationRole | null): Result<{ started: true }> => {
  if (!canManageUpdates(role)) return fail("FORBIDDEN", "Só donos e admins podem atualizar o runelay.");
  if (!env.RUNELAY_UPDATER_URL || !env.RUNELAY_UPDATER_TOKEN) return fail("UPDATE_UNAVAILABLE");
  void fetch(`${env.RUNELAY_UPDATER_URL.replace(/\/$/, "")}/v1/update`, {
    method: "POST",
    headers: { authorization: `Bearer ${env.RUNELAY_UPDATER_TOKEN}` },
  }).catch(() => null);
  return ok({ started: true });
};
