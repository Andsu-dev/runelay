import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Tool } from "@/modules/connectors/types/connector.types";
import { connectGoogle } from "@/modules/google/clients/google.client";
import { GOOGLE_SERVICES } from "@/modules/google/constants/google.constants";
import { buildRawMessage } from "@/modules/google/tools/gmail.tools";
import { scopesFor } from "@/modules/google/utils/google-scopes";
import { updateOAuth, upsertSource } from "@/modules/sources/repositories/source.repository";
import { type FakeGoogle, startFakeGoogle } from "../../../../../test/google-helpers";
import { signUp } from "../../../../../test/helpers";

let google: FakeGoogle;
let restore: () => void;
let tools: Map<string, Tool>;
let close: () => Promise<void>;

beforeAll(async () => {
  google = startFakeGoogle();
  restore = google.install();
  const account = await signUp("Google Tools");
  const key = { organizationId: account.organizationId, name: "google" };
  upsertSource(account.organizationId, { name: "google", config: { kind: "google", services: GOOGLE_SERVICES } });
  updateOAuth(key, {
    tokens: { access_token: "tool-token", token_type: "Bearer" },
    google: { scopes: scopesFor(GOOGLE_SERVICES) },
  });
  const connection = await connectGoogle(key, { kind: "google", services: GOOGLE_SERVICES });
  if (connection.error) throw new Error(connection.error.message);
  tools = new Map(connection.data.tools.map((tool) => [tool.name, tool]));
  close = connection.data.close;
});

afterAll(async () => {
  await close();
  restore();
  google.stop();
});

const run = (name: string, args: Record<string, unknown> = {}) => {
  const tool = tools.get(name);
  if (!tool) throw new Error(`missing ${name}`);
  return tool.call(args);
};

const json = (body: string) => JSON.parse(body) as Record<string, unknown>;

test("every REST tool has a described input schema", () => {
  for (const tool of [...tools.values()].filter((candidate) => !candidate.description.startsWith("List from"))) {
    expect(tool.source).toBe("google");
    expect(tool.description).toMatch(/Scopes?: /);
    expect(tool.inputSchema).toMatchObject({ type: "object" });
    expect(tool.inputSchema.$schema).toBeUndefined();
  }
});

test("account_whoami reads the userinfo endpoint", async () => {
  google.routes.set("GET openidconnect.googleapis.com/v1/userinfo", () => ({ body: { email: "ana@example.com" } }));
  expect((await run("account_whoami")).data).toEqual({ email: "ana@example.com", name: null, picture: null });
  expect(google.last().authorization).toBe("Bearer tool-token");
  google.routes.set("GET openidconnect.googleapis.com/v1/userinfo", () => ({ status: 401, body: {} }));
  expect((await run("account_whoami")).error?.code).toBe("TOOL_FAILED");
});

test("docs_create_document creates a document", async () => {
  google.routes.set("POST docs.googleapis.com/v1/documents", () => ({ body: { documentId: "doc1", title: "Ata" } }));
  const result = await run("docs_create_document", { title: "Ata" });
  expect(result.data).toEqual({
    documentId: "doc1",
    title: "Ata",
    url: "https://docs.google.com/document/d/doc1/edit",
  });
  expect(google.last()).toMatchObject({ method: "POST", contentType: "application/json" });
  expect(json(google.last().body)).toEqual({ title: "Ata" });
  google.routes.set("POST docs.googleapis.com/v1/documents", () => ({
    status: 403,
    body: { error: { message: "denied" } },
  }));
  expect((await run("docs_create_document", { title: "Ata" })).error?.message).toBe("Google: denied");
});

