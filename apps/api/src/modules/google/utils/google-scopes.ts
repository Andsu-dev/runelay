import type { GoogleService } from "@runelay/shared";
import {
  GOOGLE_BASE_SCOPES,
  GOOGLE_SERVICE_SCOPES,
  GOOGLE_SERVICES,
} from "@/modules/google/constants/google.constants";

export const scopesFor = (services: GoogleService[]) => [
  ...new Set([...GOOGLE_BASE_SCOPES, ...services.flatMap((service) => GOOGLE_SERVICE_SCOPES[service])]),
];

export const missingScopes = (services: GoogleService[], granted: string[]) =>
  scopesFor(services).filter((scope) => !granted.includes(scope));

export const grantedServices = (granted: string[]) =>
  GOOGLE_SERVICES.filter((service) => missingScopes([service], granted).length === 0);

export const splitScopes = (scope: string | undefined) => (scope ?? "").split(/\s+/).filter(Boolean);
