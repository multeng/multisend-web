const address = '0:' + '0'.repeat(64);
export const input = {
  address,
  network: '-3' as const,
  maxMessages: 4,
  recipients: [{ address, amount: '1', comment: '' }],
};
export const report = {
  address,
  network: '-3',
  maxMessages: 4,
  valid: true,
  totalNano: '1000000000',
  serviceFeeNano: '0',
  rows: [
    {
      canonical: address,
      duplicate: false,
      errors: [],
      warnings: ['missing_testnet_flag'],
    },
  ],
  errors: [],
  parts: [{ firstRecipient: 0, recipientCount: 1, totalNano: '1000000000' }],
  executable: false,
  balanceStatus: 'not_checked',
  networkFeeStatus: 'not_estimated',
};