test("sheets_create_spreadsheet creates and fills the first sheet", async () => {
  google.routes.set("POST sheets.googleapis.com/v4/spreadsheets", () => ({
    body: { spreadsheetId: "s1", spreadsheetUrl: "https://sheet/s1", sheets: [{ properties: { title: "Página 1" } }] },
  }));
  const empty = await run("sheets_create_spreadsheet", { title: "Vendas" });
  expect(empty.data).toEqual({ spreadsheetId: "s1", url: "https://sheet/s1", updatedRows: 0 });
  expect(json(google.last().body)).toEqual({ properties: { title: "Vendas" } });

  const filled = await run("sheets_create_spreadsheet", {
    title: "Vendas",
    header: ["Nome", "Total"],
    rows: [["Ana", 3]],
  });
  expect(filled.data).toEqual({ spreadsheetId: "s1", url: "https://sheet/s1", updatedRows: 2 });
  const append = google.last();
  expect(append.method).toBe("POST");
  expect(decodeURIComponent(append.path)).toBe("/v4/spreadsheets/s1/values/'Página 1'!A1:append");
  expect(append.query.get("valueInputOption")).toBe("USER_ENTERED");
  expect(json(append.body)).toEqual({
    values: [
      ["Nome", "Total"],
      ["Ana", 3],
    ],
  });

  google.routes.set("POST sheets.googleapis.com/v4/spreadsheets", () => ({
    body: { spreadsheetId: "s2", spreadsheetUrl: "https://sheet/s2" },
  }));
  google.routes.set("POST sheets.googleapis.com/v4/spreadsheets/s2/values/'Sheet1'!A1:append", () => ({
    body: { updates: { updatedRows: 7 } },
  }));
  expect((await run("sheets_create_spreadsheet", { title: "X", rows: [["a"]] })).data).toMatchObject({
    updatedRows: 7,
  });
  google.routes.set("POST sheets.googleapis.com/v4/spreadsheets/s2/values/'Sheet1'!A1:append", () => ({ status: 400 }));
  expect((await run("sheets_create_spreadsheet", { title: "X", rows: [["a"]] })).error?.message).toBe(
    "Google: HTTP 400",
  );
  google.routes.set("POST sheets.googleapis.com/v4/spreadsheets", () => ({ status: 500, text: "boom" }));
  expect((await run("sheets_create_spreadsheet", { title: "X" })).error?.message).toBe("Google: boom");
});

test("slides_create_presentation creates slides with title and body and drops the blank one", async () => {
  google.routes.set("POST slides.googleapis.com/v1/presentations", () => ({
    body: { presentationId: "p1", slides: [{ objectId: "blank" }] },
  }));
  const bare = await run("slides_create_presentation", { title: "Deck" });
  expect(bare.data).toEqual({ presentationId: "p1", url: "https://docs.google.com/presentation/d/p1/edit", slides: 1 });

  const result = await run("slides_create_presentation", {
    title: "Deck",
    slides: [{ title: "Capa", body: "Olá" }, { title: "Fim" }],
  });
  expect(result.data).toMatchObject({ presentationId: "p1", slides: 2 });
  const update = google.last();
  expect(update.path).toBe("/v1/presentations/p1:batchUpdate");
  const { requests } = json(update.body) as { requests: Record<string, unknown>[] };
  expect(requests.map((request) => Object.keys(request)[0])).toEqual([
    "createSlide",
    "insertText",
    "insertText",
    "createSlide",
    "insertText",
    "deleteObject",
  ]);
  expect(requests[0]).toMatchObject({
    createSlide: { objectId: "runelay_slide_0", slideLayoutReference: { predefinedLayout: "TITLE_AND_BODY" } },
  });
  expect(requests[2]).toEqual({ insertText: { objectId: "runelay_slide_0_body", text: "Olá" } });
  expect(requests[5]).toEqual({ deleteObject: { objectId: "blank" } });

  google.routes.set("POST slides.googleapis.com/v1/presentations", () => ({ body: { presentationId: "p2" } }));
  expect((await run("slides_create_presentation", { title: "Deck" })).data).toMatchObject({ slides: 0 });
  google.routes.set("POST slides.googleapis.com/v1/presentations/p2:batchUpdate", () => ({ status: 400 }));
  expect((await run("slides_create_presentation", { title: "D", slides: [{ title: "a" }] })).error).toBeTruthy();
  google.routes.set("POST slides.googleapis.com/v1/presentations", () => ({ status: 403 }));
  expect((await run("slides_create_presentation", { title: "D" })).error).toBeTruthy();
});

