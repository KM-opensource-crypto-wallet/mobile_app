import React, {useCallback, useContext, useMemo, useState} from 'react';
import {View} from 'react-native';
import {useSelector} from 'react-redux';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './AddNotificationAlertStyles';
import {selectVisibleWallets} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import NotificationAddressStep from 'components/NotificationAddressStep';
import {coinKey, getDefaultMinAmount} from 'utils/notificationAlertHelpers';

const AddNotificationAlertAddresses = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const {
    walletClientId,
    selectedCoinKeysArr,
    addressMap: initialAddressMap,
  } = route.params;

  const allWallets = useSelector(selectVisibleWallets);
  const selectedWallet = useMemo(
    () => allWallets.find(w => w.clientId === walletClientId),
    [allWallets, walletClientId],
  );

  const walletCoins = useMemo(
    () =>
      (selectedWallet?.coins || [])
        .filter(c => c.isInWallet)
        .map(c => ({
          coin: c,
          walletClientId: selectedWallet.clientId,
          walletId: selectedWallet.clientId,
          walletName: selectedWallet.walletName,
        })),
    [selectedWallet],
  );

  const selectedCoinEntries = useMemo(
    () =>
      walletCoins.filter(e =>
        selectedCoinKeysArr.includes(coinKey(e.walletClientId, e.coin._id)),
      ),
    [walletCoins, selectedCoinKeysArr],
  );

  const [addressMap, setAddressMap] = useState(initialAddressMap || {});

  const onAddressChange = useCallback((key, value) => {
    setAddressMap(prev => ({...prev, [key]: value}));
  }, []);

  const onNext = useCallback(() => {
    const minAmountMap = {};
    for (const entry of selectedCoinEntries) {
      const key = coinKey(entry.walletClientId, entry.coin._id);
      minAmountMap[key] = getDefaultMinAmount(entry.coin);
    }
    const firstEntry = selectedCoinEntries[0];
    const configCoinKey = firstEntry
      ? coinKey(firstEntry.walletClientId, firstEntry.coin._id)
      : null;
    navigation.navigate('AddNotificationAlertConfig', {
      walletClientId,
      selectedCoinKeysArr,
      addressMap,
      minAmountMap,
      configCoinKey,
    });
  }, [
    selectedCoinEntries,
    addressMap,
    walletClientId,
    selectedCoinKeysArr,
    navigation,
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.stepIndicator}>
        {[1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={[
              styles.stepDot,
              i <= 3 ? styles.stepDotActive : styles.stepDotInactive,
            ]}
          />
        ))}
      </View>
      <NotificationAddressStep
        selectedCoinEntries={selectedCoinEntries}
        addressMap={addressMap}
        onAddressChange={onAddressChange}
        onNext={onNext}
      />
    </View>
  );
};

export default AddNotificationAlertAddresses;
