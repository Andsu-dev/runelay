import { createHash } from "node:crypto";

export const hashUrl = (url: string) =>
  createHash("sha256").update(url.trim().replace(/\/+$/, "").toLowerCase()).digest("hex");
