const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const plural = (total: number, one: string, many: string) => `${total} ${total === 1 ? one : many}`;

export const formatElapsed = (ms: number) => {
  if (ms < 1000) return `${Math.max(0, Math.round(ms))}ms`;
  if (ms < MINUTE) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / MINUTE)}m ${Math.round((ms % MINUTE) / 1000)}s`;
};

export const relativeTime = (at: number, now = Date.now()) => {
  const diff = Math.max(0, now - at);
  if (diff < 45_000) return "just now";
  if (diff < 90 * MINUTE) return `${Math.max(1, Math.round(diff / MINUTE))} min ago`;
  if (diff < 36 * HOUR) return `${Math.round(diff / HOUR)} h ago`;
  return plural(Math.round(diff / DAY), "day ago", "days ago");
};

export const maskKey = (key: string) => (key.length <= 10 ? "••••" : `${key.slice(0, 4)}…${key.slice(-4)}`);

export const shortPath = (path: string, home: string) =>
  home && path.startsWith(home) ? `~${path.slice(home.length)}` : path;
