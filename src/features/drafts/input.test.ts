import { expect, it } from 'vitest';
import { draftInputError } from './input';
it('allows incomplete draft amounts while bounding the actual encoded request', () => {
  expect(
    draftInputError({
      name: 'Draft',
      version: '1',
      recipients: [{ address: 'unfinished', amount: '1.', comment: '' }],
    }),
  ).toBeNull();
  expect(
    draftInputError({
      name: 'Draft',
      version: '1',
      recipients: Array.from({ length: 200 }, () => ({
        address: '0:' + '0'.repeat(64),
        amount: '1',
        comment: '😀'.repeat(500),
      })),
    }),
  ).toContain('64');
  expect(
    draftInputError({
      name: 'Draft',
      recipients: [{ address: '', amount: '', comment: 'x'.repeat(501) }],
    }),
  ).not.toBeNull();
});
