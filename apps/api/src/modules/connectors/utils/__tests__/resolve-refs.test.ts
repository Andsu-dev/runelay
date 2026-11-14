import { describe, expect, test } from "bun:test";
import { resolveRefs } from "@/modules/connectors/utils/resolve-refs";

describe("resolveRefs", () => {
  test("returns primitives and null untouched", () => {
    expect(resolveRefs(3, {})).toBe(3);
    expect(resolveRefs("text", {})).toBe("text");
    expect(resolveRefs(null, {})).toBeNull();
    expect(resolveRefs(undefined, {})).toBeUndefined();
  });

  test("resolves local refs inside arrays and nested objects", () => {
    const root = { defs: { name: { type: "string" }, "a/b": { type: "number" }, "c~d": { type: "boolean" } } };
    const node = {
      list: [{ $ref: "#/defs/name" }, 1],
      nested: { slash: { $ref: "#/defs/a~1b" }, tilde: { $ref: "#/defs/c~0d" } },
    };
    expect(resolveRefs<unknown>(node, root)).toEqual({
      list: [{ type: "string" }, 1],
      nested: { slash: { type: "number" }, tilde: { type: "boolean" } },
    });
  });

  test("keeps external refs and resolves missing pointers to undefined", () => {
    expect(resolveRefs({ $ref: "other.json#/x" }, {})).toEqual({ $ref: "other.json#/x" });
    expect(resolveRefs({ $ref: "#/missing/deep" }, {})).toBeUndefined();
  });

  test("breaks reference cycles with an empty object", () => {
    const root = { defs: { node: { type: "object", properties: { child: { $ref: "#/defs/node" } } } } };
    expect(resolveRefs<unknown>({ $ref: "#/defs/node" }, root)).toEqual({
      type: "object",
      properties: { child: {} },
    });
  });
});
