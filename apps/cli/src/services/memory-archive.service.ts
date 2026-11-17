import { cpSync, type Dirent, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { attemptSync, type Result } from "@runelay/shared";
import { readMemories } from "@/services/context-reader.service";
import type { ArchiveOutcome, ArchiveRequest } from "@/types/archive.types";

const moveDirectory = (from: string, to: string) => {
  mkdirSync(dirname(to), { recursive: true });
  try {
    renameSync(from, to);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EXDEV") throw error;
    cpSync(from, to, { recursive: true });
    rmSync(from, { recursive: true });
  }
};

const archivePathOf = (home: string, archiveDir: string, directory: string) => {
  const fromHome = relative(home, directory);
  return join(archiveDir, fromHome.startsWith("..") ? join("external", directory) : fromHome);
};

const isMarkdownFile = (entry: Dirent) => entry.isFile() && entry.name.endsWith(".md");

const entriesOf = (directory: string) =>
  existsSync(directory) && statSync(directory).isDirectory() ? readdirSync(directory, { withFileTypes: true }) : [];

export const archiveImportedMemories = (request: ArchiveRequest): Result<ArchiveOutcome> =>
  attemptSync(() => {
    const sent = new Map(request.sent.map((memory) => [memory.slug, memory.body]));
    const directories = [...new Set(request.directories)].filter((directory) =>
      entriesOf(directory).some(isMarkdownFile),
    );
    const imported = directories.filter(
      (directory) =>
        entriesOf(directory).every(isMarkdownFile) &&
        readMemories(directory).every((memory) => sent.get(memory.slug) === memory.body),
    );
    const kept = directories.filter((directory) => !imported.includes(directory));
    if (!imported.length) return { archiveDir: null, moved: [], kept };
    const archiveDir = join(request.archiveRoot, request.now.toISOString().replace(/[:.]/g, "-"));
    for (const directory of imported) moveDirectory(directory, archivePathOf(request.home, archiveDir, directory));
    return { archiveDir, moved: imported, kept };
  }, "STORAGE_FAILED");
