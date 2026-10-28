import { expect, it, vi } from 'vitest';
import { readBalance } from './balance';
const address = '0:' + '0'.repeat(64);
const fixture = () => ({
  address,
  network: '-3',
  balanceNano: '9007199254740993',
  accountStatus: 'ACTIVE',
  blockSeqno: 123,
  blockRootHash: 'a'.repeat(64),
  blockTime: 1800000000,
  checkedAt: 1800000003,
  expiresAt: 1800000030,
  executable: false,
  networkFeeStatus: 'not_estimated',
});
it('reads only the authenticated endpoint and preserves exact nano strings', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(fixture())));
  vi.stubGlobal('fetch', fetch);
  const result = await readBalance(address, new AbortController().signal);
  expect(result.report.balanceNano).toBe('9007199254740993');
  expect(result.validUntil).toBeGreaterThan(performance.now());
  expect(fetch.mock.calls[0]?.[0]).toBe('/api/payouts/balance');
  expect(fetch.mock.calls[0]?.[1]).toMatchObject({
    method: 'GET',
    cache: 'no-store',
    credentials: 'same-origin',
  });
  expect(fetch.mock.calls[0]?.[1].body).toBeUndefined();
});
it.each([
  { address: '0:' + '1'.repeat(64) },
  { network: '-239' },
  { balanceNano: '-1' },
  { balanceNano: (1n << 120n).toString() },
  { balanceNano: 1 },
  { accountStatus: 'UNKNOWN' },
  { accountStatus: 'NON_EXIST' },
  { blockRootHash: 'bad' },
  { blockSeqno: 0 },
  { checkedAt: 1800000030 },
  { checkedAt: 1799999994 },
  { expiresAt: 1800000031 },
  { expiresAt: 1800000002 },
  { executable: true },
  { networkFeeStatus: 'estimated' },
])('rejects contradictory or unsafe snapshot %j', async (patch) => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ...fixture(), ...patch })),
      ),
  );
  await expect(
    readBalance(address, new AbortController().signal),
  ).rejects.toThrow();
});
it('does not refresh lifetime for a slow response', async () => {
  vi.spyOn(performance, 'now').mockReturnValueOnce(0).mockReturnValue(27000);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(fixture()))),
  );
  await expect(
    readBalance(address, new AbortController().signal),
  ).rejects.toThrow('expired');
});