test("drive_create_file uploads a multipart body", async () => {
  await run("drive_create_file", { name: "notas.md", content: "# Oi", mimeType: "text/markdown" });
  const upload = google.last();
  expect(upload).toMatchObject({ method: "POST", host: "www.googleapis.com", path: "/upload/drive/v3/files" });
  expect(upload.query.get("uploadType")).toBe("multipart");
  const boundary = upload.contentType?.match(/^multipart\/related; boundary=(.+)$/)?.[1];
  expect(boundary).toBeTruthy();
  expect(upload.body).toBe(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{"name":"notas.md","mimeType":"text/markdown"}\r\n--${boundary}\r\nContent-Type: text/markdown\r\n\r\n# Oi\r\n--${boundary}--\r\n`,
  );
  await run("drive_create_file", { name: "a.txt", content: "x" });
  expect(google.last().body).toContain("Content-Type: text/plain");
});

test("drive_list_files lists app files", async () => {
  await run("drive_list_files", { query: "name contains 'x'" });
  const list = google.last();
  expect(list).toMatchObject({ method: "GET", path: "/drive/v3/files" });
  expect(list.query.get("pageSize")).toBe("20");
  expect(list.query.get("q")).toBe("name contains 'x'");
  expect(list.query.has("pageToken")).toBe(false);
  expect(list.query.get("fields")).toBe("nextPageToken,files(id,name,mimeType,modifiedTime,webViewLink)");
  expect(tools.get("drive_list_files")?.description).toContain("only sees files this app created");
});

test("gmail_send_email sends a base64url RFC 2822 message", async () => {
  google.routes.set("POST gmail.googleapis.com/gmail/v1/users/me/messages/send", () => ({ body: { id: "m1" } }));
  const result = await run("gmail_send_email", {
    to: ["a@example.com", "b@example.com"],
    cc: "c@example.com",
    subject: "Olá\r\nBcc: x@example.com",
    body: "Corpo ç",
  });
  expect(result.data).toEqual({ id: "m1" });
  const raw = (json(google.last().body) as { raw: string }).raw;
  expect(raw).not.toMatch(/[+/=]/);
  const message = Buffer.from(raw, "base64url").toString();
  expect(message).toStartWith("To: a@example.com, b@example.com\r\nCc: c@example.com\r\nSubject: =?UTF-8?B?");
  const subject = message.match(/Subject: =\?UTF-8\?B\?([^?]+)\?=/)?.[1] ?? "";
  expect(Buffer.from(subject, "base64").toString()).toBe("Olá Bcc: x@example.com");
  expect(message).toContain("Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n");
  expect(Buffer.from(message.split("\r\n\r\n")[1] ?? "", "base64").toString()).toBe("Corpo ç");
  expect(
    Buffer.from(buildRawMessage({ to: "a@example.com", subject: "s", body: "b" }), "base64url").toString(),
  ).not.toContain("Cc:");
  expect((await run("gmail_send_email", { to: "nope", subject: "s", body: "b" })).error?.code).toBe("INVALID_INPUT");
});

test("forms_create_form creates the form and sets the description", async () => {
  google.routes.set("POST forms.googleapis.com/v1/forms", () => ({
    body: { formId: "f1", responderUri: "https://r/f1" },
  }));
  const result = await run("forms_create_form", { title: "Pesquisa", description: "Conte pra gente" });
  expect(result.data).toEqual({
    formId: "f1",
    responderUri: "https://r/f1",
    editUrl: "https://docs.google.com/forms/d/f1/edit",
  });
  expect(json(google.requests.at(-2)?.body ?? "")).toEqual({ info: { title: "Pesquisa" } });
  expect(google.last().path).toBe("/v1/forms/f1:batchUpdate");
  expect(json(google.last().body)).toEqual({
    requests: [{ updateFormInfo: { info: { description: "Conte pra gente" }, updateMask: "description" } }],
  });
  google.routes.set("POST forms.googleapis.com/v1/forms", () => ({ body: { formId: "f2" } }));
  const count = google.requests.length;
  expect((await run("forms_create_form", { title: "Sem descrição" })).data).toMatchObject({ responderUri: null });
  expect(google.requests.length).toBe(count + 1);
  google.routes.set("POST forms.googleapis.com/v1/forms/f2:batchUpdate", () => ({ status: 400 }));
  expect((await run("forms_create_form", { title: "x", description: "y" })).error).toBeTruthy();
  google.routes.set("POST forms.googleapis.com/v1/forms", () => ({ status: 403 }));
  expect((await run("forms_create_form", { title: "x" })).error).toBeTruthy();
});

