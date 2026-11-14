const AVATAR_GRADIENTS = [
  "bg-(image:--avatar-1)",
  "bg-(image:--avatar-2)",
  "bg-(image:--avatar-3)",
  "bg-(image:--avatar-4)",
  "bg-(image:--avatar-5)",
  "bg-(image:--avatar-6)",
] as const;

export const avatarGradient = (seed: string) => {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
};
