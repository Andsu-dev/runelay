const DATE_FORMAT = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const DAY_FORMAT = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });
const DATE_TIME_FORMAT = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" });
const NUMBER_FORMAT = new Intl.NumberFormat("pt-BR");
const COMPACT_FORMAT = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const PERCENT_FORMAT = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });
const BYTES_FORMAT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export const formatDate = (value: string | null) => (value ? DATE_FORMAT.format(new Date(value)) : "–");

export const formatDay = (value: string) => DAY_FORMAT.format(new Date(value));

export const formatDateTime = (value: string) => DATE_TIME_FORMAT.format(new Date(value));

export const formatNumber = (value: number) => NUMBER_FORMAT.format(value);

export const formatCompact = (value: number) =>
  value < 10_000 ? NUMBER_FORMAT.format(value) : COMPACT_FORMAT.format(value);

export const formatPercent = (fraction: number) => PERCENT_FORMAT.format(fraction);

export const formatBytes = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${BYTES_FORMAT.format(size / 1024)} KB`;
  return `${BYTES_FORMAT.format(size / (1024 * 1024))} MB`;
};
