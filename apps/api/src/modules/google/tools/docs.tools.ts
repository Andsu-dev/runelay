import { ok } from "@runelay/shared";
import { z } from "zod";
import { GOOGLE_API } from "@/modules/google/constants/google.constants";
import { defineGoogleTool } from "@/modules/google/utils/google-tool";

interface DocsParagraph {
  elements?: { textRun?: { content?: string } }[];
}

interface DocsDocument {
  documentId: string;
  title?: string;
  body?: { content?: { paragraph?: DocsParagraph }[] };
}

const documentUrl = (documentId: string) => `https://docs.google.com/document/d/${documentId}/edit`;

const plainText = (document: DocsDocument) =>
  (document.body?.content ?? [])
    .flatMap((block) => block.paragraph?.elements ?? [])
    .map((element) => element.textRun?.content ?? "")
    .join("");

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
        url: documentUrl(documentId),
      });
    },
  }),
  defineGoogleTool({
    name: "read_document",
    description: "Read a Google Doc and return its title and plain text. Scope: documents.",
    input: z.object({ documentId: z.string().min(1) }),
    run: async (api, { documentId }) => {
      const document = await api<DocsDocument>({ url: `${GOOGLE_API.docs}/${encodeURIComponent(documentId)}` });
      if (document.error) return document;
      return ok({
        documentId,
        title: document.data.title ?? null,
        url: documentUrl(documentId),
        text: plainText(document.data),
      });
    },
  }),
  defineGoogleTool({
    name: "append_text",
    description: "Append text to the end of a Google Doc body. Scope: documents.",
    input: z.object({ documentId: z.string().min(1), text: z.string().min(1) }),
    run: async (api, { documentId, text }) => {
      const updated = await api({
        url: `${GOOGLE_API.docs}/${encodeURIComponent(documentId)}:batchUpdate`,
        method: "POST",
        json: { requests: [{ insertText: { text, endOfSegmentLocation: {} } }] },
      });
      if (updated.error) return updated;
      return ok({ documentId, url: documentUrl(documentId) });
    },
  }),
];
