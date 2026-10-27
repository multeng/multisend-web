import { createContext, useContext } from 'react';
import type { MessageKey } from './catalog';
import {
  translate,
  translateMessage,
  type Locale,
  type Values,
} from './locale';

export type I18n = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, values?: Values) => string;
  message: (source: string) => string;
};
export const I18nContext = createContext<I18n>({
  locale: 'ru',
  setLocale: () => {},
  t: (key, values) => translate('ru', key, values),
  message: (source) => translateMessage('ru', source),
});
export const useI18n = () => useContext(I18nContext);
