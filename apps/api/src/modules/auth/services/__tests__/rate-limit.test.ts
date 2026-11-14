import { expect, test } from "bun:test";
import { consumeRateLimit } from "../rate-limit.service";

test("blocks after the limit inside the window and frees it after a minute", () => {
  const start = 1_000_000;
  expect(consumeRateLimit("k", 2, start).allowed).toBe(true);
  expect(consumeRateLimit("k", 2, start + 10).allowed).toBe(true);
  const blocked = consumeRateLimit("k", 2, start + 20);
  expect(blocked.allowed).toBe(false);
  expect(blocked.retryAfter).toBe(60);
  expect(consumeRateLimit("k", 2, start + 60_001).allowed).toBe(true);
});
