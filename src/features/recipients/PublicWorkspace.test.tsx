import { expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Theme } from '@radix-ui/themes';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '../../app/query-client';
import { AuthController } from '../auth/controller';
import { AuthContext } from '../auth/context';
import { PublicWorkspace } from './PublicWorkspace';

async function setup(authenticated = false) {
  const controller = new AuthController(null, () => {}, {
    session: vi.fn().mockResolvedValue(
      authenticated
        ? {
            authenticated: true,
            csrfToken: 'a'.repeat(43),
            user: {
              id: '11111111-1111-4111-8111-111111111111',
              address: '0:' + '1'.repeat(64),
              network: '-3',
            },
          }
        : { authenticated: false, csrfToken: 'a'.repeat(43) },
    ),
    logout: vi.fn(),
    verify: vi.fn(),
    challenge: vi.fn(),
  });
  await controller.start();
  const fetcher = vi.fn().mockResolvedValue(
    Response.json(
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Saved list',
        recipients: [],
        version: '1',
        createdAt: '2026-10-27T12:00:00Z',
        updatedAt: '2026-10-27T12:00:00Z',
      },
      { status: 201 },
    ),
  );
  vi.stubGlobal('fetch', fetcher);
  render(
    <QueryClientProvider client={createQueryClient()}>
      <Theme>
        <AuthContext value={controller}>
          <PublicWorkspace />
        </AuthContext>
      </Theme>
    </QueryClientProvider>,
  );
  return { event: userEvent.setup(), fetcher };
}
it('prepares and previews a list without API calls or browser persistence', async () => {
  const { event, fetcher } = await setup();
  const storage = vi.spyOn(Storage.prototype, 'setItem');
  await event.click(
    screen.getByRole('button', { name: 'Попробовать на примере' }),
  );
  await event.click(screen.getByRole('button', { name: 'Проверить список' }));
  expect(
    screen.getByRole('region', { name: 'Предпросмотр списка' }),
  ).toHaveTextContent('0.100000001 TON');
  expect(fetcher).not.toHaveBeenCalled();
  expect(storage).not.toHaveBeenCalled();
});
it('uploads a local list only after explicit authenticated save', async () => {
  const { event, fetcher } = await setup(true);
  await event.click(
    screen.getByRole('button', { name: 'Попробовать на примере' }),
  );
  await event.type(
    screen.getByLabelText('Название для сохранения списка'),
    'Saved list',
  );
  expect(fetcher).not.toHaveBeenCalled();
  await event.click(
    screen.getByRole('button', { name: 'Сохранить список в личные черновики' }),
  );
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  const [path, options] = fetcher.mock.calls[0]!;
  expect(path).toBe('/api/drafts');
  expect(options.method).toBe('POST');
  expect(JSON.parse(options.body).recipients).toHaveLength(2);
  expect(
    await screen.findByText(/Личный черновик сохранён/),
  ).toBeInTheDocument();
});

it('freezes the saved snapshot in flight and clears success when local rows change', async () => {
  const { event, fetcher } = await setup(true);
  const response = await fetcher.getMockImplementation()!();
  let resolve!: (response: Response) => void;
  fetcher.mockImplementationOnce(
    () =>
      new Promise<Response>((r) => {
        resolve = r;
      }),
  );
  await event.click(
    screen.getByRole('button', { name: 'Попробовать на примере' }),
  );
  await event.type(
    screen.getByLabelText('Название для сохранения списка'),
    'Saved list',
  );
  await event.click(
    screen.getByRole('button', { name: 'Сохранить список в личные черновики' }),
  );
  expect(screen.getByLabelText('Сумма получателя 1, TON')).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Попробовать на примере' }),
  ).toBeDisabled();
  await act(async () => {
    resolve(response);
  });
  expect(
    await screen.findByText(/Личный черновик сохранён/),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Сохранить список в личные черновики' }),
  ).toBeDisabled();
  await event.clear(screen.getByLabelText('Сумма получателя 1, TON'));
  expect(
    screen.queryByText(/Личный черновик сохранён/),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Сохранить список в личные черновики' }),
  ).toBeEnabled();
});
