import { ok } from "@runelay/shared";
import { z } from "zod";
import { GOOGLE_API } from "@/modules/google/constants/google.constants";
import { defineGoogleTool } from "@/modules/google/utils/google-tool";

export const accountTools = [
  defineGoogleTool({
    name: "account_whoami",
    description:
      "Show the Google account behind this connection (email and name). Scopes: openid, userinfo.email, userinfo.profile.",
    input: z.object({}),
    run: async (api) => {
      const profile = await api<{ email?: string; name?: string; picture?: string }>({ url: GOOGLE_API.userinfo });
      if (profile.error) return profile;
      return ok({
        email: profile.data.email ?? null,
        name: profile.data.name ?? null,
        picture: profile.data.picture ?? null,
      });
    },
  }),
];
