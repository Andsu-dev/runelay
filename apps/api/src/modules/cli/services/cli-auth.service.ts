import { createHash, randomBytes } from "node:crypto";
import {
  type CliAuthPollView,
  type CliAuthRequestView,
  type CliAuthStartView,
  fail,
  ok,
  type Result,
  type StartCliAuthInput,
} from "@runelay/shared";
import { env } from "@/config/env";
import { createApiKey, deleteApiKey } from "@/modules/api-keys/services/api-key.service";
import {
  CLI_AUTH_CODE_ALPHABET,
  CLI_AUTH_CODE_ATTEMPTS,
  CLI_AUTH_CODE_LENGTH,
  CLI_AUTH_POLL_INTERVAL_SECONDS,
  CLI_AUTH_TTL_MS,
  CLI_KEY_NAME_MAX,
  CLI_KEY_NAME_PREFIX,
} from "@/modules/cli/constants/cli-auth.constants";
import {
  consumeApprovedCliAuth,
  findCliAuthStatus,
  findPendingCliAuth,
  insertCliAuthRequest,
  markCliAuthApproved,
} from "@/modules/cli/repositories/cli-auth.repository";
import { seal, unseal } from "@/shared/crypto";

export { findCliStatus as describeCliStatus } from "@/modules/cli/repositories/cli-auth.repository";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const generateCliAuthCode = () => {
  const characters = [...randomBytes(CLI_AUTH_CODE_LENGTH)].map(
    (byte) => CLI_AUTH_CODE_ALPHABET[byte % CLI_AUTH_CODE_ALPHABET.length],
  );
  const half = CLI_AUTH_CODE_LENGTH / 2;
  return `${characters.slice(0, half).join("")}-${characters.slice(half).join("")}`;
};

export const startCliAuth = ({ device }: StartCliAuthInput): Result<CliAuthStartView> => {
  const pollToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + CLI_AUTH_TTL_MS).toISOString();
  for (let attempt = 0; attempt < CLI_AUTH_CODE_ATTEMPTS; attempt += 1) {
    const code = generateCliAuthCode();
    const inserted = insertCliAuthRequest({ code, pollTokenHash: hashToken(pollToken), device, expiresAt });
    if (inserted.error) return inserted;
    if (!inserted.data) continue;
    return ok({
      code,
      pollToken,
      verificationUrl: `${env.PUBLIC_URL}/cli/authorize?code=${code}`,
      expiresAt,
      intervalSeconds: CLI_AUTH_POLL_INTERVAL_SECONDS,
    });
  }
  return fail("STORAGE_FAILED", "Não consegui gerar um código livre. Tente de novo.");
};

export const findCliAuthRequest = (code: string): Result<CliAuthRequestView> => findPendingCliAuth(code);

export const approveCliAuth = async (
  organizationId: string,
  userId: string,
  code: string,
): Promise<Result<CliAuthRequestView>> => {
  const request = findPendingCliAuth(code);
  if (request.error) return request;
  const name = `${CLI_KEY_NAME_PREFIX} ${request.data.device}`.slice(0, CLI_KEY_NAME_MAX).trim();
  const created = await createApiKey(organizationId, userId, name);
  if (created.error) return created;
  const approved = markCliAuthApproved(code, organizationId, seal(created.data.key));
  if (approved.error || !approved.data) {
    deleteApiKey(organizationId, created.data.id);
    return approved.error ? approved : fail("CLI_AUTH_NOT_FOUND");
  }
  return ok(request.data);
};

export const pollCliAuth = (pollToken: string): Result<CliAuthPollView> => {
  const tokenHash = hashToken(pollToken);
  const status = findCliAuthStatus(tokenHash);
  if (status.error) return status;
  if (status.data !== "approved") return ok({ status: status.data, apiKey: null, organizationName: null });
  const consumed = consumeApprovedCliAuth(tokenHash);
  if (consumed.error) return consumed;
  if (!consumed.data) return ok({ status: "expired", apiKey: null, organizationName: null });
  const apiKey = unseal<string>(consumed.data.sealedKey);
  if (apiKey.error) return apiKey;
  return ok({ status: "approved", apiKey: apiKey.data, organizationName: consumed.data.organizationName });
};
