import type { GoogleService } from "@runelay/shared";
import {
  GOOGLE_BASE_SCOPES,
  GOOGLE_IMPLIED_SCOPES,
  GOOGLE_SERVICE_SCOPES,
  GOOGLE_SERVICES,
} from "@/modules/google/constants/google.constants";

export const scopesFor = (services: GoogleService[], extra: string[] = []) => [
  ...new Set([...GOOGLE_BASE_SCOPES, ...services.flatMap((service) => GOOGLE_SERVICE_SCOPES[service]), ...extra]),
];

const withImplied = (granted: string[]) =>
  new Set([...granted, ...granted.flatMap((scope) => GOOGLE_IMPLIED_SCOPES[scope] ?? [])]);

export const missingScopes = (services: GoogleService[], granted: string[], extra: string[] = []) => {
  const covered = withImplied(granted);
  return scopesFor(services, extra).filter((scope) => !covered.has(scope));
};

export const grantedServices = (granted: string[]) =>
  GOOGLE_SERVICES.filter((service) => missingScopes([service], granted).length === 0);

export const splitScopes = (scope: string | undefined) => (scope ?? "").split(/\s+/).filter(Boolean);
