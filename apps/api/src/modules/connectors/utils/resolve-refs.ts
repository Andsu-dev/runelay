const pointer = (root: unknown, ref: string) =>
  ref
    .slice(2)
    .split("/")
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part.replace(/~1/g, "/").replace(/~0/g, "~")],
      root,
    );

export const resolveRefs = <T>(node: T, root: unknown, seen: ReadonlySet<string> = new Set()): T => {
  if (Array.isArray(node)) return node.map((item) => resolveRefs(item, root, seen)) as T;
  if (!node || typeof node !== "object") return node;
  const ref = (node as { $ref?: unknown }).$ref;
  if (typeof ref === "string" && ref.startsWith("#/")) {
    if (seen.has(ref)) return {} as T;
    return resolveRefs(pointer(root, ref) as T, root, new Set([...seen, ref]));
  }
  return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, resolveRefs(value, root, seen)])) as T;
};
