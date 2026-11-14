import { appError, type ErrorCode, type Result } from "@runelay/shared";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export const respond = <T>(c: Context, result: Result<T>, status: ContentfulStatusCode = 200) =>
  result.error
    ? c.json({ data: null, error: result.error }, result.error.status as ContentfulStatusCode)
    : c.json({ data: result.data, error: null }, status);

export const respondError = (c: Context, code: ErrorCode, message?: string, details?: unknown) => {
  const error = appError(code, message, details);
  return c.json({ data: null, error }, error.status as ContentfulStatusCode);
};
