import type { FeeQuoteInput, FeeQuoteReport } from '../../api/generated';

export const quoteInput: FeeQuoteInput = {
  address: '0:' + '0'.repeat(64),
  network: '-3',
  maxMessages: 4,
  recipients: [
    {
      address: '0:' + '1'.repeat(64),
      amount: '9007199.254740993',
      comment: 'Payroll',
    },
  ],
  bounce: [false],
};
export function quoteReport(): FeeQuoteReport {
  return {
    address: quoteInput.address,
    network: '-3',
    maxMessages: 4,
    intentHash: 'a'.repeat(64),
    reservePolicy: 'native-v1',
    checkedAt: 1800000003,
    estimatedAt: 1800000004,
    expiresAt: 1800000030,
    blockSeqno: 123,
    blockRootHash: 'b'.repeat(64),
    balanceNano: '9007199254740998',
    transferTotalNano: '9007199254740993',
    estimatedNetworkFeeNano: '3',
    serviceFeeNano: '0',
    reserveNano: '10000000',
    requiredBalanceNano: '9007199264740996',
    deficitNano: '9999998',
    parts: [
      {
        firstRecipient: 0,
        recipientCount: 1,
        totalNano: '9007199254740993',
        estimatedNetworkFeeNano: '3',
      },
    ],
    executable: false,
  };
}
