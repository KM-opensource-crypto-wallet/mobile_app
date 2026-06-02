import React, {useCallback, useContext, useMemo, useState} from 'react';
import {View} from 'react-native';
import {useSelector} from 'react-redux';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './AddNotificationAlertStyles';
import {selectAllWallets} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import NotificationCoinStep from 'components/NotificationCoinStep';
import {coinKey, buildAddressOptions} from 'utils/notificationAlertHelpers';
import {
  isEVMChain,
  isBitcoinChain,
} from 'dok-wallet-blockchain-networks/helper';

const AddNotificationAlertCoins = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const {walletClientId} = route.params;

  const allWallets = useSelector(selectAllWallets);
  const selectedWallet = useMemo(
    () => allWallets.find(w => w.clientId === walletClientId),
    [allWallets, walletClientId],
  );

  const walletCoins = useMemo(() => {
    const allCoins = (selectedWallet?.coins || []).filter(
      c =>
        (c.isInWallet &&
          (c.chain_name === 'ethereum' ||
            c.chain_name === 'binance_smart_chain') &&
          c.type === 'token') ||
        isBitcoinChain(c.chain_name),
    );

    // Deduplicate Bitcoin variants: one entry per symbol, prefer chain_name='bitcoin'
    const bitcoinBySymbol = new Map();
    const evmCoins = [];
    for (const c of allCoins) {
      if (isBitcoinChain(c.chain_name)) {
        const prev = bitcoinBySymbol.get(c.symbol);
        if (!prev || c.chain_name === 'bitcoin') {
          bitcoinBySymbol.set(c.symbol, c);
        }
      } else {
        evmCoins.push(c);
      }
    }

    return [...evmCoins, ...bitcoinBySymbol.values()].map(c => ({
      coin: c,
      walletClientId: selectedWallet.clientId,
      walletId: selectedWallet.clientId,
      walletName: selectedWallet.walletName,
    }));
  }, [selectedWallet]);

  const [selectedCoinKeys, setSelectedCoinKeys] = useState(new Set());
  const [coinSearchQuery, setCoinSearchQuery] = useState('');

  const filteredCoins = useMemo(() => {
    if (!coinSearchQuery.trim()) {
      return walletCoins;
    }
    const q = coinSearchQuery.toLowerCase();
    return walletCoins.filter(
      e =>
        e.coin.symbol?.toLowerCase().includes(q) ||
        e.coin.name?.toLowerCase().includes(q),
    );
  }, [walletCoins, coinSearchQuery]);

  const onToggleCoin = useCallback(entry => {
    const key = coinKey(entry.walletClientId, entry.coin._id);
    setSelectedCoinKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const onNext = useCallback(() => {
    const addressMap = {};
    for (const entry of walletCoins.filter(e =>
      selectedCoinKeys.has(coinKey(e.walletClientId, e.coin._id)),
    )) {
      const key = coinKey(entry.walletClientId, entry.coin._id);
      const options = buildAddressOptions(entry.coin);
      addressMap[key] = options[0]?.value ?? entry.coin.address ?? '';
    }
    navigation.navigate('AddNotificationAlertAddresses', {
      walletClientId,
      selectedCoinKeysArr: [...selectedCoinKeys],
      addressMap,
    });
  }, [selectedCoinKeys, walletCoins, walletClientId, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.stepIndicator}>
        {[1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={[
              styles.stepDot,
              i <= 2 ? styles.stepDotActive : styles.stepDotInactive,
            ]}
          />
        ))}
      </View>
      <NotificationCoinStep
        coins={filteredCoins}
        selectedCoinKeys={selectedCoinKeys}
        onToggleCoin={onToggleCoin}
        searchQuery={coinSearchQuery}
        onSearchChange={setCoinSearchQuery}
        onNext={onNext}
      />
    </View>
  );
};

export default AddNotificationAlertCoins;
