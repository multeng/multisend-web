import { expect, it, vi } from 'vitest';
import { preparePayout } from './api';
import { input, report } from './fixtures.test-data';
it('sends explicit preparation with CSRF and exact strings', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(report)));
  vi.stubGlobal('fetch', fetch);
  const signal = new AbortController().signal;
  await expect(preparePayout(input, 'csrf', signal)).resolves.toEqual(report);
  expect(fetch.mock.calls[0]?.[0]).toBe('/api/payouts/prepare');
  expect(fetch.mock.calls[0]?.[1]).toMatchObject({
    method: 'POST',
    cache: 'no-store',
    body: JSON.stringify(input),
    headers: { 'X-CSRF-Token': 'csrf' },
  });
});
it.each([
  { executable: true },
  { errors: ['invalid_amount'] },
  { serviceFeeNano: '1' },
  { totalNano: '2' },
  { parts: [{ firstRecipient: 0, recipientCount: 1, totalNano: '1' }] },
  { maxMessages: 1 },
  { address: '0:' + 'f'.repeat(64) },
  { balanceStatus: 'sufficient' },
])('rejects unsafe or mismatched response %j', async (change) => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ...report, ...change })),
      ),
  );
  await expect(
    preparePayout(input, 'csrf', new AbortController().signal),
  ).rejects.toThrow();
});

it('preserves documented method_not_allowed errors', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ error: { code: 'method_not_allowed' } }),
          { status: 405 },
        ),
      ),
  );
  await expect(
    preparePayout(input, 'csrf', new AbortController().signal),
  ).rejects.toMatchObject({ status: 405, code: 'method_not_allowed' });
});
