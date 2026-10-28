import { expect, it } from 'vitest';
import fixtures from './validation-v1.json';
import { validateRecipients } from './validation';

it.each(fixtures.cases)(
  'matches the public v1 conformance case: $name',
  (test) => {
    const input = structuredClone(test.recipients);
    const result = validateRecipients(input);
    expect({
      valid: result.valid,
      totalNano: result.total.toString(),
      errors: result.errors.length,
      rows: result.rows.map((row) => ({
        canonical: row.canonical,
        duplicate: row.duplicate,
        errors: row.errors.length,
        warnings: row.warnings.length,
      })),
    }).toEqual(test.expected);
    expect(input).toEqual(test.recipients);
  },
);
