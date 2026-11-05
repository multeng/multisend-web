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
import { QuotePanel } from './QuotePanel';
import { quoteInput, quoteReport } from './quote-fixtures.test-data';

const session = {
  authenticated: true as const,
  csrfToken: 'csrf',
  user: { id: 'u', address: quoteInput.address, network: '-3' as const },
};
function setup() {
  const controller = { logout: vi.fn() } as unknown as AuthController;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const tree = (input = quoteInput, user = session) => (
    <Theme>
      <QueryClientProvider client={client}>
        <QuotePanel input={input} session={user} controller={controller} />
      </QueryClientProvider>
    </Theme>
  );
  const view = render(tree());
  return { view, tree, controller, client, event: userEvent.setup() };
}
const button = () => screen.getByRole('button', { name: 'Рассчитать расходы' });

it('requests costs only explicitly and shows exact fees, provisional reserve and deficit', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(quoteReport())));
  vi.stubGlobal('fetch', fetch);
  const { event, client } = setup();
  expect(fetch).not.toHaveBeenCalled();
  await event.click(button());
  await screen.findByText('9007199.264740996 TON');
  expect(screen.getByText('0.009999998 TON')).toBeInTheDocument();
  expect(screen.getByText('0.000000003 TON')).toBeInTheDocument();
  expect(
    screen.getByText(
      'Резерв — временный запас native-v1, не комиссия и не гарантия стоимости.',
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText('Частей / отдельных запросов подписи: 1'),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Отправить' }),
  ).not.toBeInTheDocument();
  expect(
    JSON.stringify(
      client
        .getQueryCache()
        .getAll()
        .map((q) => q.queryKey),
    ),
  ).not.toContain('csrf');
});

it('cancels bounce changes and ignores late results without automatic retry', async () => {
  let resolve!: (r: Response) => void;
  const fetch = vi.fn().mockImplementation(
    () =>
      new Promise<Response>((r) => {
        resolve = r;
      }),
  );
  vi.stubGlobal('fetch', fetch);
  const { event } = setup();
  await event.click(button());
  const signal = fetch.mock.calls[0]![1].signal as AbortSignal;
  await event.click(
    screen.getByRole('checkbox', {
      name: 'Возвращать перевод при ошибке получателя (bounce)',
    }),
  );
  await waitFor(() => expect(signal.aborted).toBe(true));
  resolve(new Response(JSON.stringify(quoteReport())));
  await act(async () => {
    await Promise.resolve();
  });
  expect(screen.queryByText('9007199.264740996 TON')).not.toBeInTheDocument();
  expect(fetch).toHaveBeenCalledOnce();
  await event.click(button());
  expect(JSON.parse(fetch.mock.calls[1]![1].body as string).bounce).toEqual([
    true,
  ]);
});

it.each(['amount', 'comment', 'rows', 'capacity', 'identity'])(
  'clears a completed estimate when %s changes',
  async (kind) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(quoteReport()))),
    );
    const { event, view, tree } = setup();
    await event.click(button());
    await screen.findByText('9007199.264740996 TON');
    const input = structuredClone(quoteInput);
    let nextSession = session;
    switch (kind) {
      case 'amount':
        input.recipients[0]!.amount = '2';
        break;
      case 'comment':
        input.recipients[0]!.comment = 'changed';
        break;
      case 'rows':
        input.recipients.unshift({ ...input.recipients[0]! });
        break;
      case 'capacity':
        input.maxMessages = 1;
        break;
      case 'identity':
        nextSession = { ...session, user: { ...session.user, id: 'other' } };
        break;
    }
    view.rerender(tree(input, nextSession));
    expect(screen.queryByText('9007199.264740996 TON')).not.toBeInTheDocument();
    view.rerender(tree());
    expect(screen.queryByText('9007199.264740996 TON')).not.toBeInTheDocument();
  },
);

it('invalidates on reordering distinct rows and never revives a quote on change-back', async () => {
  const first = {
    ...quoteInput,
    maxMessages: 1,
    recipients: [
      { ...quoteInput.recipients[0]!, amount: '1', comment: 'first' },
      { ...quoteInput.recipients[0]!, amount: '2', comment: 'second' },
    ],
  };
  const report = {
    ...quoteReport(),
    maxMessages: 1,
    balanceNano: '4000000000',
    transferTotalNano: '3000000000',
    requiredBalanceNano: '3010000003',
    deficitNano: '0',
    parts: [
      {
        firstRecipient: 0,
        recipientCount: 1,
        totalNano: '1000000000',
        estimatedNetworkFeeNano: '1',
      },
      {
        firstRecipient: 1,
        recipientCount: 1,
        totalNano: '2000000000',
        estimatedNetworkFeeNano: '2',
      },
    ],
  };
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(report))),
  );
  const { view, tree, event } = setup();
  view.rerender(tree(first));
  await event.click(button());
  await screen.findByText('3.010000003 TON');
  view.rerender(
    tree({ ...first, recipients: [...first.recipients].reverse() }),
  );
  expect(screen.queryByText('3.010000003 TON')).not.toBeInTheDocument();
  view.rerender(tree(first));
  expect(screen.queryByText('3.010000003 TON')).not.toBeInTheDocument();
});

it.each([
  'quote_busy',
  'quote_unavailable',
  'insufficient_balance',
  'simulation_incomplete',
  'unsupported_wallet',
])('shows %s without fabricated costs or background refetch', async (code) => {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ error: { code } }), { status: 503 }),
    );
  vi.stubGlobal('fetch', fetch);
  const { event } = setup();
  await event.click(button());
  await screen.findByRole('alert');
  act(() => window.dispatchEvent(new Event('focus')));
  act(() => window.dispatchEvent(new Event('online')));
  expect(fetch).toHaveBeenCalledOnce();
  expect(screen.queryByText('9007199.264740996 TON')).not.toBeInTheDocument();
});

it('expires on focus and requires an explicit recheck', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(quoteReport()))),
  );
  const { event } = setup();
  await event.click(button());
  await screen.findByText('9007199.264740996 TON');
  vi.spyOn(performance, 'now').mockReturnValue(1000000);
  act(() => window.dispatchEvent(new Event('focus')));
  await screen.findByText('Оценка устарела. Рассчитайте расходы заново.');
  expect(screen.queryByText('9007199.264740996 TON')).not.toBeInTheDocument();
});

it('rearms an early fractional expiry timer', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  const clock = vi.spyOn(performance, 'now').mockReturnValue(0);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(quoteReport()))),
  );
  try {
    setup();
    await act(async () => {
      fireEvent.click(button());
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText('9007199.264740996 TON')).toBeInTheDocument();
    clock.mockReturnValue(24999.8);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(25000);
    });
    clock.mockReturnValue(25001);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2);
    });
    expect(
      screen.getByText('Оценка устарела. Рассчитайте расходы заново.'),
    ).toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});

it('clears authentication on 401', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'unauthorized' } }), {
        status: 401,
      }),
    ),
  );
  const { event, controller } = setup();
  await event.click(button());
  await waitFor(() => expect(controller.logout).toHaveBeenCalledOnce());
});

it('explains unsupported capacity without an upload', () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const { view, tree } = setup();
  view.rerender(tree({ ...quoteInput, maxMessages: 5 }));
  expect(
    screen.queryByRole('button', { name: 'Рассчитать расходы' }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText(
      'Оценка доступна только для активного V4R2 с лимитом 1–4 сообщения.',
    ),
  ).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
