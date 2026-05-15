import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {CommonActions} from '@react-navigation/native';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './AddNotificationAlertStyles';
import {selectAllWallets} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {getNotificationAlerts} from 'dok-wallet-blockchain-networks/redux/notificationAlerts/notificationAlertsSelector';
import {
  createCustomAlert,
  updateAlertThunk,
} from 'dok-wallet-blockchain-networks/redux/notificationAlerts/notificationAlertsSlice';
import {v4} from 'uuid';
import {showToast} from 'utils/toast';
import {initOneSignal} from 'utils/common';
import {
  coinKey,
  getDefaultMinAmount,
  isAmountBelowThreshold,
} from 'utils/notificationAlertHelpers';
import {
  isBitcoinChain,
  isEVMChain,
} from 'dok-wallet-blockchain-networks/helper';
import NotificationConfigStep from 'components/NotificationConfigStep';
import NotificationCoinPickerModal from 'components/NotificationCoinPickerModal';
import NotificationAmountWarningModal from 'components/NotificationAmountWarningModal';

// EVM tokens and Bitcoin use a 15-min subscription refresh on the server.
// Other chains (Solana, Ripple, etc.) refresh addresses every 15 s and activate instantly.
const needsDelayWarning = entry =>
  isBitcoinChain(entry.coin.chain_name) ||
  (isEVMChain(entry.coin.chain_name) && entry.coin.type === 'token');

