import { getLocale, type Locale } from "@/lib/i18n/locale";

const formatters = <T>(create: (locale: Locale) => T) => {
  const cache = new Map<Locale, T>();
  return () => {
    const locale = getLocale();
    const cached = cache.get(locale);
    if (cached) return cached;
    const created = create(locale);
    cache.set(locale, created);
    return created;
  };
};

const dateFormat = formatters(
  (locale) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }),
);
const dayFormat = formatters(
  (locale) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", timeZone: "UTC" }),
);
const dateTimeFormat = formatters(
  (locale) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }),
);
const shortDateTimeFormat = formatters(
  (locale) => new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "medium" }),
);
const numberFormat = formatters((locale) => new Intl.NumberFormat(locale));
const compactFormat = formatters(
  (locale) => new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }),
);
const percentFormat = formatters(
  (locale) => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }),
);
const bytesFormat = formatters((locale) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }));
const relativeFormat = formatters((locale) => new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" }));

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

export const formatDate = (value: string | null) => (value ? dateFormat().format(new Date(value)) : "–");

export const formatDay = (value: string) => dayFormat().format(new Date(value));

export const formatDateTime = (value: string) => dateTimeFormat().format(new Date(value));

export const formatShortDateTime = (value: string) => shortDateTimeFormat().format(new Date(value));

export const formatNumber = (value: number) => numberFormat().format(value);

export const formatCompact = (value: number) =>
  value < 10_000 ? numberFormat().format(value) : compactFormat().format(value);

export const formatPercent = (fraction: number) => percentFormat().format(fraction);

export const formatRelative = (value: string) => {
  const elapsed = new Date(value).getTime() - Date.now();
  const unit = RELATIVE_UNITS.find(([, size]) => Math.abs(elapsed) >= size);
  return unit ? relativeFormat().format(Math.round(elapsed / unit[1]), unit[0]) : relativeFormat().format(0, "second");
};

export const formatBytes = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${bytesFormat().format(size / 1024)} KB`;
  return `${bytesFormat().format(size / (1024 * 1024))} MB`;
};
