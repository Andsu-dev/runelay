import { RATE_LIMIT_WINDOW_MS } from "@/modules/auth/constants/auth.constants";

const windows = new Map<string, number[]>();

export const consumeRateLimit = (key: string, limit: number, now = Date.now()) => {
  const recent = (windows.get(key) ?? []).filter((at) => now - at < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= limit) {
    windows.set(key, recent);
    return { allowed: false, retryAfter: Math.ceil((RATE_LIMIT_WINDOW_MS - (now - (recent[0] ?? now))) / 1000) };
  }
  recent.push(now);
  windows.set(key, recent);
  return { allowed: true, retryAfter: 0 };
};
