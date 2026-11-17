import { existsSync, readdirSync, readFileSync, statSync, watch } from "node:fs";
import { join, relative, sep } from "node:path";

const DEBOUNCE_MS = 5_000;
const RETRY_MS = 60_000;
const PUSH_TIMEOUT_MS = 30_000;
const BATCH_SIZE = 20;
const ENTRY_FILE = "SKILL.md";
const MARKER_FILE = ".runelay";
const FILE_MAX_BYTES = 200 * 1024;
const FILES_MAX = 200;
const LIMITS = { name: 200, description: 2000, body: 200_000, filePath: 300 };
const SLUG_PATTERN = /^[a-z0-9]+(?:[-:][a-z0-9]+)*$/;
const SKIPPED_DIRECTORIES = new Set(["node_modules", ".git", ".venv", "__pycache__", "dist", "build"]);
const isHidden = (name) => name.startsWith(".");
const BINARY_EXTENSIONS =
  /\.(png|jpe?g|gif|webp|ico|icns|pdf|zip|gz|tgz|tar|woff2?|ttf|otf|mp3|mp4|mov|wav|webm|sqlite|db|wasm|so|dylib|exe|bin|psd|fig|sketch|heic|pyc|class|jar|DS_Store)$/i;

export const skillDirectories = (home, customDir) =>
  customDir
    ? [customDir]
    : [
        join(home, ".claude", "skills"),
        join(home, ".agents", "skills"),
        join(home, ".codex", "skills"),
        join(home, ".cursor", "skills"),
        join(home, ".cursor", "skills-cursor"),
        join(home, ".grok", "skills"),
        join(home, ".gemini", "skills"),
        join(home, ".config", "opencode", "skills"),
      ];

const toSlug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9:]+/g, "-")
    .replace(/^[-:]+|[-:]+$/g, "");

const unquote = (value) => {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed[0] === trimmed.at(-1) && (trimmed[0] === '"' || trimmed[0] === "'")) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const readBlock = (lines, start, style) => {
  const collected = [];
  let index = start;
  while (index < lines.length && (lines[index].trim() === "" || /^\s/.test(lines[index]))) {
    collected.push(lines[index].trim());
    index += 1;
  }
  const text = style === "|" ? collected.join("\n") : collected.filter(Boolean).join(" ");
  return { text: text.trim(), next: index };
};

export const splitFrontmatter = (text) => {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { meta: {}, body: text };
  const lines = match[1].split(/\r?\n/);
  const meta = {};
  let index = 0;
  while (index < lines.length) {
    const field = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(lines[index]);
    if (!field) {
      index += 1;
      continue;
    }
    const [, key, raw] = field;
    const block = /^([|>])[-+]?\s*$/.exec(raw);
    const { text: value, next } = block
      ? readBlock(lines, index + 1, block[1])
      : (() => {
          const rest = readBlock(lines, index + 1, ">");
          return { text: [unquote(raw), rest.text].filter(Boolean).join(" "), next: rest.next };
        })();
    meta[key] = value;
    index = next;
  }
  return { meta, body: text.slice(match[0].length) };
};

const isTextFile = (path, size) => {
  if (size > FILE_MAX_BYTES || BINARY_EXTENSIONS.test(path)) return false;
  return !readFileSync(path).subarray(0, 8000).includes(0);
};

const collectFiles = (root, directory, mtimes) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (SKIPPED_DIRECTORIES.has(entry.name) || isHidden(entry.name)) return [];
    const stats = statSync(path, { throwIfNoEntry: false });
    if (!stats) return [];
    if (stats.isDirectory()) return collectFiles(root, path, mtimes);
    const relativePath = relative(root, path).split(sep).join("/");
    if (relativePath === ENTRY_FILE || relativePath.length > LIMITS.filePath) return [];
    if (!stats.isFile() || !isTextFile(path, stats.size)) return [];
    mtimes.push(stats.mtimeMs);
    return [{ path: relativePath, content: readFileSync(path, "utf8") }];
  });

