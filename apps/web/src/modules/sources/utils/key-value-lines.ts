export const parseKeyValueLines = (text: string, separator: ":" | "="): Record<string, string> =>
  Object.fromEntries(
    text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.includes(separator))
      .map((line) => {
        const index = line.indexOf(separator);
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );

export const formatKeyValueLines = (map: Record<string, string>, separator: ": " | "=") =>
  Object.entries(map)
    .map(([key, value]) => `${key}${separator}${value}`)
    .join("\n");
