import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
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
  buildAddressOptions,
} from 'utils/notificationAlertHelpers';
import NotificationWalletStep from 'components/NotificationWalletStep';
import NotificationCoinStep from 'components/NotificationCoinStep';
import NotificationAddressStep from 'components/NotificationAddressStep';
import NotificationConfigStep from 'components/NotificationConfigStep';
import NotificationCoinPickerModal from 'components/NotificationCoinPickerModal';
import NotificationAmountWarningModal from 'components/NotificationAmountWarningModal';

const STEP_TITLES = {
  1: 'Select Wallet',
  2: 'Select Coins',
  3: 'Select Addresses',
  4: 'Configure Alert',
};

const AddNotificationAlert = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();

  const existingAlert = route?.params?.alert;
  const isEditMode = !!existingAlert?.id;

  const allWallets = useSelector(selectAllWallets);
  const notificationAlerts = useSelector(getNotificationAlerts);

  const [step, setStep] = useState(isEditMode ? 4 : 1);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [selectedCoinKeys, setSelectedCoinKeys] = useState(new Set());
  const [addressMap, setAddressMap] = useState({});
  const [minAmountMap, setMinAmountMap] = useState({});
  const [configCoinKey, setConfigCoinKey] = useState(null);
  const [notifyOnReceive, setNotifyOnReceive] = useState(true);
  const [notifyOnSend, setNotifyOnSend] = useState(true);
  const [toggleError, setToggleError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [coinSearchQuery, setCoinSearchQuery] = useState('');
  const [showCoinPicker, setShowCoinPicker] = useState(false);
  const [showAmountWarning, setShowAmountWarning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isDoneRef = useRef(false);

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

  const selectedCoinEntries = useMemo(
    () =>
      walletCoins.filter(e =>
        selectedCoinKeys.has(coinKey(e.walletClientId, e.coin._id)),
      ),
    [walletCoins, selectedCoinKeys],
  );

  const currentMinAmount = configCoinKey
    ? minAmountMap[configCoinKey] ?? ''
    : '';

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
    setSelectedWallet(wallet);
    setSelectedCoinKeys(new Set([key]));
    setAddressMap({[key]: existingAlert.wallet});
    setMinAmountMap({
      [key]: existingAlert.minAmount ?? getDefaultMinAmount(coin),
    });
    setConfigCoinKey(key);
    setNotifyOnReceive(existingAlert.notifyOnReceive ?? true);
    setNotifyOnSend(existingAlert.notifyOnSend ?? true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditMode ? 'Edit Alert' : STEP_TITLES[step],
    });
  }, [step, navigation, isEditMode]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      if (!isDoneRef.current && !isEditMode && step > 1) {
        e.preventDefault();
        setStep(prev => prev - 1);
      }
    });
    return unsubscribe;
  }, [navigation, step, isEditMode]);

  const onSelectWallet = useCallback(wallet => {
    setSelectedWallet(wallet);
    setSelectedCoinKeys(new Set());
    setCoinSearchQuery('');
    setAddressMap({});
    setStep(2);
  }, []);

  const onToggleCoin = useCallback(entry => {
    const key = coinKey(entry.walletClientId, entry.coin._id);
    setSelectedCoinKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) {
          return next;
        }
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const onCoinsNext = useCallback(
    currentWalletCoins => {
      setAddressMap(prev => {
        const next = {...prev};
        for (const entry of currentWalletCoins.filter(e =>
          selectedCoinKeys.has(coinKey(e.walletClientId, e.coin._id)),
        )) {
          const key = coinKey(entry.walletClientId, entry.coin._id);
          if (!next[key]) {
            const options = buildAddressOptions(entry.coin);
            next[key] = options[0]?.value ?? entry.coin.address ?? '';
          }
        }
        return next;
      });
      setStep(3);
    },
    [selectedCoinKeys],
  );

  const onAddressNext = useCallback(currentEntries => {
    setMinAmountMap(prev => {
      const next = {...prev};
      for (const entry of currentEntries) {
        const key = coinKey(entry.walletClientId, entry.coin._id);
        if (!next[key]) {
          next[key] = getDefaultMinAmount(entry.coin);
        }
      }
      return next;
    });
    if (currentEntries[0]) {
      setConfigCoinKey(
        coinKey(currentEntries[0].walletClientId, currentEntries[0].coin._id),
      );
    }
    setStep(4);
  }, []);

  const onAddressChange = useCallback((key, value) => {
    setAddressMap(prev => ({...prev, [key]: value}));
  }, []);

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
      isDoneRef.current = true;
      navigation.goBack();
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {!isEditMode && (
        <View style={styles.stepIndicator}>
          {[1, 2, 3, 4].map(i => (
            <View
              key={i}
              style={[
                styles.stepDot,
                step >= i ? styles.stepDotActive : styles.stepDotInactive,
              ]}
            />
          ))}
        </View>
      )}

      {step === 1 && (
        <NotificationWalletStep
          wallets={allWallets}
          onSelectWallet={onSelectWallet}
        />
      )}

      {step === 2 && (
        <NotificationCoinStep
          coins={filteredCoins}
          selectedCoinKeys={selectedCoinKeys}
          onToggleCoin={onToggleCoin}
          searchQuery={coinSearchQuery}
          onSearchChange={setCoinSearchQuery}
          onNext={() => onCoinsNext(walletCoins)}
        />
      )}

      {step === 3 && (
        <NotificationAddressStep
          selectedCoinEntries={selectedCoinEntries}
          addressMap={addressMap}
          onAddressChange={onAddressChange}
          onNext={() => onAddressNext(selectedCoinEntries)}
        />
      )}

      {step === 4 && (
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
      )}

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

export default AddNotificationAlert;
