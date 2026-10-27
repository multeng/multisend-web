import type { DraftInput } from '../../api/generated';
import { textLength } from '../recipients/validation';

export function draftInputError(
  input: DraftInput & { version?: string },
): string | null {
  if (!input.name.trim() || textLength(input.name) > 120)
    return 'Название: от 1 до 120 символов.';
  if (
    input.recipients.length > 200 ||
    input.recipients.some(
      (row) =>
        textLength(row.address) > 128 ||
        textLength(row.amount) > 128 ||
        textLength(row.comment) > 500,
    )
  )
    return 'Превышен лимит: 200 получателей, адрес/сумма 128 символов, комментарий 500.';
  if (new TextEncoder().encode(JSON.stringify(input)).length > 64 * 1024)
    return 'Черновик превышает лимит сервера 64 КиБ. Экспортируйте CSV и разделите список.';
  return null;
}
