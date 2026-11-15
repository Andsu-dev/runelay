import { ok } from "@runelay/shared";
import { z } from "zod";
import { GOOGLE_API } from "@/modules/google/constants/google.constants";
import { defineGoogleTool } from "@/modules/google/utils/google-tool";

interface FormView {
  formId: string;
  responderUri?: string;
  items?: unknown[];
}

const questionTypes = z.enum(["text", "paragraph", "choice", "scale"]);

const questionOf = (type: z.infer<typeof questionTypes>, options: string[]) => {
  if (type === "choice") return { choiceQuestion: { type: "RADIO", options: options.map((value) => ({ value })) } };
  if (type === "scale") return { scaleQuestion: { low: 1, high: 5 } };
  return { textQuestion: { paragraph: type === "paragraph" } };
};

const editUrl = (formId: string) => `https://docs.google.com/forms/d/${formId}/edit`;

export const formsTools = [
  defineGoogleTool({
    name: "create_form",
    description:
      "Create a Google Form (published, accepting responses) and return its id and responder URL. Scope: forms.body.",
    input: z.object({ title: z.string().min(1), description: z.string().optional() }),
    run: async (api, { title, description }) => {
      const created = await api<FormView>({ url: GOOGLE_API.forms, method: "POST", json: { info: { title } } });
      if (created.error) return created;
      const { formId, responderUri } = created.data;
      if (description) {
        const updated = await api({
          url: `${GOOGLE_API.forms}/${formId}:batchUpdate`,
          method: "POST",
          json: { requests: [{ updateFormInfo: { info: { description }, updateMask: "description" } }] },
        });
        if (updated.error) return updated;
      }
      return ok({ formId, responderUri: responderUri ?? null, editUrl: editUrl(formId) });
    },
  }),
  defineGoogleTool({
    name: "add_question",
    description:
      "Append a question to a Google Form: text, paragraph, choice (single answer, needs options) or scale (1 to 5). Scope: forms.body.",
    input: z
      .object({
        formId: z.string().min(1),
        title: z.string().min(1),
        type: questionTypes,
        options: z.array(z.string().min(1)).optional(),
        required: z.boolean().default(false),
      })
      .refine((input) => input.type !== "choice" || (input.options?.length ?? 0) > 0, {
        message: "Perguntas de escolha precisam de options.",
        path: ["options"],
      }),
    run: async (api, { formId, title, type, options, required }) => {
      const form = await api<FormView>({ url: `${GOOGLE_API.forms}/${formId}` });
      if (form.error) return form;
      const added = await api<{ replies?: { createItem?: { itemId?: string } }[] }>({
        url: `${GOOGLE_API.forms}/${formId}:batchUpdate`,
        method: "POST",
        json: {
          requests: [
            {
              createItem: {
                item: { title, questionItem: { question: { required, ...questionOf(type, options ?? []) } } },
                location: { index: form.data.items?.length ?? 0 },
              },
            },
          ],
        },
      });
      if (added.error) return added;
      return ok({
        formId,
        itemId: added.data.replies?.[0]?.createItem?.itemId ?? null,
        responderUri: form.data.responderUri ?? null,
        editUrl: editUrl(formId),
      });
    },
  }),
];
