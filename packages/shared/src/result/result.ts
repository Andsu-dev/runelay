import { ERROR_CATALOG } from "./errors.constants";
import type { AppError, ErrorCode, Failure, Result, Success } from "./result.types";

export const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export const appError = (code: ErrorCode, message?: string, details?: unknown): AppError => ({
  code,
  status: ERROR_CATALOG[code].status,
  message: message ?? ERROR_CATALOG[code].message,
  ...(details === undefined ? {} : { details }),
});

export const ok = <T>(data: T): Success<T> => ({ data, error: null });

export const fail = (code: ErrorCode, message?: string, details?: unknown): Failure => ({
  data: null,
  error: appError(code, message, details),
});

export const attempt = async <T>(run: () => T | Promise<T>, code: ErrorCode): Promise<Result<T>> => {
  try {
    return ok(await run());
  } catch (error) {
    return fail(code, errorMessage(error));
  }
};

export const attemptSync = <T>(run: () => T, code: ErrorCode): Result<T> => {
  try {
    return ok(run());
  } catch (error) {
    return fail(code, errorMessage(error));
  }
};
