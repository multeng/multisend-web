import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Theme } from '@radix-ui/themes';
import { expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n/I18nProvider';
import { LanguageSwitch } from '../../i18n/LanguageSwitch';
import { AuthContext } from '../auth/context';
import type { AuthController } from '../auth/controller';
import { RecipientEditor } from '../recipients/RecipientEditor';
import { input, report } from './fixtures.test-data';
import { quoteReport } from './quote-fixtures.test-data';

it('keeps RU/EN editor guidance accurate after a successful quote without extra uploads', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('ru');
  const quote = {
    ...quoteReport(),
    transferTotalNano: '1000000000',
    balanceNano: '4000000000',
    requiredBalanceNano: '1010000003',
    deficitNano: '0',
    parts: [
      {
        firstRecipient: 0,
        recipientCount: 1,
        totalNano: '1000000000',
        estimatedNetworkFeeNano: '3',
      },
    ],
  };
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(report)))
    .mockResolvedValueOnce(new Response(JSON.stringify(quote)));
  vi.stubGlobal('fetch', fetch);
  const snapshot = {
    session: {
      authenticated: true,
      csrfToken: 'csrf',
      user: { id: 'u', address: input.address, network: '-3' },
    },
    wallet: { address: input.address, network: '-3', maxMessages: 4 },
    phase: 'idle',
    error: null,
  };
  const controller = {
    subscribe: () => () => {},
    getSnapshot: () => snapshot,
    logout: vi.fn(),
  } as unknown as AuthController;
  render(
    <Theme>
      <I18nProvider>
        <LanguageSwitch />
        <QueryClientProvider client={new QueryClient()}>
          <AuthContext value={controller}>
            <RecipientEditor value={input.recipients} onChange={vi.fn()} />
          </AuthContext>
        </QueryClientProvider>
      </I18nProvider>
    </Theme>,
  );
  const event = userEvent.setup();
  await event.click(screen.getByRole('button', { name: 'Проверить список' }));
  await event.click(
    screen.getByRole('button', {
      name: 'Проверить на сервере и рассчитать части',
    }),
  );
  const estimate = await screen.findByRole('region', {
    name: 'Оценка расходов',
  });
  expect(fetch).toHaveBeenCalledOnce();
  await event.click(
    within(estimate).getByRole('button', { name: 'Рассчитать расходы' }),
  );
  await within(estimate).findByText('1.010000003 TON');
  expect(
    screen.queryByText(/сетевые расходы ещё не рассчитаны/),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText(/Достаточность средств для отправки ещё не проверена/),
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'en' } });
  expect(screen.getByText('1.010000003 TON')).toBeInTheDocument();
  expect(
    screen.queryByText(/network costs have not been estimated/i),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText(
      'The testnet service fee is 0 TON. Balance and network costs are checked separately after sign-in. Sending funds is unavailable.',
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      'This balance check excludes network costs and reserve. Use the separate Cost estimate section for the full calculation if the wallet is supported.',
    ),
  ).toBeInTheDocument();
  expect(screen.getByRole('checkbox')).toHaveAccessibleDescription(
    /Return is not guaranteed/,
  );
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(
    screen.queryByRole('button', { name: /^(Send|Отправить)$/ }),
  ).not.toBeInTheDocument();
});
