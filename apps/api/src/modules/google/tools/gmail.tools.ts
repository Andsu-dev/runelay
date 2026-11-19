import { fail, ok, type Result } from "@runelay/shared";
import { z } from "zod";
import { GMAIL_BODY_LIMIT, GMAIL_METADATA_CONCURRENCY, GOOGLE_API } from "@/modules/google/constants/google.constants";
import type { GoogleApi, GoogleRequest } from "@/modules/google/types/google.types";
import { defineGoogleTool } from "@/modules/google/utils/google-tool";

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailPart {
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: { data?: string; size?: number; attachmentId?: string };
  parts?: GmailPart[];
}

interface GmailMessage {
  id: string;
  threadId?: string;
  labelIds?: string[];
  snippet?: string;
  payload?: GmailPart;
}

interface GmailThread {
  id: string;
  snippet?: string;
  messages?: GmailMessage[];
}

const READ_SCOPE = "Scope: gmail.readonly (connect with your own OAuth client).";

const INSUFFICIENT_SCOPE = /insufficient authentication scopes|ACCESS_TOKEN_SCOPE_INSUFFICIENT/i;

const SUMMARY_HEADERS = ["Subject", "From", "Date"];

const ENTITIES: Record<string, string> = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

const recipients = z.union([z.email(), z.array(z.email()).min(1)]);

const headerValue = (value: string | string[]) =>
  [value]
    .flat()
    .join(", ")
    .replace(/[\r\n]+/g, " ");

const encodeSubject = (subject: string) =>
  `=?UTF-8?B?${Buffer.from(subject.replace(/[\r\n]+/g, " ")).toString("base64")}?=`;

