import React, {useCallback, useContext} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {TextInput} from 'react-native-paper';
import BigNumber from 'bignumber.js';
import {ThemeContext} from 'theme/ThemeContext';
import {
  multiplyBNWithFixed,
  validateNumberInInput,
} from 'dok-wallet-blockchain-networks/helper';
import myStyles from './SendFundsFormStyles';

const MAX_HIT_SLOP = {top: 12, left: 12, right: 12, bottom: 12};

const AmountField = ({
  label,
  value,
  error,
  editable,
  onChangeText,
  onBlur,
  onSubmitEditing,
  onPressMax,
  styles,
  theme,
}) => (
  <>
    <View style={styles.inputView}>
      <TextInput
        style={styles.input}
        editable={editable}
        label={label}
        textColor={editable ? theme.font : theme.gray}
        theme={{colors: {onSurfaceVariant: theme.gray}}}
        outlineColor={error ? 'red' : theme.gray}
        activeOutlineColor={error ? 'red' : theme.font}
        autoCapitalize="none"
        mode="outlined"
        blurOnSubmit={false}
        onChangeText={onChangeText}
        onBlur={onBlur}
        value={value}
        onSubmitEditing={onSubmitEditing}
        keyboardType="decimal-pad"
      />
      {editable && (
        <TouchableOpacity
          style={styles.btnMax}
          hitSlop={MAX_HIT_SLOP}
          onPress={onPressMax}>
          <Text style={styles.btnText}>Max</Text>
        </TouchableOpacity>
      )}
    </View>
    {!!error && <Text style={styles.textConfirm}>{error}</Text>}
  </>
);

/**
 * Crypto amount + fiat amount inputs that mirror each other, each with a Max
 * button. Only `amount` is validated by the schema; both inputs are views of
 * the same value, so both show `errors.amount`.
 */
const AmountInputGroup = ({
  formik,
  coin,
  localCurrency,
  availableAmount,
  availableAmountCurrency,
  editable = true,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const {values, errors, touched, handleBlur, handleSubmit, setFieldValue} =
    formik;
  const error = (touched.amount || touched.currencyAmount) && errors.amount;
  const currencyRate = coin?.currencyRate;
  const decimal = coin?.decimal;

  const onChangeAmount = useCallback(
    text => {
      const amount = validateNumberInInput(text, decimal);
      setFieldValue('amount', amount);
      setFieldValue(
        'currencyAmount',
        multiplyBNWithFixed(amount, currencyRate, 2),
      );
    },
    [currencyRate, decimal, setFieldValue],
  );

  const onChangeCurrencyAmount = useCallback(
    text => {
      const currencyAmount = validateNumberInInput(text, 2);
      setFieldValue('currencyAmount', currencyAmount);
      setFieldValue(
        'amount',
        new BigNumber(currencyAmount || 0)
          .dividedBy(new BigNumber(currencyRate || 1))
          .toFixed(Number(decimal)),
      );
    },
    [currencyRate, decimal, setFieldValue],
  );

  const onPressMax = useCallback(() => {
    setFieldValue('amount', availableAmount);
    setFieldValue('currencyAmount', availableAmountCurrency);
  }, [availableAmount, availableAmountCurrency, setFieldValue]);

  return (
    <>
      <View style={styles.boxInput}>
        <Text style={styles.listTitle}>Amount</Text>
        <AmountField
          label="Enter amount of Crypto to send"
          value={values.amount}
          error={error}
          editable={editable}
          onChangeText={onChangeAmount}
          onBlur={handleBlur('amount')}
          onSubmitEditing={handleSubmit}
          onPressMax={onPressMax}
          styles={styles}
          theme={theme}
        />
      </View>
      <View style={styles.boxInput}>
        <Text style={styles.listTitle}>Currency Amount</Text>
        <AmountField
          label={`Enter ${localCurrency} amount of Crypto to send`}
          value={values.currencyAmount}
          error={error}
          editable={editable}
          onChangeText={onChangeCurrencyAmount}
          onBlur={handleBlur('currencyAmount')}
          onSubmitEditing={handleSubmit}
          onPressMax={onPressMax}
          styles={styles}
          theme={theme}
        />
      </View>
    </>
  );
};

export default AmountInputGroup;
