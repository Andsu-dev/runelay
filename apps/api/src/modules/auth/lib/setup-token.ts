import { randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/config/env";

export { SETUP_TOKEN_HEADER } from "@runeley/shared";

export const SETUP_TOKEN = env.RUNELEY_SETUP_TOKEN ?? randomBytes(18).toString("base64url");

export const setupUrl = () => `${env.PUBLIC_URL}/login?mode=signup&token=${SETUP_TOKEN}`;

export const isSetupToken = (candidate: string | null | undefined) => {
  if (!candidate) return false;
  const expected = Buffer.from(SETUP_TOKEN);
  const received = Buffer.from(candidate);
  return expected.length === received.length && timingSafeEqual(expected, received);
};