export const buildRawMessage = (message: {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  body: string;
}) =>
  Buffer.from(
    [
      `To: ${headerValue(message.to)}`,
      ...(message.cc ? [`Cc: ${headerValue(message.cc)}`] : []),
      `Subject: ${encodeSubject(message.subject)}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      Buffer.from(message.body).toString("base64"),
    ].join("\r\n"),
  ).toString("base64url");

const headerOf = (part: GmailPart | undefined, name: string) =>
  part?.headers?.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value ?? null;

const partsOf = (part: GmailPart): GmailPart[] => [part, ...(part.parts ?? []).flatMap(partsOf)];

const decodePart = (part: GmailPart) => {
  const bytes = Buffer.from(part.body?.data ?? "", "base64url");
  const charset = headerOf(part, "Content-Type")?.match(/charset="?([^";\s]+)/i)?.[1] ?? "utf-8";
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder().decode(bytes);
  }
};

const htmlToText = (html: string) =>
  html
    .replace(/<(style|script|head)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>|<\/(p|div|tr|li|h[1-6]|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
      if (code[0] !== "#") return ENTITIES[code.toLowerCase()] ?? entity;
      const point = code[1]?.toLowerCase() === "x" ? Number.parseInt(code.slice(2), 16) : Number(code.slice(1));
      return point >= 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
    })
    .replace(/[ \t ]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const messageBody = (payload: GmailPart | undefined, limit = GMAIL_BODY_LIMIT) => {
  const parts = payload ? partsOf(payload).filter((part) => !part.filename && part.body?.data) : [];
  const ofType = (mimeType: string) => parts.filter((part) => part.mimeType?.toLowerCase() === mimeType);
  const plain = ofType("text/plain");
  const text = plain.length
    ? plain.map(decodePart).join("\n\n").trim()
    : ofType("text/html")
        .map((part) => htmlToText(decodePart(part)))
        .join("\n\n");
  return { body: text.slice(0, limit), truncated: text.length > limit };
};

export const readMessage = ({ id, threadId, labelIds, snippet, payload }: GmailMessage) => ({
  id,
  threadId: threadId ?? null,
  from: headerOf(payload, "From"),
  to: headerOf(payload, "To"),
  cc: headerOf(payload, "Cc"),
  date: headerOf(payload, "Date"),
  subject: headerOf(payload, "Subject"),
  labelIds: labelIds ?? [],
  snippet: snippet ?? null,
  ...messageBody(payload),
});

const gmailRead = async <T>(api: GoogleApi, request: GoogleRequest): Promise<Result<T>> => {
  const result = await api<T>(request);
  if (!result.error || !INSUFFICIENT_SCOPE.test(result.error.message)) return result;
  return fail(
    "TOOL_FAILED",
    `${result.error.message} Reading Gmail needs the gmail.readonly scope: reconnect Gmail with your own OAuth client and grant it.`,
    result.error.details,
  );
};

const threadUrl = (threadId: string) => `${GOOGLE_API.gmail}/threads/${encodeURIComponent(threadId)}`;

const summaryUrl = (threadId: string) =>
  `${threadUrl(threadId)}?${SUMMARY_HEADERS.map((header) => `metadataHeaders=${header}`).join("&")}`;

const threadSummary = async (api: GoogleApi, { id, snippet }: GmailThread) => {
  const thread = await gmailRead<GmailThread>(api, {
    url: summaryUrl(id),
    query: { format: "metadata", fields: "messages(id,labelIds,snippet,payload/headers)" },
  });
  const messages = thread.data?.messages ?? [];
  const latest = messages.at(-1);
  return {
    id,
    messageCount: messages.length || null,
    subject: headerOf(latest?.payload, "Subject"),
    from: headerOf(latest?.payload, "From"),
    date: headerOf(latest?.payload, "Date"),
    snippet: latest?.snippet ?? snippet ?? null,
    labelIds: latest?.labelIds ?? [],
  };
};

const summarize = async (api: GoogleApi, threads: GmailThread[]) => {
  const summaries: Awaited<ReturnType<typeof threadSummary>>[] = [];
  for (let start = 0; start < threads.length; start += GMAIL_METADATA_CONCURRENCY) {
    const batch = threads.slice(start, start + GMAIL_METADATA_CONCURRENCY);
    summaries.push(...(await Promise.all(batch.map((thread) => threadSummary(api, thread)))));
  }
  return summaries;
};

export const gmailTools = [
  defineGoogleTool({
    name: "send_email",
    description: "Send a plain-text email from the connected Gmail account. Scope: gmail.send.",
    input: z.object({ to: recipients, subject: z.string(), body: z.string(), cc: recipients.optional() }),
    run: (api, message) => api({ url: GOOGLE_API.gmailSend, method: "POST", json: { raw: buildRawMessage(message) } }),
  }),
  defineGoogleTool({
    name: "search_threads",
    description: `Search Gmail threads with Gmail search syntax in q (e.g. "from:ana is:unread newer_than:7d"). Returns each thread's id with the subject, sender, date and snippet of its latest message, plus nextPageToken. ${READ_SCOPE}`,
    input: z.object({
      q: z.string().min(1).optional(),
      maxResults: z.number().int().min(1).max(50).default(20),
      pageToken: z.string().optional(),
      includeSpamTrash: z.boolean().default(false),
    }),
    run: async (api, { q, maxResults, pageToken, includeSpamTrash }) => {
      const listed = await gmailRead<{ threads?: GmailThread[]; nextPageToken?: string }>(api, {
        url: `${GOOGLE_API.gmail}/threads`,
        query: { q, maxResults, pageToken, includeSpamTrash },
      });
      if (listed.error) return listed;
      return ok({
        threads: await summarize(api, listed.data.threads ?? []),
        nextPageToken: listed.data.nextPageToken ?? null,
      });
    },
  }),
  defineGoogleTool({
    name: "get_thread",
    description: `Read a Gmail thread: every message with from, to, cc, date, subject, labels, snippet and its plain-text body (HTML-only mail is converted to text, bodies over ${GMAIL_BODY_LIMIT} characters are truncated). ${READ_SCOPE}`,
    input: z.object({ threadId: z.string().min(1) }),
    run: async (api, { threadId }) => {
      const thread = await gmailRead<GmailThread>(api, { url: threadUrl(threadId), query: { format: "full" } });
      if (thread.error) return thread;
      return ok({ id: thread.data.id, messages: (thread.data.messages ?? []).map(readMessage) });
    },
  }),
  defineGoogleTool({
    name: "get_message",
    description: `Read one Gmail message with from, to, cc, date, subject, labels, snippet and its plain-text body (truncated over ${GMAIL_BODY_LIMIT} characters). ${READ_SCOPE}`,
    input: z.object({ messageId: z.string().min(1) }),
    run: async (api, { messageId }) => {
      const message = await gmailRead<GmailMessage>(api, {
        url: `${GOOGLE_API.gmail}/messages/${encodeURIComponent(messageId)}`,
        query: { format: "full" },
      });
      if (message.error) return message;
      return ok(readMessage(message.data));
    },
  }),
  defineGoogleTool({
    name: "list_labels",
    description: `List the Gmail labels (system and user) with their ids, to use in search_threads queries. ${READ_SCOPE}`,
    input: z.object({}),
    run: async (api) => {
      const listed = await gmailRead<{ labels?: { id: string; name?: string; type?: string }[] }>(api, {
        url: `${GOOGLE_API.gmail}/labels`,
      });
      if (listed.error) return listed;
      return ok({
        labels: (listed.data.labels ?? []).map(({ id, name, type }) => ({
          id,
          name: name ?? null,
          type: type ?? null,
        })),
      });
    },
  }),
];
