import { expect, it } from 'vitest';
import { english } from './catalog';
import { translate, translateMessage } from './locale';

it('preserves every interpolation placeholder in the English catalog', () => {
  for (const [source, target] of Object.entries(english)) {
    expect(target.trim()).not.toBe('');
    expect(target.match(/\{\d+\}/g) ?? []).toEqual(
      source.match(/\{\d+\}/g) ?? [],
    );
  }
});
it('updates previously rendered status strings and CSV records in both directions', () => {
  expect(translateMessage('en', 'Запись 2: нужны ровно три поля.')).toBe(
    'Record 2: exactly three fields are required.',
  );
  expect(
    translateMessage('ru', 'Record 2: exactly three fields are required.'),
  ).toBe('Запись 2: нужны ровно три поля.');
  expect(translateMessage('en', 'CSV: ошибка кавычек в записи 19.')).toBe(
    'CSV: invalid quoting in record 19.',
  );
  const englishStatus = translate(
    'en',
    'Личный черновик сохранён. Откройте его в разделе «Личные черновики».',
  );
  expect(translateMessage('ru', englishStatus)).toContain(
    'Личный черновик сохранён',
  );
});
it('does not interpret recipient names as replacement syntax', () => {
  expect(translate('en', 'Открыть {0}', { 0: '$& {0} Русское имя' })).toBe(
    'Open $& {0} Русское имя',
  );
});
