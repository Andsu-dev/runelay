import { existsSync, readFileSync } from "node:fs";
import {
  CLAUDE_CREDENTIALS_FILE,
  CLAUDE_KEYCHAIN_SERVICE,
  CODEX_CREDENTIALS_FILE,
  CODEX_KEYCHAIN_SERVICE,
  GROK_CREDENTIALS_FILE,
} from "@/constants/credential.constants";
import { listKeychainAccounts, readKeychainSecret } from "@/lib/keychain";
import { normalizeMcpUrl } from "@/lib/url";
import {
  parseClaudeCredentials,
  parseCodexCredentials,
  parseGrokCredentials,
} from "@/services/credential-parser.service";
import type { ClientSource } from "@/types/client-config.types";
import type { CredentialScan, KeychainPlan, LocalCredential } from "@/types/credential.types";

const readText = (path: string) => (existsSync(path) ? readFileSync(path, "utf8") : null);

const fromFile = (path: string, parse: (raw: string) => LocalCredential[]) => {
  const raw = readText(path);
  return raw ? parse(raw) : [];
};


const strongerOf = (current: LocalCredential | undefined, candidate: LocalCredential) => {
  if (!current) return candidate;
  if (Boolean(candidate.refreshToken) !== Boolean(current.refreshToken))
    return candidate.refreshToken ? candidate : current;
  return (candidate.expiresAt ?? 0) > (current.expiresAt ?? 0) ? candidate : current;
};

export const credentialsByUrl = (credentials: LocalCredential[]) => {
  const byUrl = new Map<string, LocalCredential>();
  for (const credential of credentials) {
    const url = normalizeMcpUrl(credential.url);
    byUrl.set(url, strongerOf(byUrl.get(url), credential));
  }
  return byUrl;
};

export const scanFileCredentials = (useKeychain: boolean): CredentialScan => {
  const notes: string[] = [];
  const verboseNotes: string[] = [];
  const credentials = [
    ...fromFile(GROK_CREDENTIALS_FILE, parseGrokCredentials),
    ...fromFile(CODEX_CREDENTIALS_FILE, parseCodexCredentials),
    ...fromFile(CLAUDE_CREDENTIALS_FILE, parseClaudeCredentials),
  ];
  if (!useKeychain && process.platform === "darwin") verboseNotes.push("Skipped the Keychain (RUNELAY_SKIP_KEYCHAIN).");
  notes.push("Cursor stores its logins encrypted, so its accounts will ask you to sign in again.");
  return { credentials, notes, verboseNotes };
};

const serverNameKey = (value: string) => value.trim().toLowerCase();

export const EMPTY_KEYCHAIN_PLAN: KeychainPlan = { codexAccounts: [], claude: false, prompts: 0 };

export const wantedKeychainSources = (
  sources: ClientSource[],
  connectedIdentities: Set<string>,
  fileCredentials: LocalCredential[],
) => {
  const covered = credentialsByUrl(fileCredentials);
  return sources.filter(
    ({ source, identity }) =>
      source.config.kind === "mcp" && !connectedIdentities.has(identity) && !covered.has(identity),
  );
};

export const planKeychainReads = (
  wanted: ClientSource[],
  listAccounts: (service: string) => string[] = listKeychainAccounts,
): KeychainPlan => {
  const codexNames = new Set(
    wanted.filter(({ client }) => client === "codex").map(({ source }) => serverNameKey(source.name)),
  );
  const codexAccounts = codexNames.size
    ? listAccounts(CODEX_KEYCHAIN_SERVICE).filter((account) =>
        codexNames.has(serverNameKey(account.split("|")[0] ?? "")),
      )
    : [];
  const claude = wanted.some(({ client }) => client === "claude");
  return { codexAccounts, claude, prompts: codexAccounts.length + (claude ? 1 : 0) };
};

export const readKeychainCredentials = (
  { codexAccounts, claude }: KeychainPlan,
  readSecret: (service: string, account?: string) => string | null = readKeychainSecret,
): LocalCredential[] => {
  const codex = codexAccounts.flatMap((account) => {
    const secret = readSecret(CODEX_KEYCHAIN_SERVICE, account);
    return secret ? parseCodexCredentials(secret) : [];
  });
  const claudeSecret = claude ? readSecret(CLAUDE_KEYCHAIN_SERVICE) : null;
  return [...codex, ...(claudeSecret ? parseClaudeCredentials(claudeSecret) : [])];
};
