import { expect, it, vi } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Theme } from '@radix-ui/themes';
import type { DraftRecipient } from '../api/generated';
import { RecipientEditor } from '../features/recipients/RecipientEditor';
import { I18nProvider } from './I18nProvider';
import { LanguageSwitch } from './LanguageSwitch';

function setup() {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('ru');
  const change = vi.fn();
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  function Harness() {
    const [rows, setRows] = useState<DraftRecipient[]>([
      {
        address: '0:' + '1'.repeat(64),
        amount: '0.000000000000000001',
        comment: 'Мой комментарий',
      },
    ]);
    return (
      <I18nProvider>
        <Theme>
          <LanguageSwitch />
          <RecipientEditor
            value={rows}
            onChange={(next) => {
              change(next);
              setRows(next);
            }}
          />
        </Theme>
      </I18nProvider>
    );
  }
  render(<Harness />);
  return { event: userEvent.setup(), change, fetcher };
}
it('switches labels and existing validation without changing exact user input or making requests', () => {
  const { change, fetcher } = setup();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'en' } });
  expect(
    screen.getByRole('button', { name: 'Add recipient' }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText('Amount for recipient 1, TON')).toHaveValue(
    '0.000000000000000001',
  );
  expect(screen.getByText(/Amount must be positive/)).toBeInTheDocument();
  expect(screen.getByText('Мой комментарий')).toBeInTheDocument();
  expect(change).not.toHaveBeenCalled();
  expect(fetcher).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ru' } });
  expect(
    screen.getByRole('button', { name: 'Добавить получателя' }),
  ).toBeInTheDocument();
});
it('translates an open dialog without losing edited fields', async () => {
  const { event } = setup();
  await event.click(
    screen.getByRole('button', { name: 'Изменить получателя 1' }),
  );
  const dialog = screen.getByRole('dialog');
  await event.clear(within(dialog).getByLabelText('Комментарий'));
  await event.type(
    within(dialog).getByLabelText('Комментарий'),
    'Do not translate this',
  );
  fireEvent.change(screen.getByRole('combobox', { hidden: true }), {
    target: { value: 'en' },
  });
  expect(screen.getByRole('dialog')).toHaveTextContent('Recipient details');
  expect(within(dialog).getByLabelText('Comment')).toHaveValue(
    'Do not translate this',
  );
});
it('translates CSV errors already visible, including interpolated record numbers', async () => {
  const { event } = setup();
  await event.click(
    screen.getByRole('button', { name: 'Импорт CSV / вставить' }),
  );
  await event.type(
    screen.getByLabelText('Текст CSV'),
    'address,amount,comment\na,1',
  );
  await event.click(screen.getByRole('button', { name: 'Проверить импорт' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Запись 2');
  fireEvent.change(screen.getAllByRole('combobox', { hidden: true })[0]!, {
    target: { value: 'en' },
  });
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Record 2: exactly three fields are required.',
  );
});
