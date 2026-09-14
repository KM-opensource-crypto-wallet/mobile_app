import {useCallback, useMemo, useState} from 'react';
import {useSelector} from 'react-redux';
import {getChain} from 'dok-wallet-blockchain-networks/cryptoChain';
import {
  isBitcoinChain,
  isMemoSupportChain,
  multiplyBNWithFixed,
} from 'dok-wallet-blockchain-networks/helper';
import {
  getCustomRPCWithData,
  selectAllCustomRpc,
} from 'dok-wallet-blockchain-networks/redux/customRpc/customRpcSelectors';
import {getTransferData} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSelector';
import {getSentAddressHistory} from 'dok-wallet-blockchain-networks/redux/sentAddressHistory/sentAddressHistorySelectors';
import {getAddressBook} from 'dok-wallet-blockchain-networks/redux/addressBook/addressBookSelector';
import {findLookalikeAddress} from 'dok-wallet-blockchain-networks/helper/addressPoisoning';
import {getBolt11InvoiceAmount} from 'dok-wallet-blockchain-networks/helper/bolt11';
import {resolveRecipientAddress} from 'dok-wallet-blockchain-networks/helper/recipientAddress';
import {useAvailableAmount} from 'hooks/useAvailableAmount';
import {validateChainRules} from 'utils/sendFormRules';
import {validationSchemaSendFunds} from 'utils/validationSchema';
import {showToast} from 'utils/toast';

/**
 * Everything a "send" form needs that isn't rendering: spendable balance,
 * chain capabilities, recipient resolution, address-poisoning detection,
 * chain-specific submit rules and the BOLT11 amount lock. Pair with
 * <SendFundsForm/> and a useFormik() whose fields are
 * toAddress / amount / currencyAmount / memo.
 */
const useSendFundsForm = ({coin, wallet}) => {
  const allCustomRPC = useSelector(selectAllCustomRpc);
  const transferData = useSelector(getTransferData);
  const sentAddressHistory = useSelector(getSentAddressHistory);
  const addressBook = useSelector(getAddressBook);

  const chain_name = coin?.chain_name;
  const currencyRate = coin?.currencyRate;
  const isBitcoin = isBitcoinChain(chain_name);
  const isLightning = chain_name === 'bitcoin_lightning';
  const isHedera = chain_name === 'hedera';
  const isMemoSupported = useMemo(
    () => isMemoSupportChain(chain_name),
    [chain_name],
  );

  const {availableAmount, availableAmountCurrency} = useAvailableAmount(coin, {
    selectedUTXOsValue: transferData?.selectedUTXOsValue,
  });

  const validationSchema = useMemo(
    () => validationSchemaSendFunds({balanceAmount: availableAmount}),
    [availableAmount],
  );

  const customRPC = useMemo(
    () => getCustomRPCWithData(allCustomRPC, chain_name, wallet?.clientId),
    [allCustomRPC, chain_name, wallet?.clientId],
  );

  const getChainInstance = useCallback(
    () => getChain(chain_name, wallet?.phrase, customRPC),
    [chain_name, wallet?.phrase, customRPC],
  );

  // Directly valid address, or (on name-support chains) a resolvable name.
  const resolveRecipient = useCallback(
    address =>
      resolveRecipientAddress({
        chain_name,
        phrase: wallet?.phrase,
        customRPC,
        address,
      }),
    [chain_name, wallet?.phrase, customRPC],
  );

  // Address-poisoning detection on the resolved recipient. If a lookalike is
  // found, hold the action and expose the warning (proceed runs only after the
  // user confirms); otherwise proceed immediately.
  const [poisonWarning, setPoisonWarning] = useState(null);
  const checkPoisoningThenProceed = useCallback(
    (resolvedToAddress, proceed) => {
      const lookalikeAddress = findLookalikeAddress({
        inputAddress: resolvedToAddress,
        chain_name,
        sentHistory: sentAddressHistory,
        addressBook,
      });
      if (lookalikeAddress) {
        setPoisonWarning({
          suspiciousAddress: resolvedToAddress,
          matchedAddress: lookalikeAddress,
          onConfirm: proceed,
        });
        return;
      }
      proceed();
    },
    [chain_name, sentAddressHistory, addressBook],
  );
  const cancelPoisonWarning = useCallback(() => setPoisonWarning(null), []);
  const confirmPoisonWarning = useCallback(() => {
    const pending = poisonWarning;
    setPoisonWarning(null);
    pending?.onConfirm?.();
  }, [poisonWarning]);

  // Chain-specific submit rules (polkadot reserve, cardano minimums, ripple
  // numeric memo). Returns true when the submit must stop; the message has
  // already been shown as a toast or a field error.
  const applyChainRules = useCallback(
    (values, formik) => {
      const result = validateChainRules({chain_name, values, availableAmount});
      if (!result) {
        return false;
      }
      if (result.toast) {
        showToast({type: 'errorToast', ...result.toast});
      } else if (result.field) {
        formik?.setFieldTouched?.(result.field, true, false);
        formik?.setFieldError?.(result.field, result.message);
      }
      return true;
    },
    [chain_name, availableAmount],
  );

  // Fixed-amount BOLT11 invoices must be paid exactly, so the amount fields
  // stay locked while such an invoice is the recipient.
  const isInvoiceAmountLocked = useCallback(
    values => isLightning && !!getBolt11InvoiceAmount(values?.toAddress),
    [isLightning],
  );

  const handleRecipientChange = useCallback(
    (formik, text) => {
      formik.setFieldValue('toAddress', text);
      if (!isLightning) {
        return;
      }
      const invoiceAmount = getBolt11InvoiceAmount(text);
      if (invoiceAmount) {
        formik.setFieldValue('amount', invoiceAmount);
        formik.setFieldValue(
          'currencyAmount',
          multiplyBNWithFixed(invoiceAmount, currencyRate, 2),
        );
      } else if (getBolt11InvoiceAmount(formik.values?.toAddress)) {
        // The previous recipient was a fixed-amount invoice; its amount no
        // longer applies to this recipient.
        formik.setFieldValue('amount', '');
        formik.setFieldValue('currencyAmount', '');
      }
    },
    [isLightning, currencyRate],
  );

  return {
    availableAmount,
    availableAmountCurrency,
    validationSchema,
    isBitcoin,
    isLightning,
    isHedera,
    isMemoSupported,
    getChainInstance,
    resolveRecipient,
    checkPoisoningThenProceed,
    poisonWarning,
    cancelPoisonWarning,
    confirmPoisonWarning,
    applyChainRules,
    isInvoiceAmountLocked,
    handleRecipientChange,
  };
};

export default useSendFundsForm;
