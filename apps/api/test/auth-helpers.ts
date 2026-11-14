import { SETUP_TOKEN_HEADER } from "@runelay/shared";
import { db } from "@/db/connection";
import { call } from "./helpers";

export const PASSWORD = "senha-forte-123";

export const signUpRequest = (email: string, headers: Record<string, string> = {}) =>
  call("/v1/auth/sign-up/email", { method: "POST", headers, json: { email, password: PASSWORD, name: "Tester" } });

export const signUpWithToken = (email: string, token: string) => signUpRequest(email, { [SETUP_TOKEN_HEADER]: token });

export const signIn = (email: string) => call("/v1/auth/sign-in/email", { method: "POST", json: { email, password: PASSWORD } });

export const uniqueEmail = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}@runelay.test`;

export const setActiveOrganization = (userId: string, organizationId: string | null) =>
  db.query("UPDATE session SET activeOrganizationId = ? WHERE userId = ?").run(organizationId, userId);
