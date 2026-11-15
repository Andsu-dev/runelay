import { ok } from "@runelay/shared";
import { z } from "zod";
import { GOOGLE_API } from "@/modules/google/constants/google.constants";
import { defineGoogleTool } from "@/modules/google/utils/google-tool";

export const meetTools = [
  defineGoogleTool({
    name: "create_space",
    description: "Create a Google Meet meeting space and return its link and code. Scope: meetings.space.created.",
    input: z.object({}),
    run: async (api) => {
      const space = await api<{ name: string; meetingUri: string; meetingCode: string }>({
        url: GOOGLE_API.meetSpaces,
        method: "POST",
        json: {},
      });
      if (space.error) return space;
      return ok({ name: space.data.name, meetingUri: space.data.meetingUri, meetingCode: space.data.meetingCode });
    },
  }),
];
