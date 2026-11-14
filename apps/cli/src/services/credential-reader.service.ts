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
import type { CredentialScan, LocalCredential } from "@/types/credential.types";

const readText = (path: string) => (existsSync(path) ? readFileSync(path, "utf8") : null);

const fromFile = (path: string, parse: (raw: string) => LocalCredential[]) => {
  const raw = readText(path);
  return raw ? parse(raw) : [];
};

const fromCodexKeychain = () =>
  listKeychainAccounts(CODEX_KEYCHAIN_SERVICE).flatMap((account) => {
    const secret = readKeychainSecret(CODEX_KEYCHAIN_SERVICE, account);
    return secret ? parseCodexCredentials(secret) : [];
  });

const fromClaudeKeychain = () => {
  const secret = readKeychainSecret(CLAUDE_KEYCHAIN_SERVICE);
  return secret ? parseClaudeCredentials(secret) : [];
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

export const scanLocalCredentials = (useKeychain: boolean): CredentialScan => {
  const notes: string[] = [];
  const credentials = [
    ...fromFile(GROK_CREDENTIALS_FILE, parseGrokCredentials),
    ...fromFile(CODEX_CREDENTIALS_FILE, parseCodexCredentials),
    ...fromFile(CLAUDE_CREDENTIALS_FILE, parseClaudeCredentials),
  ];
  if (useKeychain) credentials.push(...fromCodexKeychain(), ...fromClaudeKeychain());
  else if (process.platform === "darwin") notes.push("Keychain ignorado (RUNELEY_SKIP_KEYCHAIN).");
  notes.push("Cursor guarda os logins cifrados, então as contas dele vão pedir login de novo.");
  return { credentials, notes };
};
