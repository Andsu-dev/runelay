import type { Page } from "@runelay/shared";

export const pageOf = <T>(items: T[], total: number, cursor: number): Page<T> => ({
  items,
  total,
  nextCursor: cursor + items.length < total ? cursor + items.length : null,
});
