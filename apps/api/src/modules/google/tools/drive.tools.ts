import { z } from "zod";
import { GOOGLE_API } from "@/modules/google/constants/google.constants";
import { defineGoogleTool } from "@/modules/google/utils/google-tool";

const FILE_FIELDS = "id,name,mimeType,modifiedTime,webViewLink";

const multipartBody = (boundary: string, metadata: unknown, mimeType: string, content: string) =>
  [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${mimeType}`,
    "",
    content,
    `--${boundary}--`,
    "",
  ].join("\r\n");

export const driveTools = [
  defineGoogleTool({
    name: "create_file",
    description: "Upload a text file to Google Drive and return its id and link. Scope: drive.file.",
    input: z.object({
      name: z.string().min(1),
      content: z.string(),
      mimeType: z.string().min(1).default("text/plain"),
    }),
    run: (api, { name, content, mimeType }) => {
      const boundary = `runelay_${crypto.randomUUID()}`;
      return api({
        url: GOOGLE_API.driveUpload,
        method: "POST",
        query: { uploadType: "multipart", fields: FILE_FIELDS },
        contentType: `multipart/related; boundary=${boundary}`,
        body: multipartBody(boundary, { name, mimeType }, mimeType, content),
      });
    },
  }),
  defineGoogleTool({
    name: "list_files",
    description:
      "List Google Drive files. With the drive.file scope it only sees files this app created or the user opened with it. Scope: drive.file.",
    input: z.object({
      pageSize: z.number().int().min(1).max(100).default(20),
      query: z.string().optional(),
      pageToken: z.string().optional(),
    }),
    run: (api, { pageSize, query, pageToken }) =>
      api({
        url: GOOGLE_API.driveFiles,
        query: { pageSize, q: query, pageToken, fields: `nextPageToken,files(${FILE_FIELDS})` },
      }),
  }),
];
