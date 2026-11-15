import { ok } from "@runelay/shared";
import { z } from "zod";
import { GOOGLE_API } from "@/modules/google/constants/google.constants";
import { defineGoogleTool } from "@/modules/google/utils/google-tool";

export const docsTools = [
  defineGoogleTool({
    name: "create_document",
    description: "Create an empty Google Doc and return its id and URL. Scope: documents.",
    input: z.object({ title: z.string().min(1) }),
    run: async (api, { title }) => {
      const created = await api<{ documentId: string; title: string }>({
        url: GOOGLE_API.docs,
        method: "POST",
        json: { title },
      });
      if (created.error) return created;
      const { documentId } = created.data;
      return ok({
        documentId,
        title: created.data.title,
        url: `https://docs.google.com/document/d/${documentId}/edit`,
      });
    },
  }),
];
