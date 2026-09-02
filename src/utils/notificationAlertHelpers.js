import BigNumber from 'bignumber.js';
import {getVisibleDeriveAddresses} from 'dok-wallet-blockchain-networks/service/bitcoinHdAddress';
import {
  getCustomizePublicAddress,
  validateNumberInInput,
} from 'dok-wallet-blockchain-networks/helper';

export const MIN_USD_AMOUNT = 10;
export const MAX_ALERTS = 20;

export const coinKey = (walletClientId, coinId) =>
  `${walletClientId}_${coinId}`;

export const getDefaultMinAmount = coin => {
  if (!coin?.currencyRate || Number(coin.currencyRate) === 0) {
    return '';
  }
  const tempValues = validateNumberInInput(MIN_USD_AMOUNT?.toString(), 2);
  const tempAmount = new BigNumber(tempValues)
    .dividedBy(new BigNumber(coin?.currencyRate))
    .toFixed(Number(coin?.decimal) || 0);
  return tempAmount;
};

export const isAmountBelowThreshold = (amount, coin) => {
  if (!coin?.currencyRate || Number(coin.currencyRate) === 0) {
    return false;
  }
  const bnAmount = new BigNumber(amount);
  if (!bnAmount.isFinite() || bnAmount.isNaN()) {
    return false;
  }
  const usdAmount = bnAmount
    .multipliedBy(coin.currencyRate)
    .absoluteValue()
    .decimalPlaces(0, BigNumber.ROUND_HALF_UP);

  return usdAmount.isLessThan(MIN_USD_AMOUNT);
};

export const buildAddressOptions = coin => {
  const visibleItems = getVisibleDeriveAddresses(
    coin?.chain_name,
    coin?.deriveAddresses,
  );
  if (visibleItems.length > 0) {
    return visibleItems.map(d => ({
      label: getCustomizePublicAddress(d.address),
      value: d.address,
    }));
  }
  if (!coin.address) {
    return [];
  }
  return [
    {label: getCustomizePublicAddress(coin.address), value: coin.address},
  ];
};
