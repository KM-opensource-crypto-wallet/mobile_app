/**
 * The wallet coin a scheduled payment was created for. Scheduled payments
 * store chain + asset, not a coin id, so both the edit screen and the
 * reminder handler resolve the coin the same way.
 */
export const findCoinForScheduledPayment = (wallet, payment) =>
  wallet?.coins?.find(
    c =>
      c.isInWallet &&
      c.chain_name === payment?.chain &&
      c.symbol === payment?.asset?.symbol &&
      (c.contractAddress || '') === (payment?.asset?.contractAddress || ''),
  );
