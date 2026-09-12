import BigNumber from 'bignumber.js';
import {validateNumber} from 'dok-wallet-blockchain-networks/helper';

/**
 * Chain-specific rules that Yup can't express, checked at submit time by every
 * screen that builds a send (SendFunds, SchedulePayment).
 *
 * @returns null when the values pass, otherwise one of
 *   {field: 'amount'|'memo', message}  -> show under that field
 *   {toast: {title, message}}          -> show as an error toast
 */
export const validateChainRules = ({chain_name, values, availableAmount}) => {
  const amount = new BigNumber(values?.amount || 0);
  const availableAmountBN = new BigNumber(availableAmount || 0);

  if (
    chain_name === 'polkadot' &&
    availableAmountBN.minus(amount).lt(new BigNumber(1.1)) &&
    !availableAmountBN.eq(amount)
  ) {
    return {
      toast: {
        title: 'Polkadot warning',
        message: 'Required minimum 1 DOT or send total amount',
      },
    };
  }

  if (chain_name === 'cardano') {
    if (amount.lt(new BigNumber(1))) {
      return {
        field: 'amount',
        message: 'minimum 1 ADA is required for transaction',
      };
    }
    if (
      !amount.eq(availableAmountBN) &&
      availableAmountBN.minus(amount).lt(new BigNumber(1))
    ) {
      return {
        field: 'amount',
        message: 'Remaining balance is less than 1 ADA, please send max amount',
      };
    }
  }

  if (
    chain_name === 'ripple' &&
    values?.memo &&
    validateNumber(values.memo) === null
  ) {
    return {
      toast: {
        title: 'Invalid MEMO or TAG',
        message: 'MEMO or TAG must be number',
      },
    };
  }

  return null;
};
