import { expect, it, vi } from 'vitest';
import { quotePayout } from './quote';
import { quoteInput, quoteReport } from './quote-fixtures.test-data';

it('posts explicit ordered input with CSRF and preserves exact costs', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(quoteReport())));
  vi.stubGlobal('fetch', fetch);
  vi.spyOn(performance, 'now').mockReturnValueOnce(100).mockReturnValue(200);
  const result = await quotePayout(
    quoteInput,
    'csrf',
    new AbortController().signal,
  );
  expect(fetch).toHaveBeenCalledWith(
    '/api/payouts/quote',
    expect.objectContaining({
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      body: JSON.stringify(quoteInput),
      headers: expect.objectContaining({ 'X-CSRF-Token': 'csrf' }),
    }),
  );
  expect(result.report.requiredBalanceNano).toBe('9007199264740996');
  expect(result.report.deficitNano).toBe('9999998');
  expect(result.validUntil).toBe(25100);
});

it.each([
  { address: '0:' + 'f'.repeat(64) },
  { network: '-239' },
  { maxMessages: 1 },
  { executable: true },
  { serviceFeeNano: '1' },
  { intentHash: 'bad' },
  { reservePolicy: 'unknown' },
  { balanceNano: '01' },
  { balanceNano: (1n << 120n).toString() },
  { transferTotalNano: '9007199254740994' },
  { estimatedNetworkFeeNano: '4' },
  { reserveNano: '0' },
  { requiredBalanceNano: '9007199264740997' },
  { deficitNano: '0' },
  { parts: [] },
  {
    parts: [
      {
        firstRecipient: 1,
        recipientCount: 1,
        totalNano: '9007199254740993',
        estimatedNetworkFeeNano: '3',
      },
    ],
  },
  { estimatedAt: 1800000002 },
  { expiresAt: 1800000004 },
  { expiresAt: 1800000034 },
  { account: 'private' },
])('rejects unsafe or contradictory quote %j', async (patch) => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ...quoteReport(), ...patch })),
      ),
  );
  await expect(
    quotePayout(quoteInput, 'csrf', new AbortController().signal),
  ).rejects.toThrow();
});

it('does not extend validity for a slow response', async () => {
  vi.spyOn(performance, 'now').mockReturnValueOnce(0).mockReturnValue(25000);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(quoteReport()))),
  );
  await expect(
    quotePayout(quoteInput, 'csrf', new AbortController().signal),
  ).rejects.toThrow('expired');
});

it('validates percentage reserve and rejects a wrong per-part fee sum', async () => {
  const report = {
    ...quoteReport(),
    balanceNano: '10000000000000000',
    estimatedNetworkFeeNano: '100000001',
    reserveNano: '20000001',
    requiredBalanceNano: '9007199374740995',
    deficitNano: '0',
    parts: [
      { ...quoteReport().parts[0]!, estimatedNetworkFeeNano: '100000001' },
    ],
  };
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(report)))
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ...report,
          parts: [
            { ...report.parts[0]!, estimatedNetworkFeeNano: '100000000' },
          ],
        }),
      ),
    );
  vi.stubGlobal('fetch', fetch);
  const result = await quotePayout(
    quoteInput,
    'csrf',
    new AbortController().signal,
  );
  expect(result.report.reserveNano).toBe('20000001');
  await expect(
    quotePayout(quoteInput, 'csrf', new AbortController().signal),
  ).rejects.toThrow('costs');
});

it.each([
  'unsupported_wallet',
  'insufficient_balance',
  'simulation_incomplete',
  'quote_busy',
  'quote_unavailable',
])('preserves safe error code %s', async (code) => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: { code } }), { status: 503 }),
      ),
  );
  await expect(
    quotePayout(quoteInput, 'csrf', new AbortController().signal),
  ).rejects.toMatchObject({ status: 503, code });
});

it('rejects unsupported input and oversized uploads before fetch', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  for (const input of [
    { ...quoteInput, maxMessages: 5 },
    { ...quoteInput, bounce: [] },
    {
      ...quoteInput,
      recipients: Array.from({ length: 200 }, () => ({
        ...quoteInput.recipients[0]!,
        comment: 'x'.repeat(500),
      })),
      bounce: Array<boolean>(200).fill(false),
    },
  ])
    await expect(
      quotePayout(input, 'csrf', new AbortController().signal),
    ).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();
});
