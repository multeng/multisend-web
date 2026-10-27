import { expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Theme } from '@radix-ui/themes';
import type { DraftRecipient } from '../../api/generated';
import { RecipientEditor } from './RecipientEditor';

const raw = '0:' + '0'.repeat(64);
function setup(initial: DraftRecipient[] = []) {
  const change = vi.fn();
  function Harness() {
    const [value, setValue] = useState(initial);
    return (
      <Theme>
        <RecipientEditor
          value={value}
          onChange={(rows) => {
            change(rows);
            setValue(rows);
          }}
        />
      </Theme>
    );
  }
  render(<Harness />);
  return { event: userEvent.setup(), change };
}
it('adds from a details dialog, edits exact amount inline and invalidates preview', async () => {
  const { event } = setup();
  await event.click(
    screen.getByRole('button', { name: 'Добавить получателя' }),
  );
  const dialog = screen.getByRole('dialog');
  await event.type(within(dialog).getByLabelText('Адрес получателя'), raw);
  await event.type(within(dialog).getByLabelText('Сумма, TON'), '0.000000001');
  await event.click(within(dialog).getByRole('button', { name: 'Добавить' }));
  await event.click(screen.getByRole('button', { name: 'Проверить список' }));
  expect(
    screen.getByRole('region', { name: 'Предпросмотр списка' }),
  ).toHaveTextContent('0.000000001 TON');
  await event.clear(screen.getByLabelText('Сумма получателя 1, TON'));
  expect(
    screen.queryByRole('region', { name: 'Предпросмотр списка' }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Проверить список' }),
  ).toBeDisabled();
});
it('requires explicit duplicate acknowledgement and keeps both rows', async () => {
  const { event } = setup([
    { address: raw, amount: '1', comment: '' },
    { address: raw, amount: '2', comment: '' },
  ]);
  expect(
    screen.getByRole('button', { name: 'Проверить список' }),
  ).toBeDisabled();
  await event.click(
    screen.getByLabelText('Оставить повторяющиеся адреса отдельными выплатами'),
  );
  await event.click(screen.getByRole('button', { name: 'Проверить список' }));
  expect(
    screen.getByRole('region', { name: 'Предпросмотр списка' }),
  ).toHaveTextContent('3 TON');
  expect(screen.getAllByLabelText(/Сумма получателя/)).toHaveLength(2);
});
it('stages CSV and does not replace existing recipients before confirmation', async () => {
  const { event, change } = setup([{ address: raw, amount: '1', comment: '' }]);
  await event.click(
    screen.getByRole('button', { name: 'Импорт CSV / вставить' }),
  );
  const dialog = screen.getByRole('dialog');
  await event.type(
    within(dialog).getByLabelText('Текст CSV'),
    `address,amount,comment\n${raw},0.2,example`,
  );
  await event.click(
    within(dialog).getByRole('button', { name: 'Проверить импорт' }),
  );
  expect(change).not.toHaveBeenCalled();
  await event.click(
    within(dialog).getByRole('button', { name: 'Заменить список' }),
  );
  expect(change).not.toHaveBeenCalled();
  await event.click(
    within(dialog).getByLabelText('Подтверждаю замену текущего списка'),
  );
  await event.click(
    within(dialog).getByRole('button', { name: 'Заменить список' }),
  );
  expect(screen.getByLabelText('Сумма получателя 1, TON')).toHaveValue('0.2');
});
it('requires confirmation to remove a row and preserves unfinished text', async () => {
  const { event, change } = setup([
    { address: 'unfinished', amount: '0.', comment: '' },
  ]);
  await event.click(
    screen.getByRole('button', { name: 'Удалить получателя 1' }),
  );
  expect(change).not.toHaveBeenCalled();
  const dialog = screen.getByRole('dialog');
  await event.click(within(dialog).getByRole('button', { name: 'Удалить' }));
  expect(change).toHaveBeenLastCalledWith([]);
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Добавить получателя' }),
    ).toHaveFocus(),
  );
});
