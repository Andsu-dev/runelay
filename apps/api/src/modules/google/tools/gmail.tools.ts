import { z } from "zod";
import { GOOGLE_API } from "@/modules/google/constants/google.constants";
import { defineGoogleTool } from "@/modules/google/utils/google-tool";

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

export const gmailTools = [
  defineGoogleTool({
    name: "send_email",
    description: "Send a plain-text email from the connected Gmail account. Scope: gmail.send.",
    input: z.object({ to: recipients, subject: z.string(), body: z.string(), cc: recipients.optional() }),
    run: (api, message) => api({ url: GOOGLE_API.gmailSend, method: "POST", json: { raw: buildRawMessage(message) } }),
  }),
];
