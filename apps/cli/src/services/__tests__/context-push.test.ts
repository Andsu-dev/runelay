import { expect, test } from "bun:test";
import { summarizeBatch } from "../context-push.service";

test("keeps the counts the server reports", () => {
  expect(summarizeBatch({ imported: 5, written: 2, skipped: ["newer"], unchanged: ["a", "b", "c"] })).toEqual({
    imported: 5,
    written: 2,
    skipped: ["newer"],
    unchanged: ["a", "b", "c"],
  });
});

test("falls back to imported and skipped when the server is older", () => {
  expect(summarizeBatch({ imported: 4, skipped: ["newer"] })).toEqual({
    imported: 4,
    written: 4,
    skipped: ["newer"],
    unchanged: [],
  });
  expect(summarizeBatch({})).toEqual({ imported: 0, written: 0, skipped: [], unchanged: [] });
});
