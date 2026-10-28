import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Theme } from '@radix-ui/themes';
import { expect, it, vi } from 'vitest';
import type { AuthController } from '../auth/controller';
import { BalancePanel } from './BalancePanel';
const address = '0:' + '0'.repeat(64);
const user = { id: 'u', address, network: '-3' as const };
const fixture = (balanceNano = '1', accountStatus = 'ACTIVE') => ({
  address,
  network: '-3',
  balanceNano,
  accountStatus,
  blockSeqno: 123,
  blockRootHash: 'a'.repeat(64),
  blockTime: 1800000000,
  checkedAt: 1800000003,
  expiresAt: 1800000030,
  executable: false,
  networkFeeStatus: 'not_estimated',
});
function setup() {
  const controller = { logout: vi.fn() } as unknown as AuthController;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const tree = (identity = 'first') => (
    <Theme>
      <QueryClientProvider client={client}>
        <BalancePanel
          key={identity}
          user={user}
          controller={controller}
          totalNano="9007199254740993"
          identity={identity}
        />
      </QueryClientProvider>
    </Theme>
  );
  const view = render(tree());
  return { view, tree, event: userEvent.setup(), controller };
}
it('reads on explicit action and computes exact payout-only shortfall', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(fixture())));
  vi.stubGlobal('fetch', fetch);
  const { event } = setup();
  expect(fetch).not.toHaveBeenCalled();
  await event.click(screen.getByRole('button', { name: 'Проверить баланс' }));
  await screen.findByText('0.000000001 TON');
  expect(screen.getByText('9007199.254740992 TON')).toBeInTheDocument();
  expect(
    screen.getByText(
      'Сетевые расходы не учтены. Достаточность средств для отправки ещё не проверена.',
    ),
  ).toBeInTheDocument();
});
it('does not call payout coverage enough funds for sending', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(fixture('9007199254740993'))),
      ),
  );
  const { event } = setup();
  await event.click(screen.getByRole('button', { name: 'Проверить баланс' }));
  await screen.findByText(
    'Сумма получателям покрывается балансом, без учёта сетевых расходов.',
  );
  expect(screen.queryByText('Средств достаточно')).not.toBeInTheDocument();
});
it('warns about frozen account instead of asserting spendability', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(fixture('0', 'FROZEN')))),
  );
  const { event } = setup();
  await event.click(screen.getByRole('button', { name: 'Проверить баланс' }));
  await screen.findByText(
    'Состояние кошелька не ACTIVE. Возможность отправки не подтверждена.',
  );
});
it('hides expired results and requires explicit recheck', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(fixture()))),
  );
  const { event } = setup();
  await event.click(screen.getByRole('button', { name: 'Проверить баланс' }));
  await screen.findByText('0.000000001 TON');
  vi.spyOn(performance, 'now').mockReturnValue(1000000);
  act(() => window.dispatchEvent(new Event('focus')));
  await screen.findByText('Проверка баланса устарела. Проверьте заново.');
  expect(screen.queryByText('0.000000001 TON')).not.toBeInTheDocument();
});
it('cancels and ignores obsolete results when input changes', async () => {
  const fetch = vi
    .fn()
    .mockImplementation(() => new Promise<Response>(() => {}));
  vi.stubGlobal('fetch', fetch);
  const { event, view, tree } = setup();
  await event.click(screen.getByRole('button', { name: 'Проверить баланс' }));
  await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
  const signal = fetch.mock.calls[0]?.[1].signal as AbortSignal;
  view.rerender(tree('changed'));
  await waitFor(() => expect(signal.aborted).toBe(true));
  expect(fetch).toHaveBeenCalledOnce();
});
it('reports unavailable balance without showing a synthetic zero', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ error: { code: 'service_unavailable' } }),
          { status: 503 },
        ),
      ),
  );
  const { event } = setup();
  await event.click(screen.getByRole('button', { name: 'Проверить баланс' }));
  await screen.findByRole('alert');
  expect(screen.queryByText('0 TON')).not.toBeInTheDocument();
});
it('clears revoked authentication on 401', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'unauthorized' } }), {
        status: 401,
      }),
    ),
  );
  const { event, controller } = setup();
  await event.click(screen.getByRole('button', { name: 'Проверить баланс' }));
  await waitFor(() => expect(controller.logout).toHaveBeenCalledOnce());
});

it('expires even when the timer wakes just before the monotonic deadline', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  const clock = vi.spyOn(performance, 'now').mockReturnValue(0);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(fixture()))),
  );
  try {
    setup();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Проверить баланс' }));
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText('0.000000001 TON')).toBeInTheDocument();
    clock.mockReturnValue(25999.8);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(26000);
    });
    expect(screen.getByText('0.000000001 TON')).toBeInTheDocument();
    clock.mockReturnValue(26001);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2);
    });
    expect(
      screen.getByText('Проверка баланса устарела. Проверьте заново.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('0.000000001 TON')).not.toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});
