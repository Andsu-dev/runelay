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

interface UpdatedValues {
  updatedRange?: string;
  updatedRows?: number;
  updatedCells?: number;
}

const rangeInput = {
  spreadsheetId: z.string().min(1),
  range: z.string().min(1),
};

const valuesUrl = (spreadsheetId: string, range: string) =>
  `${GOOGLE_API.sheets}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`;

const updatedView = (updated: UpdatedValues) => ({
  updatedRange: updated.updatedRange ?? null,
  updatedRows: updated.updatedRows ?? 0,
  updatedCells: updated.updatedCells ?? 0,
});

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
  defineGoogleTool({
    name: "get_values",
    description: "Read the values of a range in A1 notation, such as Sheet1!A1:C10. Scope: spreadsheets.",
    input: z.object(rangeInput),
    run: async (api, { spreadsheetId, range }) => {
      const read = await api<{ range?: string; values?: unknown[][] }>({ url: valuesUrl(spreadsheetId, range) });
      if (read.error) return read;
      return ok({ range: read.data.range ?? range, values: read.data.values ?? [] });
    },
  }),
  defineGoogleTool({
    name: "update_values",
    description:
      "Overwrite a range in A1 notation with rows of values, parsed as if typed by the user. Scope: spreadsheets.",
    input: z.object({ ...rangeInput, rows: z.array(z.array(cell)).min(1) }),
    run: async (api, { spreadsheetId, range, rows }) => {
      const updated = await api<UpdatedValues>({
        url: valuesUrl(spreadsheetId, range),
        method: "PUT",
        query: { valueInputOption: "USER_ENTERED" },
        json: { values: rows },
      });
      if (updated.error) return updated;
      return ok(updatedView(updated.data));
    },
  }),
  defineGoogleTool({
    name: "append_rows",
    description:
      "Append rows after the last row of the table found in a range in A1 notation, such as Sheet1!A1. Scope: spreadsheets.",
    input: z.object({ ...rangeInput, rows: z.array(z.array(cell)).min(1) }),
    run: async (api, { spreadsheetId, range, rows }) => {
      const appended = await api<{ updates?: UpdatedValues }>({
        url: `${valuesUrl(spreadsheetId, range)}:append`,
        method: "POST",
        query: { valueInputOption: "USER_ENTERED", insertDataOption: "INSERT_ROWS" },
        json: { values: rows },
      });
      if (appended.error) return appended;
      return ok(updatedView(appended.data.updates ?? {}));
    },
  }),
];
