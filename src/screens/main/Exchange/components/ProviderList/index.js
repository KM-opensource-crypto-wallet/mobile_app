import React, {useContext} from 'react';
import {View, Text, TouchableOpacity, ActivityIndicator} from 'react-native';
import ProviderCard from '../ProviderCard';
import RateRefreshCountdown from '../RateRefreshCountdown';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './ProviderListStyles';

// The provider comparison section: header with count + refresh countdown,
// then one ProviderCard per provider. Also owns the section's loading,
// error (with retry) and empty states.
const ProviderList = ({
  rows,
  isFetching,
  error,
  onRetry,
  onPressProvider,
  fromSymbol,
  toSymbol,
  fiatSymbol,
  quoteFetchedAt,
  refreshPaused,
  onRefresh,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const usableCount = rows.filter(
    row => row.toAmount && !row.isBelowMinimum,
  ).length;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>
          {rows.length
            ? `Providers (${usableCount} of ${rows.length} available)`
            : 'Providers'}
        </Text>
        {!!quoteFetchedAt && !error && (
          <RateRefreshCountdown
            fetchedAt={quoteFetchedAt}
            paused={refreshPaused || isFetching}
            onRefresh={onRefresh}
          />
        )}
      </View>
      {isFetching && !rows.length ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size={'small'} color={theme.background} />
          <Text style={styles.stateText}>Fetching quotes…</Text>
        </View>
      ) : error ? (
        <View style={styles.stateBox}>
          <Text style={styles.errorText}>
            Couldn't fetch quotes. Check your connection and try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : rows.length ? (
        rows.map(row => (
          <ProviderCard
            key={row.providerName}
            row={row}
            fromSymbol={fromSymbol}
            toSymbol={toSymbol}
            fiatSymbol={fiatSymbol}
            onPress={onPressProvider}
          />
        ))
      ) : (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>
            No provider supports this pair yet. Try a different coin or network.
          </Text>
        </View>
      )}
    </View>
  );
};

export default ProviderList;
