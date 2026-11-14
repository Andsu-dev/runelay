import type { z } from "zod";
import type { contextBriefSchema, contextClientSchema, contextSearchSchema } from "./context.schema";

export type ContextClient = z.infer<typeof contextClientSchema>;
export type ContextSearchInput = z.infer<typeof contextSearchSchema>;
export type ContextBriefInput = z.infer<typeof contextBriefSchema>;

export interface ContextHitView {
  kind: "memory" | "skill";
  slug: string;
  name: string;
  description: string;
  snippet: string;
}

export interface ContextBriefView {
  client: ContextClient;
  markdown: string;
  pinnedCount: number;
  skillCount: number;
}
