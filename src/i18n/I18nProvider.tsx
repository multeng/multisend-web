import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nContext, type I18n } from './context';
import {
  initialLocale,
  LOCALE_KEY,
  translate,
  translateMessage,
} from './locale';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, updateLocale] = useState(initialLocale);
  const value = useMemo<I18n>(
    () => ({
      locale,
      setLocale: (next) => {
        if (next !== 'ru' && next !== 'en') return;
        updateLocale(next);
        try {
          localStorage.setItem(LOCALE_KEY, next);
        } catch {
          /* Preference persistence is optional. */
        }
      },
      t: (key, values) => translate(locale, key, values),
      message: (source) => translateMessage(locale, source),
    }),
    [locale],
  );
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = 'TON Multisend';
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        'content',
        translate(
          locale,
          'TON Multisend — удобная подготовка массовых выплат в TON. Приложение в разработке, начиная с testnet.',
        ),
      );
  }, [locale]);
  return <I18nContext value={value}>{children}</I18nContext>;
}
