/** Manual decimal keyboard input only; CSV and API amounts remain canonical. */
export function normalizeAmountInput(value: string): string {
  return /^[0-9]+,[0-9]*$/.test(value) ? value.replace(',', '.') : value;
}