export const readSkill = (directory, name) => {
  const root = join(directory, name);
  const entry = join(root, ENTRY_FILE);
  if (isHidden(name) || !existsSync(entry) || existsSync(join(root, MARKER_FILE))) return null;
  const slug = toSlug(name);
  if (!slug || slug.length > 120 || !SLUG_PATTERN.test(slug)) return null;
  const mtimes = [statSync(entry).mtimeMs];
  const { meta, body } = splitFrontmatter(readFileSync(entry, "utf8"));
  const files = collectFiles(root, root, mtimes).slice(0, FILES_MAX);
  const text = (value) => (typeof value === "string" ? value.trim() : "");
  return {
    slug,
    name: (text(meta.name) || name).slice(0, LIMITS.name),
    description: text(meta.description).slice(0, LIMITS.description),
    body: body.trim().slice(0, LIMITS.body),
    enabled: true,
    files,
    updatedAt: new Date(Math.max(...mtimes)).toISOString(),
  };
};

const pushBatch = async ({ url, apiKey }, skills) => {
  const response = await fetch(`${url}/v1/skills/import`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ skills }),
    signal: AbortSignal.timeout(PUSH_TIMEOUT_MS),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || payload.error) {
    throw new Error(payload?.error?.message ?? `${url} respondeu HTTP ${response.status}`);
  }
};

const visibleSegments = (file) => {
  const segments = String(file).split(/[\\/]/).filter(Boolean);
  return segments.some(isHidden) ? null : segments;
};

const watchDirectory = (directory, onChange) => {
  if (process.platform !== "linux") {
    return [
      watch(directory, { recursive: true }, (_event, file) => {
        const segments = file && visibleSegments(file);
        if (segments?.length) onChange(segments[0]);
      }),
    ];
  }
  const watchers = [watch(directory, (_event, file) => file && !isHidden(String(file)) && onChange(String(file)))];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || isHidden(entry.name) || SKIPPED_DIRECTORIES.has(entry.name)) continue;
    watchers.push(watch(join(directory, entry.name), (_event, file) => (!file || !isHidden(String(file))) && onChange(entry.name)));
  }
  return watchers;
};

export const createSkillSync = ({ directories, connection, onStatus, log }) => {
  let watchers = [];
  let pending = new Map();
  let timer = null;
  let syncing = false;

  const schedule = (delay) => {
    clearTimeout(timer);
    timer = setTimeout(flush, delay);
  };

  const queue = (directory, name) => {
    if (!name || isHidden(name)) return;
    pending.set(`${directory}\0${name}`, { directory, name });
    schedule(DEBOUNCE_MS);
  };

  async function flush() {
    timer = null;
    if (pending.size === 0) return;
    if (syncing) return schedule(DEBOUNCE_MS);
    syncing = true;
    const batch = pending;
    pending = new Map();
    try {
      const skills = [...batch.values()].flatMap(({ directory, name }) => {
        try {
          return readSkill(directory, name) ?? [];
        } catch (error) {
          log(`skills: não consegui ler ${join(directory, name)}: ${error instanceof Error ? error.message : error}`);
          return [];
        }
      });
      for (let index = 0; index < skills.length; index += BATCH_SIZE) {
        await pushBatch(connection, skills.slice(index, index + BATCH_SIZE));
      }
      if (skills.length > 0) onStatus({ ok: true, at: new Date(), count: skills.length });
    } catch (error) {
      for (const [key, value] of batch) if (!pending.has(key)) pending.set(key, value);
      const message = error instanceof Error ? error.message : String(error);
      log(`skills: falha ao sincronizar: ${message}`);
      onStatus({ ok: false, at: new Date(), message });
      if (watchers.length > 0) schedule(RETRY_MS);
    } finally {
      syncing = false;
    }
  }

  const start = () => {
    if (watchers.length > 0) return;
    for (const directory of directories) {
      if (!existsSync(directory)) continue;
      try {
        watchers.push(...watchDirectory(directory, (name) => queue(directory, name)));
      } catch (error) {
        log(`skills: não consegui observar ${directory}: ${error instanceof Error ? error.message : error}`);
      }
    }
    for (const watcher of watchers) watcher.on("error", (error) => log(`skills: erro ao observar: ${error.message}`));
  };

  const stop = () => {
    clearTimeout(timer);
    timer = null;
    pending = new Map();
    for (const watcher of watchers) watcher.close();
    watchers = [];
  };

  return { start, stop, watching: () => watchers.length > 0 };
};
