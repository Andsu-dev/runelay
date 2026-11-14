import { expect, test } from "bun:test";
import { isPrivateAddress, resolvesToPrivateAddress } from "../private-address";

test("blocks private, loopback, link-local and tailnet ranges", () => {
  for (const ip of [
    "10.1.2.3",
    "172.31.255.1",
    "192.168.0.10",
    "100.66.98.115",
    "127.0.0.1",
    "169.254.169.254",
    "::1",
    "fd00::1",
    "::ffff:10.0.0.1",
    "::",
    "FE80::1",
    "0.1.2.3",
  ]) {
    expect(isPrivateAddress(ip)).toBe(true);
  }
});

test("allows public addresses", () => {
  for (const ip of ["8.8.8.8", "172.32.0.1", "2606:4700::1", "::ffff:8.8.8.8"]) {
    expect(isPrivateAddress(ip)).toBe(false);
  }
});

test("treats local hostnames and private literals as private without dns", async () => {
  for (const host of ["localhost", "app.localhost", "db.internal", "[::1]", "10.0.0.1"]) {
    expect(await resolvesToPrivateAddress(host)).toBe(true);
  }
  expect(await resolvesToPrivateAddress("8.8.8.8")).toBe(false);
});

test("resolves hostnames and checks every address", async () => {
  expect(await resolvesToPrivateAddress("localhost.")).toBe(true);
  expect(await resolvesToPrivateAddress("runelay-test.invalid")).toBe(false);
});
