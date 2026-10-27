import { expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider, useI18n, detectLocale, LOCALE_KEY } from './i18n';
import { LanguageSwitch } from './LanguageSwitch';

function Probe() {
  const { t } = useI18n();
  return (
    <>
      <LanguageSwitch />
      <p>{t('Добавить получателя')}</p>
    </>
  );
}
it('selects saved locale before the primary browser language', () => {
  expect(detectLocale('en', ['ru-RU'])).toBe('en');
  expect(detectLocale(null, ['ru-RU'])).toBe('ru');
  expect(detectLocale('xx', ['de-DE', 'ru'])).toBe('en');
});
it('switches both directions, updates document language and remembers the explicit choice', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('ru');
  const write = vi.spyOn(Storage.prototype, 'setItem');
  render(
    <I18nProvider>
      <Probe />
    </I18nProvider>,
  );
  expect(screen.getByText('Добавить получателя')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'en' } });
  expect(screen.getByText('Add recipient')).toBeInTheDocument();
  expect(document.documentElement.lang).toBe('en');
  expect(write).toHaveBeenCalledWith(LOCALE_KEY, 'en');
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ru' } });
  expect(screen.getByText('Добавить получателя')).toBeInTheDocument();
});
it('works when storage access is blocked and does not persist automatic detection', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  const write = vi
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('blocked');
    });
  render(
    <I18nProvider>
      <Probe />
    </I18nProvider>,
  );
  expect(write).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ru' } });
  expect(screen.getByText('Добавить получателя')).toBeInTheDocument();
});
