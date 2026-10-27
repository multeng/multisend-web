import { expect, it } from 'vitest';
import { exportCSV, parseCSV } from './csv';

it('parses BOM, quoted separators/newlines and exact unfinished strings', () => {
  expect(
    parseCSV(
      '\ufeffaddress;amount;comment\r\nraw;0.100000000000000001;"one;two\nthree"',
      ';',
    ),
  ).toEqual([
    {
      address: 'raw',
      amount: '0.100000000000000001',
      comment: 'one;two\nthree',
    },
  ]);
});
it.each([
  ['address,amount,comment\na,1'],
  ['address,amount,comment\na,1,c,extra'],
  ['address,amount,comment\na,1,"unterminated'],
  ['amount,address,comment\n1,a,c'],
  [
    'address,amount,comment\n' +
      Array.from({ length: 201 }, () => 'a,1,c').join('\n'),
  ],
  ['address,amount,comment\na,1,' + 'a'.repeat(501)],
  ['x'.repeat(262145)],
])('rejects invalid/oversized CSV atomically', (source) => {
  expect(() => parseCSV(source, ',')).toThrow();
});
it('supports explicit TSV without guessing decimal conventions', () => {
  expect(
    parseCSV('address\tamount\tcomment\na\t1,2\ttext', '\t')[0]!.amount,
  ).toBe('1,2');
  expect(() => parseCSV('address;amount;comment\na;1;c', ',')).toThrow();
});
it('exports quoted strings and prevents spreadsheet formulas', () => {
  const csv = exportCSV([
    { address: 'raw', amount: '0.000000001', comment: '=HYPERLINK("x")' },
  ]);
  expect(csv.startsWith('\ufeff')).toBe(true);
  expect(csv).toContain("'=HYPERLINK");
  expect(parseCSV(csv, ',')[0]!.amount).toBe('0.000000001');
});
