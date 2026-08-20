import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {EXCHANGE_STATUS_CONFIG} from 'components/ExchangeHistory/exchangeFormat';

// Dot + label pill for the unified exchange statuses
// (pending/completed/failed/expired/refunded).
const ExchangeStatusBadge = ({status, small}) => {
  const config = EXCHANGE_STATUS_CONFIG[status] || {
    label: status || '—',
    color: '#6B7280',
  };
  return (
    <View
      style={[
        styles.badge,
        small && styles.badgeSmall,
        {backgroundColor: config.color + '22'},
      ]}>
      <View style={[styles.dot, {backgroundColor: config.color}]} />
      <Text
        style={[
          styles.label,
          small && styles.labelSmall,
          {color: config.color},
        ]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Roboto-Medium',
  },
  labelSmall: {
    fontSize: 11,
  },
});

export default ExchangeStatusBadge;
