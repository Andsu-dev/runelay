import { ok } from "@runelay/shared";
import { z } from "zod";
import { GOOGLE_API } from "@/modules/google/constants/google.constants";
import { defineGoogleTool } from "@/modules/google/utils/google-tool";

interface SlidesShapeText {
  textElements?: { textRun?: { content?: string } }[];
}

interface SlidesPresentation {
  presentationId: string;
  title?: string;
  slides?: { objectId: string; pageElements?: { shape?: { text?: SlidesShapeText } }[] }[];
}

interface SlideContent {
  title: string;
  body?: string;
}

const presentationUrl = (presentationId: string) => `https://docs.google.com/presentation/d/${presentationId}/edit`;

const batchUpdateUrl = (presentationId: string) =>
  `${GOOGLE_API.slides}/${encodeURIComponent(presentationId)}:batchUpdate`;

const shapeText = (text: SlidesShapeText | undefined) =>
  (text?.textElements ?? []).map((element) => element.textRun?.content ?? "").join("");

const slideRequests = (slide: SlideContent, id: string, insertionIndex?: number) => [
  {
    createSlide: {
      objectId: id,
      ...(insertionIndex === undefined ? {} : { insertionIndex }),
      slideLayoutReference: { predefinedLayout: "TITLE_AND_BODY" },
      placeholderIdMappings: [
        { layoutPlaceholder: { type: "TITLE", index: 0 }, objectId: `${id}_title` },
        { layoutPlaceholder: { type: "BODY", index: 0 }, objectId: `${id}_body` },
      ],
    },
  },
  { insertText: { objectId: `${id}_title`, text: slide.title } },
  ...(slide.body ? [{ insertText: { objectId: `${id}_body`, text: slide.body } }] : []),
];

export const slidesTools = [
  defineGoogleTool({
    name: "create_presentation",
    description:
      "Create a Google Slides presentation with title-and-body slides and return its id and URL. Scope: presentations.",
    input: z.object({
      title: z.string().min(1),
      slides: z
        .array(z.object({ title: z.string().min(1), body: z.string().optional() }))
        .max(100)
        .default([]),
    }),
    run: async (api, { title, slides }) => {
      const created = await api<{ presentationId: string; slides?: { objectId: string }[] }>({
        url: GOOGLE_API.slides,
        method: "POST",
        json: { title },
      });
      if (created.error) return created;
      const { presentationId } = created.data;
      const url = presentationUrl(presentationId);
      if (slides.length === 0) return ok({ presentationId, url, slides: created.data.slides?.length ?? 0 });
      const blank = created.data.slides?.map((slide) => ({ deleteObject: { objectId: slide.objectId } })) ?? [];
      const updated = await api({
        url: batchUpdateUrl(presentationId),
        method: "POST",
        json: {
          requests: [...slides.flatMap((slide, index) => slideRequests(slide, `runelay_slide_${index}`)), ...blank],
        },
      });
      if (updated.error) return updated;
      return ok({ presentationId, url, slides: slides.length });
    },
  }),
  defineGoogleTool({
    name: "read_presentation",
    description:
      "Read a Google Slides presentation and return its title and the text of each slide. Scope: presentations.",
    input: z.object({ presentationId: z.string().min(1) }),
    run: async (api, { presentationId }) => {
      const presentation = await api<SlidesPresentation>({
        url: `${GOOGLE_API.slides}/${encodeURIComponent(presentationId)}`,
      });
      if (presentation.error) return presentation;
      return ok({
        presentationId,
        title: presentation.data.title ?? null,
        url: presentationUrl(presentationId),
        slides: (presentation.data.slides ?? []).map((slide) => ({
          objectId: slide.objectId,
          text: (slide.pageElements ?? [])
            .map((element) => shapeText(element.shape?.text).trim())
            .filter(Boolean)
            .join("\n"),
        })),
      });
    },
  }),
  defineGoogleTool({
    name: "add_slide",
    description:
      "Add a title-and-body slide to a Google Slides presentation, at the end or at a zero-based index. Scope: presentations.",
    input: z.object({
      presentationId: z.string().min(1),
      title: z.string().min(1),
      body: z.string().optional(),
      index: z.number().int().min(0).optional(),
    }),
    run: async (api, { presentationId, title, body, index }) => {
      const slideId = `runelay_${crypto.randomUUID().replaceAll("-", "")}`;
      const updated = await api({
        url: batchUpdateUrl(presentationId),
        method: "POST",
        json: { requests: slideRequests({ title, body }, slideId, index) },
      });
      if (updated.error) return updated;
      return ok({ presentationId, slideId, url: presentationUrl(presentationId) });
    },
  }),
];
