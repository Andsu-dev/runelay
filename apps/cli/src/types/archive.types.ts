import type { CreateMemoryInput } from "@runelay/shared";

export interface ArchiveRequest {
  sent: Pick<CreateMemoryInput, "slug" | "body">[];
  directories: string[];
  home: string;
  archiveRoot: string;
  now: Date;
}

export interface ArchiveOutcome {
  archiveDir: string | null;
  moved: string[];
  kept: string[];
}
