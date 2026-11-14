import { db } from "@/db/connection";

export const countUsers = () =>
  db.query<{ total: number }, []>(`SELECT COUNT(*) AS total FROM "user"`).get()?.total ?? 0;
