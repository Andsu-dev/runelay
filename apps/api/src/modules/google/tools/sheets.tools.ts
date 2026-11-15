import { ok } from "@runelay/shared";
import { z } from "zod";
import { GOOGLE_API } from "@/modules/google/constants/google.constants";
import { defineGoogleTool } from "@/modules/google/utils/google-tool";

const cell = z.union([z.string(), z.number(), z.boolean()]);

interface CreatedSpreadsheet {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheets?: { properties?: { title?: string } }[];
}

export const sheetsTools = [
  defineGoogleTool({
    name: "create_spreadsheet",
    description:
      "Create a Google Sheets spreadsheet, optionally filling a header row and rows, and return its id and URL. Scope: spreadsheets.",
    input: z.object({
      title: z.string().min(1),
      header: z.array(z.string()).optional(),
      rows: z.array(z.array(cell)).optional(),
    }),
    run: async (api, { title, header, rows }) => {
      const created = await api<CreatedSpreadsheet>({
        url: GOOGLE_API.sheets,
        method: "POST",
        json: { properties: { title } },
      });
      if (created.error) return created;
      const { spreadsheetId, spreadsheetUrl } = created.data;
      const values = [...(header ? [header] : []), ...(rows ?? [])];
      if (values.length === 0) return ok({ spreadsheetId, url: spreadsheetUrl, updatedRows: 0 });
      const sheet = created.data.sheets?.[0]?.properties?.title ?? "Sheet1";
      const range = encodeURIComponent(`'${sheet.replaceAll("'", "''")}'!A1`);
      const appended = await api<{ updates?: { updatedRows?: number } }>({
        url: `${GOOGLE_API.sheets}/${spreadsheetId}/values/${range}:append`,
        method: "POST",
        query: { valueInputOption: "USER_ENTERED" },
        json: { values },
      });
      if (appended.error) return appended;
      return ok({
        spreadsheetId,
        url: spreadsheetUrl,
        updatedRows: appended.data.updates?.updatedRows ?? values.length,
      });
    },
  }),
];
