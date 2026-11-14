import { describe, expect, test } from "bun:test";
import { seal, unseal } from "@/shared/crypto";
import { clientIp } from "@/shared/utils/client-ip";
import { toFtsQuery } from "@/shared/utils/fts-query";
import { pageOf } from "@/shared/utils/page";

describe("crypto", () => {
  test("seal and unseal round trip a value", () => {
    const sealed = seal({ token: "abc", n: 1 });
    expect(sealed).not.toContain("abc");
    expect(unseal<{ token: string; n: number }>(sealed).data).toEqual({ token: "abc", n: 1 });
  });

  test("sealing twice yields different blobs", () => {
    expect(seal("same")).not.toBe(seal("same"));
  });

  test("unseal fails on tampered input", () => {
    const sealed = Buffer.from(seal("value"), "base64");
    sealed[sealed.length - 1] = (sealed[sealed.length - 1] ?? 0) ^ 1;
    expect(unseal(sealed.toString("base64")).error?.code).toBe("STORAGE_FAILED");
    expect(unseal("short").error?.code).toBe("STORAGE_FAILED");
  });
});

describe("clientIp", () => {
  test("prefers cf-connecting-ip", () => {
    const headers = new Headers({
      "cf-connecting-ip": "1.1.1.1",
      "x-forwarded-for": "2.2.2.2",
      "x-real-ip": "3.3.3.3",
    });
    expect(clientIp(headers)).toBe("1.1.1.1");
  });

  test("uses the first x-forwarded-for entry", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": " 2.2.2.2 , 4.4.4.4", "x-real-ip": "3.3.3.3" }))).toBe("2.2.2.2");
  });

  test("falls back to x-real-ip and then null", () => {
    expect(clientIp(new Headers({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
    expect(clientIp(new Headers())).toBeNull();
  });
});

describe("toFtsQuery", () => {
  test("quotes tokens as prefixes joined by the operator", () => {
    expect(toFtsQuery("olá mundo-novo", "AND")).toBe('"olá"* AND "mundo"* AND "novo"*');
    expect(toFtsQuery("a b", "OR")).toBe('"a"* OR "b"*');
  });

  test("returns null without tokens", () => {
    expect(toFtsQuery("  -- !! ", "AND")).toBeNull();
  });
});

describe("pageOf", () => {
  test("computes the next cursor", () => {
    expect(pageOf([1, 2], 5, 0)).toEqual({ items: [1, 2], total: 5, nextCursor: 2 });
    expect(pageOf([5], 5, 4)).toEqual({ items: [5], total: 5, nextCursor: null });
  });
});
