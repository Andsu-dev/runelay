import { z } from "zod";

export const startCliAuthSchema = z.object({
  device: z.string().trim().min(1).max(80),
});

export const approveCliAuthSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Código inválido"),
});
