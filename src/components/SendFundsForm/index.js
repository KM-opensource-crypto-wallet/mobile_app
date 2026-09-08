import React, {useCallback, useContext} from 'react';
import {Keyboard, Text, View} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import RecipientAddressInput from 'components/RecipientAddressInput';
import AvailableBalanceHeader from './AvailableBalanceHeader';
import AmountInputGroup from './AmountInputGroup';
import MemoInput from './MemoInput';
import HederaRecipientHint from './HederaRecipientHint';
import myStyles from './SendFundsFormStyles';

/**
 * The send form shared by SendFunds and SchedulePayment: balance header,
 * recipient (address book, QR, Hedera hints), crypto/fiat amount pair and the
 * memo field on memo chains. Extra screen-specific fields go in `children`.
 *
 * `formik` is a useFormik() result with fields toAddress/amount/currencyAmount/
 * memo; `form` is the matching useSendFundsForm() result. The screen owns the
 * scroll view, submit button(s) and modals.
 */
const SendFundsForm = ({
  formik,
  form,
  coin,
  wallet,
  localCurrency,
  navigation,
  scannerPage,
  fieldDisable = false,
  recipientLabel = 'Send to',
  children,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const {values, errors, touched, handleBlur, setFieldValue} = formik;
  const recipientError = touched.toAddress && errors.toAddress;
  const amountEditable = !fieldDisable && !form.isInvoiceAmountLocked(values);

  const onSelectAddress = useCallback(
    item => {
      if (item?.address) {
        setFieldValue('toAddress', item.address);
      }
    },
    [setFieldValue],
  );

  return (
    <View style={styles.form}>
      <AvailableBalanceHeader
        availableAmount={form.availableAmount}
        availableAmountCurrency={form.availableAmountCurrency}
        symbol={coin?.symbol}
        localCurrency={localCurrency}
      />
      <View style={styles.boxInput}>
        <Text style={styles.listTitle}>{recipientLabel}</Text>
        <RecipientAddressInput
          disabled={fieldDisable}
          chain_name={coin?.chain_name}
          walletId={wallet?.clientId}
          onSelectAddress={onSelectAddress}
          error={recipientError}
          onChangeText={text => form.handleRecipientChange(formik, text)}
          onBlur={handleBlur('toAddress')}
          value={values.toAddress}
          onSubmitEditing={Keyboard.dismiss}
          onPressScan={() => {
            navigation.navigate('Scanner', {page: scannerPage});
          }}>
          {form.isHedera && !recipientError && (
            <HederaRecipientHint
              address={values.toAddress}
              getChain={form.getChainInstance}
            />
          )}
          {form.isHedera && !!coin?.accountId && (
            <Text style={styles.infoText}>
              {`Your account ID: ${coin.accountId}`}
            </Text>
          )}
        </RecipientAddressInput>
      </View>
      <AmountInputGroup
        formik={formik}
        coin={coin}
        localCurrency={localCurrency}
        availableAmount={form.availableAmount}
        availableAmountCurrency={form.availableAmountCurrency}
        editable={amountEditable}
      />
      {form.isMemoSupported && (
        <MemoInput
          formik={formik}
          editable={!fieldDisable}
          onPressScan={() => {
            navigation.navigate('Scanner', {page: `${scannerPage}Memo`});
          }}
        />
      )}
      {children}
    </View>
  );
};

export default SendFundsForm;