test("forms_add_question appends each question type at the end", async () => {
  google.routes.set("GET forms.googleapis.com/v1/forms/f1", () => ({
    body: { formId: "f1", responderUri: "https://r/f1", items: [{}, {}] },
  }));
  google.routes.set("POST forms.googleapis.com/v1/forms/f1:batchUpdate", () => ({
    body: { replies: [{ createItem: { itemId: "i1" } }] },
  }));
  const choice = await run("forms_add_question", {
    formId: "f1",
    title: "Cor?",
    type: "choice",
    options: ["Azul"],
    required: true,
  });
  expect(choice.data).toEqual({
    formId: "f1",
    itemId: "i1",
    responderUri: "https://r/f1",
    editUrl: "https://docs.google.com/forms/d/f1/edit",
  });
  expect(json(google.last().body)).toEqual({
    requests: [
      {
        createItem: {
          item: {
            title: "Cor?",
            questionItem: {
              question: { required: true, choiceQuestion: { type: "RADIO", options: [{ value: "Azul" }] } },
            },
          },
          location: { index: 2 },
        },
      },
    ],
  });
  const question = () =>
    (json(google.last().body) as { requests: { createItem: { item: { questionItem: { question: unknown } } } }[] })
      .requests[0]?.createItem.item.questionItem.question;
  await run("forms_add_question", { formId: "f1", title: "Nota", type: "scale" });
  expect(question()).toEqual({ required: false, scaleQuestion: { low: 1, high: 5 } });
  await run("forms_add_question", { formId: "f1", title: "Conte", type: "paragraph" });
  expect(question()).toEqual({ required: false, textQuestion: { paragraph: true } });
  await run("forms_add_question", { formId: "f1", title: "Nome", type: "text" });
  expect(question()).toEqual({ required: false, textQuestion: { paragraph: false } });
  expect((await run("forms_add_question", { formId: "f1", title: "x", type: "choice" })).error?.code).toBe(
    "INVALID_INPUT",
  );

  google.routes.set("GET forms.googleapis.com/v1/forms/f3", () => ({ body: { formId: "f3" } }));
  expect((await run("forms_add_question", { formId: "f3", title: "x", type: "text" })).data).toMatchObject({
    itemId: null,
    responderUri: null,
  });
  expect(json(google.last().body)).toMatchObject({ requests: [{ createItem: { location: { index: 0 } } }] });
  google.routes.set("POST forms.googleapis.com/v1/forms/f3:batchUpdate", () => ({ status: 400 }));
  expect((await run("forms_add_question", { formId: "f3", title: "x", type: "text" })).error).toBeTruthy();
  google.routes.set("GET forms.googleapis.com/v1/forms/f3", () => ({ status: 404 }));
  expect((await run("forms_add_question", { formId: "f3", title: "x", type: "text" })).error).toBeTruthy();
});

test("meet_create_space creates a meeting space", async () => {
  google.routes.set("POST meet.googleapis.com/v2/spaces", () => ({
    body: {
      name: "spaces/abc",
      meetingUri: "https://meet.google.com/abc-defg-hij",
      meetingCode: "abc-defg-hij",
      config: {},
    },
  }));
  expect((await run("meet_create_space")).data).toEqual({
    name: "spaces/abc",
    meetingUri: "https://meet.google.com/abc-defg-hij",
    meetingCode: "abc-defg-hij",
  });
  expect(google.last().method).toBe("POST");
  google.routes.set("POST meet.googleapis.com/v2/spaces", () => ({ status: 403 }));
  expect((await run("meet_create_space")).error).toBeTruthy();
});

test("network failures and empty bodies are reported", async () => {
  google.routes.set("GET www.googleapis.com/drive/v3/files", () => ({ text: "" }));
  expect((await run("drive_list_files")).data).toEqual({});
  google.failingHosts.add("www.googleapis.com");
  expect((await run("drive_list_files")).error?.message).toBe("Google: down");
  google.failingHosts.clear();
  const previous = google.base;
  google.base = "http://127.0.0.1:1";
  expect((await run("drive_list_files")).error?.code).toBe("TOOL_FAILED");
  google.base = previous;
});
