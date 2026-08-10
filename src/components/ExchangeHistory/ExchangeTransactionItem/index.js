import React, {useContext} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import IoniconIcon from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';
import {ThemeContext} from 'theme/ThemeContext';
import ExchangeStatusBadge from 'components/ExchangeHistory/ExchangeStatusBadge';
import {
  truncateExchangeAmount,
  exchangePairLabel,
} from 'components/ExchangeHistory/exchangeFormat';
import myStyles from './ExchangeTransactionItemStyles';

// One swap-history row: provider logo, pair (BTC → ETH), date/provider line
// on the left; received amount and status pill on the right.
const ExchangeTransactionItem = ({transaction, onPress}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const providerSrc = transaction?.metadata?.providerSrc;
  const providerTitle =
    transaction?.metadata?.providerTitle || transaction?.provider || '';
  const toAmount = truncateExchangeAmount(transaction?.to_amount);
  const dateLabel = transaction?.created_at
    ? dayjs(transaction.created_at).format('DD MMM YYYY, hh:mm A')
    : null;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => onPress?.(transaction)}
      accessibilityRole="button">
      <View style={styles.logoBox}>
        {providerSrc ? (
          <FastImage
            source={{uri: providerSrc}}
            resizeMode={'contain'}
            style={styles.logo}
          />
        ) : (
          <IoniconIcon
            name="swap-horizontal"
            size={18}
            color={theme.background}
          />
        )}
      </View>
      <View style={styles.infoBox}>
        <Text style={styles.pair} numberOfLines={1}>
          {exchangePairLabel(transaction)}
        </Text>
        {!!providerTitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {providerTitle}
          </Text>
        )}
        {!!dateLabel && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {dateLabel}
          </Text>
        )}
      </View>
      <View style={styles.rightBox}>
        {!!toAmount && (
          <Text style={styles.amount} numberOfLines={1}>
            {`+${toAmount} ${transaction?.to_currency?.toUpperCase() || ''}`}
          </Text>
        )}
        <ExchangeStatusBadge status={transaction?.status} small />
      </View>
      <IoniconIcon name="chevron-forward" size={18} color={theme.gray} />
    </TouchableOpacity>
  );
};

export default React.memo(ExchangeTransactionItem);