const AddNotificationAlertConfig = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();

  const existingAlert = route?.params?.alert;
  const isEditMode = !!existingAlert?.id;

  // Create-mode params
  const walletClientId = route?.params?.walletClientId;
  const initialAddressMap = route?.params?.addressMap || {};
  const initialMinAmountMap = route?.params?.minAmountMap || {};
  const initialConfigCoinKey = route?.params?.configCoinKey || null;

  const allWallets = useSelector(selectAllWallets);
  const notificationAlerts = useSelector(getNotificationAlerts);

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

  const createModeCoinEntries = useMemo(() => {
    const keys = route?.params?.selectedCoinKeysArr || [];
    return walletCoins.filter(e =>
      keys.includes(coinKey(e.walletClientId, e.coin._id)),
    );
  }, [walletCoins, route?.params?.selectedCoinKeysArr]);

  // Edit-mode coin entries derived from the existing alert
  const editModeCoinEntries = useMemo(() => {
    if (!isEditMode || !existingAlert) {
      return [];
    }
    const wallet = allWallets.find(
      w => w.clientId === existingAlert.walletClientId,
    );
    if (!wallet) {
      return [];
    }
    const coin = wallet.coins?.find(c => c._id === existingAlert.coinId);
    if (!coin) {
      return [];
    }
    return [
      {
        coin,
        walletClientId: wallet.clientId,
        walletId: wallet.clientId,
        walletName: wallet.walletName,
      },
    ];
  }, [isEditMode, existingAlert, allWallets]);

  const selectedCoinEntries = isEditMode
    ? editModeCoinEntries
    : createModeCoinEntries;

  const [configCoinKey, setConfigCoinKey] = useState(initialConfigCoinKey);
  const [addressMap, setAddressMap] = useState(initialAddressMap);
  const [minAmountMap, setMinAmountMap] = useState(initialMinAmountMap);
  const [notifyOnReceive, setNotifyOnReceive] = useState(true);
  const [notifyOnSend, setNotifyOnSend] = useState(true);
  const [toggleError, setToggleError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [showCoinPicker, setShowCoinPicker] = useState(false);
  const [showAmountWarning, setShowAmountWarning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditMode || !existingAlert) {
      return;
    }
    const wallet = allWallets.find(
      w => w.clientId === existingAlert.walletClientId,
    );
    if (!wallet) {
      return;
    }
    const coin = wallet.coins?.find(c => c._id === existingAlert.coinId);
    if (!coin) {
      return;
    }
    const key = coinKey(wallet.clientId, coin._id);
    setAddressMap({[key]: existingAlert.wallet});
    setMinAmountMap({
      [key]: existingAlert.minAmount ?? getDefaultMinAmount(coin),
    });
    setConfigCoinKey(key);
    setNotifyOnReceive(existingAlert.notifyOnReceive ?? true);
    setNotifyOnSend(existingAlert.notifyOnSend ?? true);
  }, [isEditMode, existingAlert, allWallets]);

  const currentMinAmount = configCoinKey
    ? minAmountMap[configCoinKey] ?? ''
    : '';

  const onMinAmountChange = useCallback(
    val => {
      if (!configCoinKey) {
        return;
      }
      setMinAmountMap(prev => ({...prev, [configCoinKey]: val}));
      setAmountError('');
    },
    [configCoinKey],
  );

  const validate = useCallback(() => {
    if (!notifyOnReceive && !notifyOnSend) {
      setToggleError('At least one notification type must be enabled');
      return false;
    }
    setToggleError('');
    for (const entry of selectedCoinEntries) {
      const key = coinKey(entry.walletClientId, entry.coin._id);
      const amt = parseFloat(minAmountMap[key]);
      if (!amt || amt <= 0) {
        setAmountError('All amounts must be greater than 0');
        setConfigCoinKey(key);
        return false;
      }
    }
    setAmountError('');
    return true;
  }, [notifyOnReceive, notifyOnSend, selectedCoinEntries, minAmountMap]);

  const hasBelowThreshold = useCallback(
    () =>
      selectedCoinEntries.some(entry => {
        const key = coinKey(entry.walletClientId, entry.coin._id);
        return isAmountBelowThreshold(minAmountMap[key], entry.coin);
      }),
    [selectedCoinEntries, minAmountMap],
  );

  const doSave = useCallback(async () => {
    setIsSaving(true);

    const basePayload = (entry, key, wallet) => ({
      walletClientId: entry.walletClientId,
      walletId: entry.walletId,
      walletName: entry.walletName,
      coinId: entry.coin._id,
      coinSymbol: entry.coin.symbol,
      coinName: entry.coin.name,
      coinIcon: entry.coin.icon,
      chainName: entry.coin.chain_name,
      chainDisplayName: entry.coin.chain_display_name || '',
      coinType: entry.coin.type,
      coinDecimal: entry.coin.decimal ?? 18,
      contractAddress:
        entry.coin.type === 'token' ? entry.coin.contractAddress : null,
      wallet,
      minAmount: minAmountMap[key],
      notifyOnReceive,
      notifyOnSend,
    });

    try {
      const oneSignalPlayerId = await initOneSignal();

      if (isEditMode) {
        const entry = selectedCoinEntries[0];
        const key = coinKey(entry.walletClientId, entry.coin._id);
        const payload = {
          id: existingAlert.id,
          backendId: existingAlert.backendId ?? null,
          ...basePayload(entry, key, addressMap[key] || existingAlert.wallet),
        };
        await dispatch(updateAlertThunk({payload, oneSignalPlayerId})).unwrap();
        showToast({
          type: 'successToast',
          title: 'Alert updated',
          message: `${payload.coinSymbol} · Min ${payload.minAmount} ${payload.coinSymbol}`,
        });
      } else {
        const promises = selectedCoinEntries.map(entry => {
          const key = coinKey(entry.walletClientId, entry.coin._id);
          const payload = {
            id: v4(),
            backendId: null,
            createdAt: Date.now(),
            ...basePayload(
              entry,
              key,
              addressMap[key] || entry.coin.address || '',
            ),
          };
          return dispatch(
            createCustomAlert({payload, oneSignalPlayerId}),
          ).unwrap();
        });
        const results = await Promise.allSettled(promises);
        const failed = results.filter(r => r.status === 'rejected');
        const successCount = results.length - failed.length;
        const s = n => (n > 1 ? 's' : '');
        if (successCount === 0) {
          const reason = failed[0]?.reason?.message || failed[0]?.reason;
          showToast({
            type: 'errorToast',
            title: 'Failed to create alerts',
            message:
              typeof reason === 'string'
                ? reason
                : 'Please check your connection and try again.',
          });
          return;
        }
        showToast(
          failed.length > 0
            ? {
                type: 'errorToast',
                title: `${failed.length} alert${s(failed.length)} failed`,
                message: `${successCount} created, ${failed.length} could not be saved.`,
              }
            : {
                type: 'successToast',
                title: `${successCount} alert${s(successCount)} created`,
                message:
                  'You will receive notifications for the selected coins.',
              },
        );
      }
      const stepScreens = new Set([
        'AddNotificationAlert',
        'AddNotificationAlertCoins',
        'AddNotificationAlertAddresses',
        'AddNotificationAlertConfig',
      ]);
      navigation.dispatch(state => {
        const routes = state.routes.filter(r => !stepScreens.has(r.name));
        return CommonActions.reset({
          ...state,
          routes,
          index: routes.length - 1,
        });
      });
    } catch (err) {
      showToast({
        type: 'errorToast',
        title: isEditMode ? 'Failed to update alert' : 'Failed to create alert',
        message: err?.message || 'Please check your connection and try again.',
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    isEditMode,
    selectedCoinEntries,
    addressMap,
    minAmountMap,
    notifyOnReceive,
    notifyOnSend,
    existingAlert,
    dispatch,
    navigation,
  ]);

  const onSubmit = useCallback(() => {
    if (!validate()) {
      return;
    }
    if (hasBelowThreshold()) {
      setShowAmountWarning(true);
      return;
    }
    doSave();
  }, [validate, hasBelowThreshold, doSave]);

  return (
    <View style={styles.container}>
      {!isEditMode && (
        <View style={styles.stepIndicator}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={[styles.stepDot, styles.stepDotActive]} />
          ))}
        </View>
      )}

      <NotificationConfigStep
        selectedCoinEntries={selectedCoinEntries}
        configCoinKey={configCoinKey}
        addressMap={addressMap}
        currentMinAmount={currentMinAmount}
        onMinAmountChange={onMinAmountChange}
        amountError={amountError}
        notifyOnReceive={notifyOnReceive}
        onReceiveChange={val => {
          setNotifyOnReceive(val);
          setToggleError('');
        }}
        notifyOnSend={notifyOnSend}
        onSendChange={val => {
          setNotifyOnSend(val);
          setToggleError('');
        }}
        toggleError={toggleError}
        alertsCount={notificationAlerts.length}
        isEditMode={isEditMode}
        isSaving={isSaving}
        onSubmit={onSubmit}
        onOpenCoinPicker={() => setShowCoinPicker(true)}
      />

      <NotificationCoinPickerModal
        visible={showCoinPicker}
        selectedCoinEntries={selectedCoinEntries}
        configCoinKey={configCoinKey}
        onSelect={key => {
          setConfigCoinKey(key);
          setShowCoinPicker(false);
        }}
        onDismiss={() => setShowCoinPicker(false)}
      />

      <NotificationAmountWarningModal
        visible={showAmountWarning}
        onConfirm={() => {
          setShowAmountWarning(false);
          doSave();
        }}
        onDismiss={() => setShowAmountWarning(false)}
      />
    </View>
  );
};

export default AddNotificationAlertConfig;
