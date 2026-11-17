export type JsonObject = Record<string, unknown>;

export const isObject = (value: unknown): value is JsonObject =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const getIn = (object: JsonObject, key: string) =>
  key.split(".").reduce<unknown>((current, part) => (isObject(current) ? current[part] : undefined), object);

export const setIn = (object: JsonObject, key: string, value: unknown) => {
  const parts = key.split(".");
  const last = parts.pop() ?? key;
  const parent = parts.reduce<JsonObject>((current, part) => {
    if (current[part] === undefined) current[part] = {};
    const next = current[part];
    if (!isObject(next)) throw new Error(`${part} is not an object`);
    return next;
  }, object);
  parent[last] = value;
};

export const parseJsonObject = (content: string, file: string) => {
  const parsed: unknown = content.trim() ? JSON.parse(content) : {};
  if (!isObject(parsed)) throw new Error(`${file} is not a JSON object`);
  return parsed;
};
