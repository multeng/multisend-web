import { z } from 'zod';
import type { BalanceReport } from '../../api/generated';
import { request } from '../../api/request';

const timestamp = z.number().int().min(1).max(4294967295);
const schema: z.ZodType<BalanceReport> = z
  .object({
    address: z.string().regex(/^(0|-1):[0-9a-f]{64}$/),
    network: z.literal('-3'),
    balanceNano: z
      .string()
      .regex(/^(0|[1-9][0-9]*)$/)
      .max(37),
    accountStatus: z.enum(['ACTIVE', 'UNINIT', 'FROZEN', 'NON_EXIST']),
    blockSeqno: z.number().int().min(1).max(4294967295),
    blockRootHash: z.string().regex(/^[0-9a-f]{64}$/),
    blockTime: timestamp,
    checkedAt: timestamp,
    expiresAt: timestamp,
    executable: z.literal(false),
    networkFeeStatus: z.literal('not_estimated'),
  })
  .strict();
export type BalanceResult = { report: BalanceReport; validUntil: number };
export async function readBalance(
  address: string,
  signal: AbortSignal,
): Promise<BalanceResult> {
  const started = performance.now();
  const report = await request('/api/payouts/balance', schema, { signal });
  const age = report.checkedAt - report.blockTime;
  if (
    report.address !== address ||
    BigInt(report.balanceNano) >= 1n << 120n ||
    (report.accountStatus === 'NON_EXIST' && report.balanceNano !== '0') ||
    age < -5 ||
    age >= 30 ||
    report.expiresAt <= report.checkedAt ||
    report.expiresAt > Math.min(report.blockTime + 30, report.checkedAt + 30)
  ) {
    throw new Error('Unexpected balance snapshot');
  }
  // Bound lifetime without trusting the browser wall clock; reserve a second
  // for the server's integer timestamp rounding and include full request time.
  const validUntil = started + (report.expiresAt - report.checkedAt - 1) * 1000;
  if (performance.now() >= validUntil)
    throw new Error('Balance snapshot expired');
  return { report, validUntil };
}
