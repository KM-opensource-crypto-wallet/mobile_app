import React, {useContext} from 'react';
import {View, Text, TextInput, ActivityIndicator} from 'react-native';
import CoinSelectorTrigger from '../CoinSelectorTrigger';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './SwapCardStyles';

// One half of the swap form: "You pay" (editable) or "You receive"
// (read-only). Renders the amount, its fiat value, the coin pill and an
// optional balance line; quick-amount chips are passed as children.
const SwapCard = ({
  label,
  coinOption,
  amount,
  fiatValue,
  balanceText,
  isBalanceFetching = false,
  editable = false,
  onChangeAmount,
  onPressCoin,
  isFetching = false,
  hasError = false,
  children,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        {isBalanceFetching ? (
          // theme.gray matches the balance text this replaces.
          <ActivityIndicator size={'small'} color={theme.gray} />
        ) : (
          !!balanceText && (
            <Text style={styles.balance} numberOfLines={1}>
              {balanceText}
            </Text>
          )
        )}
      </View>
      <View style={styles.mainRow}>
        <View style={styles.amountBox}>
          {isFetching ? (
            <ActivityIndicator size={'small'} color={theme.background} />
          ) : (
            <TextInput
              style={[styles.amountInput, hasError && styles.amountError]}
              value={amount}
              onChangeText={onChangeAmount}
              editable={editable}
              placeholder="0"
              placeholderTextColor={theme.gray}
              keyboardType="numeric"
              multiline={false}
            />
          )}
          {!!fiatValue && !isFetching && (
            <Text style={styles.fiatText} numberOfLines={1}>
              {fiatValue}
            </Text>
          )}
        </View>
        <CoinSelectorTrigger option={coinOption} onPress={onPressCoin} />
      </View>
      {children}
    </View>
  );
};

export default SwapCard;
