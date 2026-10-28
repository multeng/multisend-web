import { expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Theme } from '@radix-ui/themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../auth/context';
import type { AuthController } from '../auth/controller';
import { PreparationPanel } from './PreparationPanel';
import { input, report } from './fixtures.test-data';
const session = {
  authenticated: true,
  csrfToken: 'csrf',
  user: { id: 'u', address: input.address, network: '-3' },
};
const snapshot = {
  session,
  wallet: { address: input.address, network: '-3', maxMessages: 4 },
  phase: 'idle',
  error: null,
};
function setup() {
  const controller = {
    subscribe: () => () => {},
    getSnapshot: () => snapshot,
    logout: vi.fn(),
  } as unknown as AuthController;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const tree = (rows = input.recipients) => (
    <Theme>
      <QueryClientProvider client={client}>
        <AuthContext value={controller}>
          <PreparationPanel recipients={rows} />
        </AuthContext>
      </QueryClientProvider>
    </Theme>
  );
  const view = render(tree());
  return { view, tree, event: userEvent.setup(), controller };
}
it('never uploads an anonymous preview', () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  render(
    <Theme>
      <PreparationPanel recipients={input.recipients} />
    </Theme>,
  );
  expect(fetch).not.toHaveBeenCalled();
  expect(
    screen.getByText(
      'Войдите через кошелёк для серверной проверки и плана частей.',
    ),
  ).toBeInTheDocument();
});
it('fetches only on explicit action and labels unchecked fees and balance', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(report)));
  vi.stubGlobal('fetch', fetch);
  const { event } = setup();
  expect(fetch).not.toHaveBeenCalled();
  await event.click(
    screen.getByRole('button', {
      name: 'Проверить на сервере и рассчитать части',
    }),
  );
  await screen.findByText('План частей по данным кошелька');
  expect(screen.getByText('Комиссия сервиса: 0 TON')).toBeInTheDocument();
  expect(
    screen.getByText(
      'Баланс и сетевые расходы ещё не проверены. Этот отчёт не разрешает отправку средств.',
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Отправить' }),
  ).not.toBeInTheDocument();
});
it('cancels changed input and ignores a late server response', async () => {
  let resolve!: (value: Response) => void;
  const fetch = vi.fn().mockImplementation(
    () =>
      new Promise<Response>((r) => {
        resolve = r;
      }),
  );
  vi.stubGlobal('fetch', fetch);
  const { event, view, tree } = setup();
  await event.click(
    screen.getByRole('button', {
      name: 'Проверить на сервере и рассчитать части',
    }),
  );
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  const signal = fetch.mock.calls[0]?.[1].signal as AbortSignal;
  view.rerender(tree([{ ...input.recipients[0]!, amount: '2' }]));
  await waitFor(() => expect(signal.aborted).toBe(true));
  resolve(new Response(JSON.stringify(report)));
  await waitFor(() =>
    expect(
      screen.queryByText('План частей по данным кошелька'),
    ).not.toBeInTheDocument(),
  );
  view.unmount();
});
it('hides a completed report when wallet capabilities change', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(report))),
  );
  const { event, view, tree, controller } = setup();
  await event.click(
    screen.getByRole('button', {
      name: 'Проверить на сервере и рассчитать части',
    }),
  );
  await screen.findByText('План частей по данным кошелька');
  vi.spyOn(controller, 'getSnapshot').mockReturnValue({
    ...snapshot,
    wallet: { ...snapshot.wallet, maxMessages: 1 },
  } as ReturnType<AuthController['getSnapshot']>);
  view.rerender(tree());
  expect(
    screen.queryByText('План частей по данным кошелька'),
  ).not.toBeInTheDocument();
});

it('aborts an in-flight report when its preview is closed', async () => {
  const fetch = vi
    .fn()
    .mockImplementation(() => new Promise<Response>(() => {}));
  vi.stubGlobal('fetch', fetch);
  const { event, view } = setup();
  await event.click(
    screen.getByRole('button', {
      name: 'Проверить на сервере и рассчитать части',
    }),
  );
  await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
  const signal = fetch.mock.calls[0]?.[1].signal as AbortSignal;
  view.unmount();
  await waitFor(() => expect(signal.aborted).toBe(true));
});
it('never guesses legacy or unavailable wallet capacity', () => {
  const { view, tree, controller } = setup();
  vi.spyOn(controller, 'getSnapshot').mockReturnValue({
    ...snapshot,
    wallet: { ...snapshot.wallet, maxMessages: null },
  } as ReturnType<AuthController['getSnapshot']>);
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  view.rerender(tree());
  expect(
    screen.queryByRole('button', {
      name: 'Проверить на сервере и рассчитать части',
    }),
  ).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
