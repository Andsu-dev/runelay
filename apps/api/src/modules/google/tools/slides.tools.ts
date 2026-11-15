import { ok } from "@runelay/shared";
import { z } from "zod";
import { GOOGLE_API } from "@/modules/google/constants/google.constants";
import { defineGoogleTool } from "@/modules/google/utils/google-tool";

const slideRequests = (slide: { title: string; body?: string }, index: number) => {
  const id = `runelay_slide_${index}`;
  return [
    {
      createSlide: {
        objectId: id,
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
};

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
      const url = `https://docs.google.com/presentation/d/${presentationId}/edit`;
      if (slides.length === 0) return ok({ presentationId, url, slides: created.data.slides?.length ?? 0 });
      const blank = created.data.slides?.map((slide) => ({ deleteObject: { objectId: slide.objectId } })) ?? [];
      const updated = await api({
        url: `${GOOGLE_API.slides}/${presentationId}:batchUpdate`,
        method: "POST",
        json: { requests: [...slides.flatMap(slideRequests), ...blank] },
      });
      if (updated.error) return updated;
      return ok({ presentationId, url, slides: slides.length });
    },
  }),
];
