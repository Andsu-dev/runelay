import type { ERROR_CATALOG } from "./errors.constants";

export type ErrorCode = keyof typeof ERROR_CATALOG;

export interface AppError {
  code: ErrorCode;
  status: number;
  message: string;
  details?: unknown;
}

export type Success<T> = { data: T; error: null };
export type Failure = { data: null; error: AppError };
export type Result<T> = Success<T> | Failure;
