import React, {useContext} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import IoniconIcon from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';
import {ThemeContext} from 'theme/ThemeContext';
import ExchangeStatusBadge from 'components/ExchangeHistory/ExchangeStatusBadge';
import SwapCoinIcon from 'components/ExchangeHistory/SwapCoinIcon';
import useSwapCoinDisplay from 'components/ExchangeHistory/useSwapCoinDisplay';
import {truncateExchangeAmount} from 'components/ExchangeHistory/exchangeFormat';
import myStyles from './ExchangeTransactionItemStyles';

// One swap-history card: provider · date + status header, then a full line
// per side of the swap (icon with chain badge, symbol over chain name,
// amount on the right) joined by a down-arrow connector. Each coin owns a
// whole line, so long chain names never truncate.
const ExchangeTransactionItem = ({transaction, onPress}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const {from, to} = useSwapCoinDisplay(transaction);

  const providerTitle =
    transaction?.metadata?.providerTitle || transaction?.provider || '';
  const dateLabel = transaction?.created_at
    ? dayjs(transaction.created_at).format('DD MMM YYYY, hh:mm A')
    : null;
  const metaLine = [providerTitle, dateLabel].filter(Boolean).join(' · ');
  const fromAmount = truncateExchangeAmount(transaction?.from_amount);
  const toAmount = truncateExchangeAmount(transaction?.to_amount);

  const renderCoinRow = (side, amountText, amountStyle) => (
    <View style={styles.coinRow}>
      <SwapCoinIcon
        icon={side.icon}
        symbol={side.symbol}
        chainName={side.chainName}
        size={34}
      />
      <View style={styles.coinTextBox}>
        <Text style={styles.coinSymbol} numberOfLines={1}>
          {side.symbol || '—'}
        </Text>
        {!!side.chainDisplayName && (
          <Text style={styles.coinChain} numberOfLines={1}>
            {side.chainDisplayName}
          </Text>
        )}
      </View>
      {!!amountText && (
        <Text style={amountStyle} numberOfLines={1}>
          {amountText}
        </Text>
      )}
    </View>
  );

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => onPress?.(transaction)}
      accessibilityRole="button">
      <View style={styles.headerRow}>
        <Text style={styles.headerMeta} numberOfLines={1}>
          {metaLine}
        </Text>
        <ExchangeStatusBadge status={transaction?.status} small />
      </View>
      <View style={styles.divider} />
      {renderCoinRow(
        from,
        fromAmount ? `-${fromAmount} ${from.symbol || ''}` : '',
        styles.sentAmount,
      )}
      <View style={styles.connectorRow}>
        <IoniconIcon name="arrow-down" size={14} color={theme.gray} />
      </View>
      {renderCoinRow(
        to,
        toAmount ? `+${toAmount} ${to.symbol || ''}` : '',
        styles.receivedAmount,
      )}
    </TouchableOpacity>
  );
};

export default React.memo(ExchangeTransactionItem);
