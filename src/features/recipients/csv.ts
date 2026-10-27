import Papa from 'papaparse';
import type { DraftRecipient } from '../../api/generated';
import { MAX_RECIPIENTS, textLength } from './validation';

export type Delimiter = ',' | ';' | '\t';
export const MAX_CSV_BYTES = 256 * 1024;
export function parseCSV(
  source: string,
  delimiter: Delimiter,
): DraftRecipient[] {
  if (new TextEncoder().encode(source).length > MAX_CSV_BYTES)
    throw new Error('CSV: максимум 256 КиБ.');
  const result = Papa.parse<string[]>(source.replace(/^\ufeff/, ''), {
    delimiter,
    dynamicTyping: false,
    skipEmptyLines: false,
  });
  if (result.errors.length)
    throw new Error(
      `CSV: ошибка кавычек в записи ${(result.errors[0]!.row ?? 0) + 1}.`,
    );
  const records = [...result.data];
  while (
    records.length &&
    records.at(-1)?.length === 1 &&
    records.at(-1)?.[0] === ''
  )
    records.pop();
  if (records.shift()?.join('\u0000') !== 'address\u0000amount\u0000comment')
    throw new Error(
      'Нужен заголовок address,amount,comment и выбранный разделитель.',
    );
  if (!records.length || records.length > MAX_RECIPIENTS)
    throw new Error('CSV должен содержать от 1 до 200 получателей.');
  return records.map((record, index) => {
    if (record.length !== 3)
      throw new Error(`Запись ${index + 2}: нужны ровно три поля.`);
    const [address, amount, comment] = record as [string, string, string];
    if (
      textLength(address) > 128 ||
      textLength(amount) > 128 ||
      textLength(comment) > 500
    )
      throw new Error(
        `Запись ${index + 2}: превышен лимит поля (адрес/сумма 128, комментарий 500).`,
      );
    return { address, amount, comment };
  });
}
export function exportCSV(recipients: DraftRecipient[]): string {
  return (
    '\ufeff' +
    Papa.unparse(
      {
        fields: ['address', 'amount', 'comment'],
        data: recipients.map((row) => [row.address, row.amount, row.comment]),
      },
      { escapeFormulae: true },
    )
  );
}
export function downloadCSV(
  recipients: DraftRecipient[],
  filename = 'ton-testnet-recipients.csv',
) {
  const url = URL.createObjectURL(
    new Blob([exportCSV(recipients)], { type: 'text/csv;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
