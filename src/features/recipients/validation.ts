import type { DraftRecipient } from '../../api/generated';

export const MAX_RECIPIENTS = 200;
const SCALE = 1_000_000_000n;
const LIMIT = 1n << 120n;
export const textLength = (value: string) => Array.from(value).length;

export function parseAmount(value: string): bigint | null {
  if (value.length > 128 || !/^(0|[1-9][0-9]*)(\.[0-9]{1,9})?$/.test(value))
    return null;
  const [whole, fraction = ''] = value.split('.');
  const amount = BigInt(whole!) * SCALE + BigInt(fraction.padEnd(9, '0'));
  return amount > 0n && amount < LIMIT ? amount : null;
}
export function formatAmount(value: bigint): string {
  const fraction = (value % SCALE)
    .toString()
    .padStart(9, '0')
    .replace(/0+$/, '');
  return `${value / SCALE}${fraction ? '.' + fraction : ''}`;
}

/** TEP2 CRC16-CCITT, initial value zero, polynomial0x1021. No signing/crypto. */
function checksum(bytes: Uint8Array): number {
  let crc = 0;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++)
      crc = ((crc << 1) ^ (crc & 0x8000 ? 0x1021 : 0)) & 0xffff;
  }
  return crc;
}
export function parseAddress(
  value: string,
): { canonical: string; testOnly: boolean } | null {
  if (/^(0|-1):[0-9a-fA-F]{64}$/.test(value))
    return { canonical: value.toLowerCase(), testOnly: false };
  if (!/^[A-Za-z0-9+/_-]{48}$/.test(value)) return null;
  try {
    const bytes = Uint8Array.from(
      atob(value.replace(/-/g, '+').replace(/_/g, '/')),
      (char) => char.charCodeAt(0),
    );
    if (
      bytes.length !== 36 ||
      checksum(bytes.slice(0, 34)) !== ((bytes[34]! << 8) | bytes[35]!)
    )
      return null;
    if (
      ![0x11, 0x51].includes(bytes[0]! & 0x7f) ||
      ![0, 255].includes(bytes[1]!)
    )
      return null;
    const hash = Array.from(bytes.slice(2, 34), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('');
    return {
      canonical: `${bytes[1] === 255 ? -1 : 0}:${hash}`,
      testOnly: Boolean(bytes[0]! & 0x80),
    };
  } catch {
    return null;
  }
}

export function validateRecipients(recipients: DraftRecipient[]) {
  const parsed = recipients.map((row) => parseAddress(row.address));
  const counts = new Map<string, number>();
  for (const address of parsed)
    if (address)
      counts.set(address.canonical, (counts.get(address.canonical) ?? 0) + 1);
  let total = 0n;
  const rows = recipients.map((row, index) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const address = parsed[index];
    if (!address)
      errors.push(
        'Укажите корректный TON-адрес (с контрольной суммой или raw 0:/-1:).',
      );
    if (address && !address.testOnly)
      warnings.push(
        'Адрес не содержит отметки Testnet. Проверьте сеть и получателя самостоятельно.',
      );
    const amount = parseAmount(row.amount);
    if (amount === null)
      errors.push(
        'Сумма должна быть больше нуля: точка, до 9 знаков после неё, без пробелов и округления.',
      );
    else total += amount;
    if (textLength(row.comment) > 500)
      errors.push('Комментарий: не более 500 символов.');
    const duplicate = Boolean(
      address && (counts.get(address.canonical) ?? 0) > 1,
    );
    return {
      errors,
      warnings,
      duplicate,
      canonical: address?.canonical ?? null,
    };
  });
  const errors: string[] = [];
  if (recipients.length === 0)
    errors.push('Добавьте хотя бы одного получателя.');
  if (recipients.length > MAX_RECIPIENTS)
    errors.push('Не более 200 получателей.');
  if (total >= LIMIT)
    errors.push('Общая сумма превышает допустимый диапазон TON.');
  return {
    rows,
    errors,
    total,
    valid: errors.length === 0 && rows.every((row) => row.errors.length === 0),
  };
}
