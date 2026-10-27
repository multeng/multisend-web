import { expect, it } from 'vitest';
import {
  formatAmount,
  parseAmount,
  parseAddress,
  validateRecipients,
} from './validation';
import vectors from './address-vectors.json';

it('matches independent tonutils-go vectors across flags and workchains', () => {
  for (const vector of vectors) {
    expect(parseAddress(vector.friendly)).toEqual({
      canonical: vector.raw,
      testOnly: vector.testOnly,
    });
    expect(
      parseAddress(vector.friendly.replace(/-/g, '+').replace(/_/g, '/')),
    ).toEqual({ canonical: vector.raw, testOnly: vector.testOnly });
  }
});

const raw = '0:' + '0'.repeat(64);
const friendly = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';

it('calculates nanotons and totals without floating point or rounding', () => {
  expect(parseAmount('0.000000001')).toBe(1n);
  expect(parseAmount('9007199254740993.000000001')).toBe(
    9007199254740993000000001n,
  );
  expect(formatAmount(1000000001n)).toBe('1.000000001');
  expect(formatAmount(2000000000n)).toBe('2');
  expect(
    validateRecipients([
      { address: raw, amount: '0.1', comment: '' },
      { address: raw, amount: '0.2', comment: '' },
    ]).total,
  ).toBe(300000000n);
});
it.each([
  '',
  '0',
  '-1',
  '+1',
  '1e3',
  '1,2',
  ' 1',
  '1 ',
  '1.',
  '01',
  '0.0000000001',
  '1'.repeat(129),
  (1n << 120n).toString(),
])('rejects ambiguous/nonpositive/out-of-range amount %s', (value) => {
  expect(parseAmount(value)).toBeNull();
});
it('validates checksum and canonicalizes friendly and raw variants', () => {
  expect(parseAddress(friendly)?.canonical).toBe(raw);
  expect(parseAddress(raw)?.canonical).toBe(raw);
  expect(parseAddress(friendly.slice(0, -1) + 'd')).toBeNull();
  expect(parseAddress('0x:' + '0'.repeat(64))).toBeNull();
  expect(parseAddress('0:' + 'z'.repeat(64))).toBeNull();
  expect(parseAddress(raw + ':extra')).toBeNull();
  expect(parseAddress('1:' + '0'.repeat(64))).toBeNull();
});
it('warns about canonical duplicates without merging and keeps original input', () => {
  const recipients = [
    { address: raw, amount: '1', comment: '' },
    { address: friendly, amount: '2', comment: '' },
  ];
  const result = validateRecipients(recipients);
  expect(result.rows.map((row) => row.duplicate)).toEqual([true, true]);
  expect(result.rows.every((row) => row.errors.length === 0)).toBe(true);
  expect(result.total).toBe(3000000000n);
  expect(recipients[1]!.address).toBe(friendly);
  expect(result.rows[0]!.warnings.length).toBeGreaterThan(0);
});
it('rejects long comments and excessive total while preserving unfinished input', () => {
  expect(
    validateRecipients([
      { address: raw, amount: '1', comment: 'a'.repeat(501) },
    ]).rows[0]!.errors.length,
  ).toBeGreaterThan(0);
  const amount = formatAmount((1n << 120n) - 1n);
  expect(
    validateRecipients([
      { address: raw, amount, comment: '' },
      { address: raw, amount, comment: '' },
    ]).errors.length,
  ).toBeGreaterThan(0);
});
