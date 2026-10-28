import { z } from 'zod';
import type { PreparationInput, PreparationReport } from '../../api/generated';
import { request } from '../../api/request';
import { parseAmount, validateRecipients } from '../recipients/validation';

const nano = z
  .string()
  .regex(/^(0|[1-9][0-9]*)$/)
  .max(40);
const row = z
  .object({
    canonical: z.string().max(128).nullable(),
    duplicate: z.boolean(),
    errors: z.array(z.string()),
    warnings: z.array(z.string()),
  })
  .strict();
const part = z
  .object({
    firstRecipient: z.number().int().min(0).max(199),
    recipientCount: z.number().int().min(1).max(200),
    totalNano: nano,
  })
  .strict();
const reportSchema: z.ZodType<PreparationReport> = z
  .object({
    address: z.string().max(128),
    network: z.literal('-3'),
    valid: z.boolean(),
    totalNano: nano,
    serviceFeeNano: z.literal('0'),
    maxMessages: z.number().int().min(1).max(255),
    rows: z.array(row).max(200),
    errors: z.array(z.string()),
    parts: z.array(part).max(200),
    executable: z.literal(false),
    balanceStatus: z.literal('not_checked'),
    networkFeeStatus: z.literal('not_estimated'),
  })
  .strict();

export async function preparePayout(
  input: PreparationInput,
  csrf: string,
  signal: AbortSignal,
): Promise<PreparationReport> {
  if (new TextEncoder().encode(JSON.stringify(input)).length > 65536)
    throw new Error('Preparation input exceeds limit');
  const report = await request('/api/payouts/prepare', reportSchema, {
    method: 'POST',
    body: input,
    csrf,
    signal,
  });
  const expected = validateRecipients(input.recipients);
  if (
    report.valid &&
    (report.errors.length > 0 ||
      report.rows.some((row) => row.errors.length > 0))
  )
    throw new Error('Contradictory preparation report');
  if (
    report.address !== input.address ||
    report.network !== input.network ||
    report.maxMessages !== input.maxMessages ||
    report.rows.length !== input.recipients.length ||
    report.totalNano !== expected.total.toString() ||
    report.valid !== expected.valid
  )
    throw new Error('Unexpected preparation report');
  for (let i = 0; i < report.rows.length; i++) {
    if (
      report.rows[i]!.canonical !== expected.rows[i]!.canonical ||
      report.rows[i]!.duplicate !== expected.rows[i]!.duplicate
    )
      throw new Error('Unexpected preparation rows');
  }
  if (!report.valid) {
    if (report.parts.length !== 0) throw new Error('Invalid report has parts');
    return report;
  }
  const parts = [];
  for (
    let start = 0;
    start < input.recipients.length;
    start += input.maxMessages
  ) {
    const rows = input.recipients.slice(start, start + input.maxMessages);
    parts.push({
      firstRecipient: start,
      recipientCount: rows.length,
      totalNano: rows
        .reduce((sum, row) => sum + parseAmount(row.amount)!, 0n)
        .toString(),
    });
  }
  if (JSON.stringify(report.parts) !== JSON.stringify(parts))
    throw new Error('Unexpected preparation parts');
  return report;
}
