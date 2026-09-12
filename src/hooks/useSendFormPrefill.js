import {useEffect} from 'react';
import {multiplyBNWithFixed} from 'dok-wallet-blockchain-networks/helper';
import {getBolt11InvoiceAmount} from 'dok-wallet-blockchain-networks/helper/bolt11';

/**
 * Prefill a send form from route params (QR scan, deep link, memo scan).
 * Only the params that are present are applied, so a memo-scan round trip
 * that comes back with just {memo} leaves the rest of the form untouched.
 * `refreshKey` (the scanner's newDateToString) re-applies the same address
 * when it is scanned again.
 */
const useSendFormPrefill = (
  formik,
  {address, amount, memo, refreshKey},
  {isLightning, currencyRate},
) => {
  const {setFieldValue, setFieldTouched} = formik;
  useEffect(() => {
    // A fixed-amount invoice must be paid exactly and locks the amount field,
    // so it outranks any amount carried by the QR/deep link.
    const invoiceAmount = isLightning ? getBolt11InvoiceAmount(address) : null;
    const localAmount = invoiceAmount || amount;
    if (address) {
      setFieldValue('toAddress', address);
    }
    if (memo) {
      setFieldValue('memo', memo);
    }
    if (localAmount) {
      setFieldValue('amount', localAmount);
      setFieldValue(
        'currencyAmount',
        multiplyBNWithFixed(localAmount, currencyRate, 2),
      );
    }
    if (!address && !localAmount && !memo) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setFieldTouched('toAddress', true);
      setFieldTouched('amount', true);
      setFieldTouched('currencyAmount', true);
      setFieldTouched('memo', true);
    }, 0);
    return () => clearTimeout(timer);
  }, [
    address,
    amount,
    memo,
    refreshKey,
    isLightning,
    currencyRate,
    setFieldValue,
    setFieldTouched,
  ]);
};

export default useSendFormPrefill;
