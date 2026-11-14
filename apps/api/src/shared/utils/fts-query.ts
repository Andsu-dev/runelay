export const toFtsQuery = (text: string, operator: "AND" | "OR"): string | null => {
  const tokens = text.match(/[\p{L}\p{N}_]+/gu) ?? [];
  if (tokens.length === 0) return null;
  return tokens.map((token) => `"${token}"*`).join(` ${operator} `);
};
