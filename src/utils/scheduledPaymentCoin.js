/**
 * Scheduled payments store chain + asset, not a coin id. Every place that
 * has to match a payment to a wallet coin (edit screen, reminder handler,
 * the list's current-token filter and icon lookup) goes through the same
 * key so the predicate can't drift.
 */
export const getScheduledPaymentAssetKey = (chain, symbol, contractAddress) =>
  `${chain || ''}|${symbol || ''}|${contractAddress || ''}`;

export const getAssetKeyForPayment = payment =>
  getScheduledPaymentAssetKey(
    payment?.chain,
    payment?.asset?.symbol,
    payment?.asset?.contractAddress,
  );

export const getAssetKeyForCoin = coin =>
  getScheduledPaymentAssetKey(
    coin?.chain_name,
    coin?.symbol,
    coin?.contractAddress,
  );

/** Map<assetKey, coin> over the wallet's active coins, for O(1) per-row lookup. */
export const buildCoinMapForScheduledPayments = coins => {
  const map = new Map();
  (Array.isArray(coins) ? coins : []).forEach(coin => {
    if (coin?.isInWallet) {
      map.set(getAssetKeyForCoin(coin), coin);
    }
  });
  return map;
};

/** The wallet coin a scheduled payment was created for, or undefined. */
export const findCoinForScheduledPayment = (wallet, payment) => {
  const key = getAssetKeyForPayment(payment);
  return wallet?.coins?.find(
    c => c?.isInWallet && getAssetKeyForCoin(c) === key,
  );
};
