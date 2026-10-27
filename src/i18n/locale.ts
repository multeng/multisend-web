import { english, type MessageKey } from './catalog';

export type Locale = 'ru' | 'en';
export type Values = Readonly<Record<string, string | number>>;
export const LOCALE_KEY = 'ton-multisend.locale';
export function detectLocale(
  saved: string | null,
  languages: readonly string[],
): Locale {
  if (saved === 'ru' || saved === 'en') return saved;
  return languages[0]?.toLowerCase().split('-')[0] === 'ru' ? 'ru' : 'en';
}
export function initialLocale(): Locale {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(LOCALE_KEY);
  } catch {
    /* Storage can be blocked. */
  }
  return detectLocale(
    saved,
    navigator.languages.length ? navigator.languages : [navigator.language],
  );
}
export function translate(
  locale: Locale,
  key: MessageKey,
  values: Values = {},
): string {
  return (locale === 'ru' ? key : english[key]).replace(
    /\{(\w+)\}/g,
    (placeholder, name: string) =>
      values[name] === undefined ? placeholder : String(values[name]),
  );
}

const entries = Object.entries(english) as [MessageKey, string][];
function templatePattern(template: string) {
  return new RegExp(
    '^' +
      template
        .split(/(\{\d+\})/)
        .map((part) =>
          /^\{\d+\}$/.test(part)
            ? '(.+?)'
            : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        )
        .join('') +
      '$',
  );
}
const templates = entries
  .filter(([source]) => source.includes('{0}'))
  .flatMap(([key, en]) =>
    [key, en].map((template) => ({ key, pattern: templatePattern(template) })),
  );
/** Only application-owned status/error messages use this adapter; never user fields. */
export function translateMessage(locale: Locale, source: string): string {
  const entry = entries.find(([ru, en]) => source === ru || source === en);
  if (entry) return translate(locale, entry[0]);
  for (const template of templates) {
    const match = source.match(template.pattern);
    if (match)
      return translate(
        locale,
        template.key,
        Object.fromEntries(
          match.slice(1).map((value, index) => [index, value]),
        ),
      );
  }
  // Errors shown by the app are friendly known messages, not raw backend details.
  return locale === 'ru'
    ? 'Не удалось выполнить действие. Попробуйте ещё раз.'
    : 'Could not complete the action. Please try again.';
}
