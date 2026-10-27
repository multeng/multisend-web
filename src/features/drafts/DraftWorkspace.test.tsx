import { expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { Theme } from '@radix-ui/themes';
import { createQueryClient } from '../../app/query-client';
import { AuthContext } from '../auth/context';
import { AuthController } from '../auth/controller';
import { DraftWorkspace } from './DraftWorkspace';

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  address: '0:' + '1'.repeat(64),
  network: '-3' as const,
};
const record = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Payroll',
  version: '1',
  createdAt: '2026-10-27T12:00:00Z',
  updatedAt: '2026-10-27T12:00:00Z',
  recipients: [
    { address: 'in progress', amount: '0.100000000000000001', comment: '' },
  ],
};
async function setup(conflict = false) {
  const client = createQueryClient();
  const controller = new AuthController(null, () => client.clear(), {
    session: vi
      .fn()
      .mockResolvedValueOnce({
        authenticated: true,
        csrfToken: 'a'.repeat(43),
        user,
      })
      .mockResolvedValue({ authenticated: false, csrfToken: 'b'.repeat(43) }),
    logout: vi.fn().mockResolvedValue(undefined),
    challenge: vi.fn(),
    verify: vi.fn(),
  });
  await controller.start();
  const fetcher = vi.fn(async (path: string, options?: RequestInit) => {
    if (options?.method === 'PUT')
      return conflict
        ? Response.json({ error: { code: 'conflict' } }, { status: 409 })
        : Response.json({
            ...record,
            ...JSON.parse(String(options.body)),
            version: '2',
          });
    if (options?.method === 'POST')
      return Response.json(
        {
          ...record,
          name: JSON.parse(String(options.body)).name,
          recipients: [],
        },
        { status: 201 },
      );
    if (options?.method === 'DELETE')
      return new Response(null, { status: 204 });
    return Response.json(path === '/api/drafts' ? { items: [record] } : record);
  });
  vi.stubGlobal('fetch', fetcher);
  render(
    <QueryClientProvider client={client}>
      <Theme>
        <AuthContext value={controller}>
          <DraftWorkspace />
        </AuthContext>
      </Theme>
    </QueryClientProvider>,
  );
  return { fetcher, controller, client, event: userEvent.setup() };
}
it('opens a private draft and saves its name without altering exact recipients', async () => {
  const { event, fetcher } = await setup();
  await event.click(
    await screen.findByRole('button', { name: 'Открыть Payroll' }),
  );
  const name = await screen.findByLabelText('Название черновика');
  await event.clear(name);
  await event.type(name, 'Updated');
  await event.click(screen.getByRole('button', { name: 'Сохранить название' }));
  await waitFor(() =>
    expect(fetcher.mock.calls.some(([, o]) => o?.method === 'PUT')).toBe(true),
  );
  const sent = fetcher.mock.calls.find(([, o]) => o?.method === 'PUT')![1]!;
  expect(JSON.parse(String(sent.body))).toEqual({
    name: 'Updated',
    version: '1',
    recipients: record.recipients,
  });
});
it('removes private data on logout and ignores a late save response', async () => {
  const { event, fetcher, controller, client } = await setup();
  await event.click(
    await screen.findByRole('button', { name: 'Открыть Payroll' }),
  );
  await screen.findByLabelText('Название черновика');
  let resolve!: (response: Response) => void;
  fetcher.mockImplementationOnce(
    () =>
      new Promise<Response>((r) => {
        resolve = r;
      }),
  );
  await event.click(screen.getByRole('button', { name: 'Сохранить название' }));
  await act(async () => {
    await controller.logout();
  });
  expect(
    screen.queryByRole('heading', { name: 'Личные черновики' }),
  ).not.toBeInTheDocument();
  await act(async () => {
    resolve(Response.json({ ...record, version: '2' }));
    await Promise.resolve();
  });
  expect(
    client.getQueryCache().findAll({ queryKey: ['private'] }),
  ).toHaveLength(0);
});
it('keeps unsaved input on a version conflict and offers explicit reload', async () => {
  const { event } = await setup(true);
  await event.click(
    await screen.findByRole('button', { name: 'Открыть Payroll' }),
  );
  const name = await screen.findByLabelText('Название черновика');
  await event.clear(name);
  await event.type(name, 'Keep this');
  await event.click(screen.getByRole('button', { name: 'Сохранить название' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('изменён');
  expect(name).toHaveValue('Keep this');
  expect(
    screen.getByRole('button', { name: 'Загрузить последнюю версию' }),
  ).toBeEnabled();
});
it('creates an empty draft and requires confirmation before deleting', async () => {
  const { event, fetcher } = await setup();
  await event.type(
    screen.getByLabelText('Название нового черновика'),
    'New list',
  );
  await event.click(screen.getByRole('button', { name: 'Создать черновик' }));
  await screen.findByLabelText('Название черновика');
  expect(
    fetcher.mock.calls.find(([, o]) => o?.method === 'POST')?.[1]?.body,
  ).toBe(JSON.stringify({ name: 'New list', recipients: [] }));
  await event.click(screen.getByRole('button', { name: 'Удалить черновик' }));
  expect(fetcher.mock.calls.some(([, o]) => o?.method === 'DELETE')).toBe(
    false,
  );
  await event.click(
    screen.getByRole('button', { name: 'Удалить окончательно' }),
  );
  await waitFor(() =>
    expect(fetcher.mock.calls.some(([, o]) => o?.method === 'DELETE')).toBe(
      true,
    ),
  );
});
