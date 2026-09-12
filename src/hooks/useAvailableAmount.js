import {useMemo} from 'react';
import BigNumber from 'bignumber.js';
import {
  isBitcoinChain,
  multiplyBNWithFixed,
} from 'dok-wallet-blockchain-networks/helper';

/**
 * Spendable balance: totalAmount (or the value of the manually selected UTXOs
 * on bitcoin chains) minus the chain's minimum reserve, clamped at zero.
 * Pure so non-hook callers (LocalNotificationProvider) can share it.
 */
export const getAvailableAmount = ({
  totalAmount,
  minimumBalance,
  selectedUTXOsValue,
} = {}) => {
  const amount = selectedUTXOsValue || totalAmount || '0';
  const available = new BigNumber(amount).minus(
    new BigNumber(minimumBalance || '0'),
  );
  // toFixed, never toString: a balance under 1e-7 would render as "1.3e-7".
  return available.gt(0) ? available.toFixed() : new BigNumber(0).toFixed();
};

export const useAvailableAmount = (coin, {selectedUTXOsValue} = {}) => {
  const utxoValue = isBitcoinChain(coin?.chain_name)
    ? selectedUTXOsValue
    : undefined;
  const availableAmount = useMemo(
    () =>
      getAvailableAmount({
        totalAmount: coin?.totalAmount,
        minimumBalance: coin?.minimumBalance,
        selectedUTXOsValue: utxoValue,
      }),
    [coin?.totalAmount, coin?.minimumBalance, utxoValue],
  );
  const availableAmountCurrency = useMemo(
    () => multiplyBNWithFixed(availableAmount, coin?.currencyRate, 2),
    [availableAmount, coin?.currencyRate],
  );
  return {availableAmount, availableAmountCurrency};
};

export default useAvailableAmount;
