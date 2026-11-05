import { z } from 'zod';
import type { FeeQuoteInput, FeeQuoteReport } from '../../api/generated';
import { request } from '../../api/request';
import { parseAmount, validateRecipients } from '../recipients/validation';

export type QuoteResult = { report: FeeQuoteReport; validUntil: number };
const nano = z
  .string()
  .regex(/^(0|[1-9][0-9]*)$/)
  .max(37)
  .refine((value) => BigInt(value) < 1n << 120n);
const timestamp = z.number().int().min(1).max(4294967295);
const hash = z.string().regex(/^[0-9a-f]{64}$/);
const schema: z.ZodType<FeeQuoteReport> = z
  .object({
    address: z.string().regex(/^0:[0-9a-f]{64}$/),
    network: z.literal('-3'),
    maxMessages: z.number().int().min(1).max(4),
    intentHash: hash,
    reservePolicy: z.literal('native-v1'),
    checkedAt: timestamp,
    estimatedAt: timestamp,
    expiresAt: timestamp,
    blockSeqno: timestamp,
    blockRootHash: hash,
    balanceNano: nano,
    transferTotalNano: nano,
    estimatedNetworkFeeNano: nano,
    serviceFeeNano: z.literal('0'),
    reserveNano: nano,
    requiredBalanceNano: nano,
    deficitNano: nano,
    parts: z
      .array(
        z
          .object({
            firstRecipient: z.number().int().min(0).max(199),
            recipientCount: z.number().int().min(1).max(4),
            totalNano: nano,
            estimatedNetworkFeeNano: nano,
          })
          .strict(),
      )
      .min(1)
      .max(200),
    executable: z.literal(false),
  })
  .strict();

export async function quotePayout(
  input: FeeQuoteInput,
  csrf: string,
  signal: AbortSignal,
): Promise<QuoteResult> {
  if (
    input.maxMessages < 1 ||
    input.maxMessages > 4 ||
    input.bounce.length !== input.recipients.length ||
    !validateRecipients(input.recipients).valid ||
    new TextEncoder().encode(JSON.stringify(input)).length > 65536
  )
    throw new Error('Invalid quote input');
  const started = performance.now();
  const report = await request('/api/payouts/quote', schema, {
    method: 'POST',
    body: input,
    csrf,
    signal,
  });
  const total = validateRecipients(input.recipients).total;
  const fee = BigInt(report.estimatedNetworkFeeNano);
  const reserve = (fee + 4n) / 5n > 10000000n ? (fee + 4n) / 5n : 10000000n;
  const required = total + fee + reserve;
  const deficit =
    required > BigInt(report.balanceNano)
      ? required - BigInt(report.balanceNano)
      : 0n;
  if (
    report.address !== input.address ||
    report.network !== input.network ||
    report.maxMessages !== input.maxMessages ||
    report.transferTotalNano !== total.toString() ||
    report.reserveNano !== reserve.toString() ||
    report.requiredBalanceNano !== required.toString() ||
    report.deficitNano !== deficit.toString() ||
    BigInt(report.balanceNano) < total + fee ||
    report.estimatedAt < report.checkedAt ||
    report.expiresAt <= report.estimatedAt ||
    report.expiresAt > report.checkedAt + 30 ||
    report.parts.length !==
      Math.ceil(input.recipients.length / input.maxMessages)
  )
    throw new Error('Unexpected quote report');
  let partFees = 0n;
  for (const [index, part] of report.parts.entries()) {
    const start = index * input.maxMessages;
    const rows = input.recipients.slice(start, start + input.maxMessages);
    const partTotal = rows.reduce(
      (sum, row) => sum + parseAmount(row.amount)!,
      0n,
    );
    if (
      part.firstRecipient !== start ||
      part.recipientCount !== rows.length ||
      part.totalNano !== partTotal.toString()
    )
      throw new Error('Unexpected quote parts');
    partFees += BigInt(part.estimatedNetworkFeeNano);
  }
  if (partFees !== fee) throw new Error('Unexpected quote costs');
  // Conservatively include the whole request time and integer timestamp rounding.
  const validUntil =
    started + (report.expiresAt - report.estimatedAt - 1) * 1000;
  if (performance.now() >= validUntil) throw new Error('Quote expired');
  return { report, validUntil };
}
