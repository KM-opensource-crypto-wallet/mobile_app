import React, {useContext} from 'react';
import {Text, View} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import {currencySymbol} from 'data/currency';
import myStyles from './SendFundsFormStyles';

const AvailableBalanceHeader = ({
  availableAmount,
  availableAmountCurrency,
  symbol,
  localCurrency,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  return (
    <>
      <Text style={styles.title}>Amount available for send</Text>
      <View style={styles.box}>
        <Text style={styles.boxTitle}>{availableAmount}</Text>
        <Text style={styles.boxTitle}>{' ' + (symbol || '')}</Text>
      </View>
      <View style={styles.box}>
        <Text style={styles.boxBalance}>
          {currencySymbol[localCurrency] || ''}
          {availableAmountCurrency}
        </Text>
      </View>
    </>
  );
};

export default AvailableBalanceHeader;
