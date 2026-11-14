import { spyOn } from "bun:test";
import { db } from "@/db/connection";

export const withQueryFault = <T>(matches: (sql: string) => boolean, run: () => T, fault?: () => unknown): T => {
  const original = db.query.bind(db);
  const spy = spyOn(db, "query").mockImplementation(((sql: string) => {
    if (!matches(sql)) return original(sql);
    if (fault) return fault();
    throw new Error("disk I/O error");
  }) as typeof db.query);
  try {
    return run();
  } finally {
    spy.mockRestore();
  }
};

export const withQueryFaultAsync = async <T>(matches: (sql: string) => boolean, run: () => Promise<T>): Promise<T> => {
  const original = db.query.bind(db);
  const spy = spyOn(db, "query").mockImplementation(((sql: string) => {
    if (!matches(sql)) return original(sql);
    throw new Error("disk I/O error");
  }) as typeof db.query);
  try {
    return await run();
  } finally {
    spy.mockRestore();
  }
};
