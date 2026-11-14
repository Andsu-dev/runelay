import { apiKey } from "@better-auth/api-key";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { organization } from "better-auth/plugins/organization";
import { env } from "@/config/env";
import { db } from "@/db/connection";
import {
  API_KEY_PREFIX,
  AUTH_BASE_PATH,
  SETUP_TOKEN_REQUIRED_MESSAGE,
  SIGNUP_CLOSED_MESSAGE,
} from "@/modules/auth/constants/auth.constants";
import { accessControl, organizationRoles } from "@/modules/auth/lib/access-control";
import { isSetupToken, SETUP_TOKEN_HEADER } from "@/modules/auth/lib/setup-token";
import { ensurePersonalOrganization } from "@/modules/auth/repositories/membership.repository";
import { countUsers } from "@/modules/auth/repositories/user.repository";

export const auth = betterAuth({
  appName: "runelay",
  baseURL: env.PUBLIC_URL,
  basePath: AUTH_BASE_PATH,
  secret: env.RUNELAY_SECRET,
  database: db,
  trustedOrigins: [env.PUBLIC_URL],
  emailAndPassword: { enabled: true },
  socialProviders: {
    ...(env.GITHUB_CLIENT_ID &&
      env.GITHUB_CLIENT_SECRET && {
        github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET },
      }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          if (countUsers() === 0) {
            if (isSetupToken(context?.headers?.get(SETUP_TOKEN_HEADER))) return { data: user };
            throw new APIError("FORBIDDEN", { message: SETUP_TOKEN_REQUIRED_MESSAGE });
          }
          if (env.ALLOW_SIGNUP) return { data: user };
          throw new APIError("FORBIDDEN", { message: SIGNUP_CLOSED_MESSAGE });
        },
        after: async (user) => {
          const created = ensurePersonalOrganization(user.id);
          if (created.error) throw new APIError("INTERNAL_SERVER_ERROR", { message: created.error.message });
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          if ("activeOrganizationId" in session && session.activeOrganizationId) return { data: session };
          const organizationId = ensurePersonalOrganization(session.userId);
          if (organizationId.error)
            throw new APIError("INTERNAL_SERVER_ERROR", { message: organizationId.error.message });
          return { data: { ...session, activeOrganizationId: organizationId.data } };
        },
      },
    },
  },
  plugins: [
    organization({ ac: accessControl, roles: organizationRoles }),
    apiKey({
      defaultPrefix: API_KEY_PREFIX,
      references: "organization",
      maximumNameLength: 64,
      rateLimit: { enabled: false },
    }),
  ],
});
