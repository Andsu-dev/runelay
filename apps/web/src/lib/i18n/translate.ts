import { formatNumber } from "@/lib/format";
import { DICTIONARIES, type Dictionary } from "./dictionary";
import { getLocale, type Locale, useLocale } from "./locale";

type LeafPath<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${LeafPath<T[K]>}`;
}[keyof T & string];

type PluralPath<T> = {
  [K in keyof T & string]: T[K] extends string
    ? never
    : T[K] extends { one: string; other: string }
      ? K
      : `${K}.${PluralPath<T[K]>}`;
}[keyof T & string];

export type MessageKey = LeafPath<Dictionary>;

export type PluralKey = PluralPath<Dictionary>;

export type MessageValues = Record<string, string | number>;

export interface Translator {
  (key: MessageKey, values?: MessageValues): string;
  plural: (key: PluralKey, count: number, values?: MessageValues) => string;
  locale: Locale;
}

const lookup = (locale: Locale, key: string) => {
  const value = key
    .split(".")
    .reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], DICTIONARIES[locale]);
  return typeof value === "string" ? value : key;
};

const interpolate = (template: string, values?: MessageValues) =>
  values
    ? template.replace(/\{(\w+)\}/g, (match, name: string) => {
        const value = values[name];
        if (value === undefined) return match;
        return typeof value === "number" ? formatNumber(value) : value;
      })
    : template;

const createTranslator = (locale: Locale): Translator =>
  Object.assign((key: MessageKey, values?: MessageValues) => interpolate(lookup(locale, key), values), {
    plural: (key: PluralKey, count: number, values?: MessageValues) =>
      interpolate(lookup(locale, `${key}.${count === 1 ? "one" : "other"}`), { count, ...values }),
    locale,
  });

const TRANSLATORS: Record<Locale, Translator> = { "pt-BR": createTranslator("pt-BR"), en: createTranslator("en") };

export const translate = (key: MessageKey, values?: MessageValues) => TRANSLATORS[getLocale()](key, values);

export const translatePlural = (key: PluralKey, count: number, values?: MessageValues) =>
  TRANSLATORS[getLocale()].plural(key, count, values);

export const useT = () => TRANSLATORS[useLocale()];
