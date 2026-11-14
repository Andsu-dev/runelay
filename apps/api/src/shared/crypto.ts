import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { attemptSync, type Result } from "@runeley/shared";
import { env } from "@/config/env";

const key = createHash("sha256").update(`runeley:sources:${env.RUNELEY_SECRET}`).digest();

export const seal = (value: unknown): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64");
};

export const unseal = <T>(blob: string): Result<T> =>
  attemptSync(() => {
    const raw = Buffer.from(blob, "base64");
    const decipher = createDecipheriv("aes-256-gcm", key, raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString()) as T;
  }, "STORAGE_FAILED");
