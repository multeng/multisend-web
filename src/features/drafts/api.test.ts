import { expect, it, vi } from 'vitest';
import { draftKeys, draftsApi } from './api';

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  address: '0:' + '1'.repeat(64),
  network: '-3' as const,
};
const draft = {
  id: user.id,
  name: 'Payroll',
  version: '1',
  createdAt: '2026-10-27T12:00:00Z',
  updatedAt: '2026-10-27T12:00:00Z',
  recipients: [
    { address: 'unfinished', amount: '0.100000000000000001', comment: '' },
  ],
};
it('scopes private keys to the authenticated user, wallet and network', () => {
  expect(draftKeys.list(user)).toEqual([
    'private',
    user.id,
    user.address,
    '-3',
    'drafts',
  ]);
  expect(draftKeys.detail(user, draft.id)).not.toEqual(
    draftKeys.detail({ ...user, id: 'another' }, draft.id),
  );
});
it('accepts API Unicode code-point bounds for names and recipient text', async () => {
  const name = '😀'.repeat(120);
  const response = {
    ...draft,
    name,
    recipients: [
      {
        address: '😀'.repeat(128),
        amount: '😀'.repeat(128),
        comment: '😀'.repeat(500),
      },
    ],
  };
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(Response.json({ items: [response] }))
      .mockResolvedValueOnce(Response.json(response)),
  );
  await expect(
    draftsApi.list(new AbortController().signal),
  ).resolves.toMatchObject({ items: [{ name }] });
  await expect(
    draftsApi.get(draft.id, new AbortController().signal),
  ).resolves.toMatchObject({ name, recipients: response.recipients });
});
it('preserves exact amount strings and rejects numeric server amounts', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json(draft));
  vi.stubGlobal('fetch', fetcher);
  expect(
    (await draftsApi.get(draft.id, new AbortController().signal)).recipients[0]
      ?.amount,
  ).toBe('0.100000000000000001');
  fetcher.mockResolvedValue(
    Response.json({
      ...draft,
      recipients: [{ ...draft.recipients[0], amount: 0.1 }],
    }),
  );
  await expect(
    draftsApi.get(draft.id, new AbortController().signal),
  ).rejects.toThrow();
});
it('sends version and CSRF with writes and carries cancellation', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(Response.json({ ...draft, version: '2' }));
  vi.stubGlobal('fetch', fetcher);
  await draftsApi.update(
    draft.id,
    { name: 'new', version: '1', recipients: draft.recipients },
    'csrf',
    new AbortController().signal,
  );
  const options = fetcher.mock.calls[0]![1];
  expect(options.method).toBe('PUT');
  expect(options.headers['X-CSRF-Token']).toBe('csrf');
  expect(JSON.parse(options.body).version).toBe('1');
  expect(options.signal).toBeInstanceOf(AbortSignal);
});
