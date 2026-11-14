import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const PRIVATE_V4: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.168.0.0", 16],
];

const toNumber = (address: string) => address.split(".").reduce((total, part) => total * 256 + Number(part), 0);

const isPrivateV4 = (address: string) => {
  const value = toNumber(address);
  return PRIVATE_V4.some(
    ([base, bits]) => Math.floor(value / 2 ** (32 - bits)) === Math.floor(toNumber(base) / 2 ** (32 - bits)),
  );
};

const isPrivateV6 = (address: string) => {
  const normalized = address.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (normalized.startsWith("::ffff:")) return isPrivateV4(normalized.slice(7));
  return /^(fc|fd|fe8|fe9|fea|feb)/.test(normalized);
};

export const isPrivateAddress = (address: string) =>
  isIP(address) === 4 ? isPrivateV4(address) : isPrivateV6(address);

export const resolvesToPrivateAddress = async (hostname: string) => {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) return true;
  if (isIP(host)) return isPrivateAddress(host);
  const addresses = await lookup(host, { all: true }).catch(() => []);
  return addresses.some(({ address }) => isPrivateAddress(address));
};
