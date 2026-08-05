import React, {
  useCallback,
  useContext,
  useMemo,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import {
  View,
  FlatList,
  Text,
  BackHandler,
  TouchableOpacity,
} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  selectCoinSyncStatus,
  selectCoinSyncProgress,
  selectCurrentSyncingCoin,
  selectCoinsWithBalance,
  selectIsCreatingWallets,
  selectIsSyncing,
  selectSelectedCount,
  selectCoinsWithBalanceCount,
  selectSyncingWalletClientId,
  selectSyncingWalletName,
} from 'dok-wallet-blockchain-networks/redux/coinSync/coinSyncSelectors';
import {
  syncAllCoins,
  cancelSyncWithCooldown,
  resetCoinSync,
  toggleCoinSelection,
} from 'dok-wallet-blockchain-networks/redux/coinSync/coinSyncSlice';
import {addCoinsToWallet} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {
  selectAllWallets,
  selectCurrentWalletClientId,
  isCoinScanAvailableForTimestamp,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {showToast} from 'utils/toast';
import CoinSyncItem from 'components/CoinSyncItem';
import ConfirmationModal from 'components/ConfirmationModal';
import InteractionBlocker from 'components/InteractionBlocker';
import CoinSyncProgress from 'components/CoinSyncProgress';
import CoinSyncActionButton from 'components/CoinSyncActionButton';
import CoinSyncEmptyState from 'components/CoinSyncEmptyState';
import myStyles from './CoinSyncScreenStyles';
import Back from 'assets/images/sidebarIcons/Back.svg';
import {DokSafeAreaView} from 'components/DokSafeAreaView';

const CoinSyncScreen = () => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  // Wallet to scan (from the Scan Coins row); undefined = current wallet
  const targetWalletClientId = route?.params?.walletClientId;
  const allWallets = useSelector(selectAllWallets);
  const currentWalletClientId = useSelector(selectCurrentWalletClientId);
  const resolvedWalletClientId = targetWalletClientId || currentWalletClientId;
  const resolvedWallet = allWallets?.find(
    item => item?.clientId === resolvedWalletClientId,
  );
  const targetWalletName = targetWalletClientId
    ? resolvedWallet?.walletName || null
    : null;

  // Selectors
  const status = useSelector(selectCoinSyncStatus);
  const progress = useSelector(selectCoinSyncProgress);
  const currentCoin = useSelector(selectCurrentSyncingCoin);
  const coinsWithBalance = useSelector(selectCoinsWithBalance);
  const coinsWithBalanceCount = useSelector(selectCoinsWithBalanceCount);
  const isCreatingWallets = useSelector(selectIsCreatingWallets);
  const isSyncing = useSelector(selectIsSyncing);
  const selectedCount = useSelector(selectSelectedCount);
  const syncingWalletClientId = useSelector(selectSyncingWalletClientId);
  const syncingWalletName = useSelector(selectSyncingWalletName);

  // Derived state
  const isCompleted = status === 'completed';
  // Coins found but not yet added - leaving the screen would discard them
  const hasPendingCoins = isCompleted && coinsWithBalanceCount > 0;
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const resultsHeaderText = useMemo(() => {
    if (isCompleted) {
      return coinsWithBalanceCount > 0
        ? 'Select coins to add'
        : 'No coins with balance found';
    }
    return '';
  }, [isCompleted, coinsWithBalanceCount]);

  // Copy for the leave-with-pending-coins confirmation
  const discardCopy = useMemo(() => {
    const walletName = syncingWalletName || targetWalletName;
    const isSingle = coinsWithBalanceCount === 1;
    const coinWord = isSingle ? 'coin' : 'coins';
    return {
      title: `Discard ${coinsWithBalanceCount} found ${coinWord}?`,
      subtitle: `We found ${coinsWithBalanceCount} ${coinWord} with a balance${
        walletName ? ` in "${walletName}"` : ''
      }. Going back now removes ${
        isSingle ? 'it' : 'them'
      } from this scan without adding ${
        isSingle ? 'it' : 'them'
      } to your wallet.`,
    };
  }, [coinsWithBalanceCount, syncingWalletName, targetWalletName]);

  // Clear leftovers from a previous scan of a DIFFERENT wallet (cancelled or
  // completed-and-never-dismissed) so this wallet's screen starts pristine.
  // Never clears an actively running scan or this wallet's own results.
  useEffect(() => {
    if (
      !isSyncing &&
      syncingWalletClientId !== null &&
      syncingWalletClientId !== resolvedWalletClientId
    ) {
      dispatch(resetCoinSync());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Disable iOS swipe-back while found coins are pending, so the user
  // can't discard them without going through the confirmation modal
  useEffect(() => {
    navigation.setOptions({gestureEnabled: !hasPendingCoins});
  }, [navigation, hasPendingCoins]);

  // Block back during wallet creation; confirm before discarding
  // pending found coins (Android hardware back)
  useEffect(() => {
    const onBackPress = () => {
      if (isCreatingWallets) {
        return true;
      }
      if (hasPendingCoins) {
        setShowLeaveConfirm(true);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );
    return () => backHandler.remove();
  }, [isCreatingWallets, hasPendingCoins]);

  // Handlers
  const handleStartSync = useCallback(() => {
    const lastScanTimestamp = resolvedWallet?.lastCoinsScanTimestamp;
    if (!isCoinScanAvailableForTimestamp(lastScanTimestamp)) {
      showToast({
        type: 'errorToast',
        title: 'Scan Unavailable',
        message: 'You can scan each wallet once every 24 hours',
      });
      return;
    }
    dispatch(syncAllCoins({walletClientId: resolvedWalletClientId}));
  }, [dispatch, resolvedWallet, resolvedWalletClientId]);

  // Cancelling arms the 24h cooldown, so always confirm first
  const handleCancel = useCallback(() => {
    setShowCancelConfirm(true);
  }, []);

  const handleConfirmCancelScan = useCallback(() => {
    setShowCancelConfirm(false);
    if (!isSyncing) {
      // Scan finished while the modal was open - completion already
      // armed the cooldown, nothing left to cancel
      return;
    }
    dispatch(cancelSyncWithCooldown());
    if (coinsWithBalanceCount === 0) {
      // With partial results the 'completed' selection UI stays visible;
      // with nothing found the state resets, so explain the cooldown
      showToast({
        type: 'warningToast',
        title: 'Scan Cancelled',
        message: 'You can scan this wallet again in 24 hours',
      });
    }
  }, [dispatch, isSyncing, coinsWithBalanceCount]);

  const handleDismissCancelScan = useCallback(() => {
    setShowCancelConfirm(false);
  }, []);

  // Close the cancel confirmation if the scan finishes or errors
  // underneath it - there is nothing left to cancel
  useEffect(() => {
    if (showCancelConfirm && !isSyncing) {
      setShowCancelConfirm(false);
    }
  }, [showCancelConfirm, isSyncing]);

  const handleGoBack = useCallback(() => {
    if (isCreatingWallets) {
      return;
    }

    if (hasPendingCoins) {
      setShowLeaveConfirm(true);
      return;
    }

    if (!isSyncing) {
      dispatch(resetCoinSync());
    }
    navigation.goBack();
  }, [dispatch, navigation, isSyncing, isCreatingWallets, hasPendingCoins]);

  const headerTitle =
    syncingWalletName && (isSyncing || isCompleted)
      ? `Sync - ${syncingWalletName}`
      : targetWalletName
      ? `Sync - ${targetWalletName}`
      : 'Sync Coin Balances';

  useLayoutEffect(() => {
    navigation.setOptions({
      title: headerTitle,
      headerLeft: () => (
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={handleGoBack}
          disabled={isCreatingWallets}>
          <Back
            width="22"
            height="18"
            fill={isCreatingWallets ? theme.gray : theme.borderActiveColor}
          />
        </TouchableOpacity>
      ),
    });
  }, [
    navigation,
    headerTitle,
    handleGoBack,
    isCreatingWallets,
    styles.headerBackButton,
    theme.gray,
    theme.borderActiveColor,
  ]);

  const handleConfirmLeave = useCallback(() => {
    setShowLeaveConfirm(false);
    dispatch(resetCoinSync());
    navigation.goBack();
  }, [dispatch, navigation]);

  const handleCancelLeave = useCallback(() => {
    setShowLeaveConfirm(false);
  }, []);

  const handleToggleSelection = useCallback(
    index => {
      dispatch(toggleCoinSelection(index));
    },
    [dispatch],
  );

  const handleAddSelectedCoins = useCallback(async () => {
    const selectedCoins = coinsWithBalance.filter(c => c.isSelected);
    if (selectedCoins.length === 0) {
      dispatch(resetCoinSync());
      navigation.goBack();
      return;
    }
    dispatch(
      addCoinsToWallet({
        coins: selectedCoins,
        clientId: syncingWalletClientId,
      }),
    );
    showToast({
      type: 'successToast',
      title: 'Coins Added',
      message: `Added ${selectedCoins.length} coin${
        selectedCoins.length > 1 ? 's' : ''
      } to your wallet`,
    });
    dispatch(resetCoinSync());
    navigation.goBack();
  }, [coinsWithBalance, dispatch, navigation, syncingWalletClientId]);

  const renderItem = useCallback(
    ({item, index}) => (
      <CoinSyncItem
        coin={item}
        theme={theme}
        isSelectable={isCompleted}
        isSelected={item.isSelected}
        onToggle={() => handleToggleSelection(index)}
      />
    ),
    [theme, isCompleted, handleToggleSelection],
  );

  const keyExtractor = useCallback(
    (item, index) => item._id || `${item.symbol}_${index}`,
    [],
  );

  const renderEmptyList = useCallback(
    () => (
      <CoinSyncEmptyState
        theme={theme}
        isSyncing={isSyncing}
        status={status}
        hasCoinsWithBalance={coinsWithBalanceCount > 0}
      />
    ),
    [theme, isSyncing, status, coinsWithBalanceCount],
  );

  return (
    <View style={styles.safeArea}>
      <DokSafeAreaView style={styles.container}>
        <View style={styles.container}>
          <FlatList
            data={coinsWithBalance}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListEmptyComponent={renderEmptyList}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.headerContainer}>
                <CoinSyncProgress
                  theme={theme}
                  progress={progress}
                  currentCoin={currentCoin}
                  isSyncing={isSyncing}
                  status={status}
                  syncingWalletName={syncingWalletName}
                />

                {coinsWithBalanceCount > 0 && (
                  <Text style={styles.resultsHeader}>{resultsHeaderText}</Text>
                )}
              </View>
            }
          />

          <CoinSyncActionButton
            theme={theme}
            status={status}
            onStartSync={handleStartSync}
            onCancel={handleCancel}
            onAddCoins={handleAddSelectedCoins}
            selectedCount={selectedCount}
            totalCoinsWithBalance={coinsWithBalanceCount}
            disabled={isCreatingWallets}
          />
        </View>
      </DokSafeAreaView>
      <InteractionBlocker visible={isCreatingWallets} theme={theme} />
      <ConfirmationModal
        visible={showLeaveConfirm}
        title={discardCopy.title}
        subtitle={discardCopy.subtitle}
        infoText={
          "Scanning is limited to once every 24 hours, so you won't be able to rescan this wallet until tomorrow."
        }
        confirmLabel={'Discard'}
        dismissLabel={'Stay'}
        onConfirm={handleConfirmLeave}
        onDismiss={handleCancelLeave}
      />
      <ConfirmationModal
        visible={showCancelConfirm}
        title={'Cancel scan?'}
        subtitle={
          "Are you sure you want to cancel? Once you cancel, you won't be able to scan this wallet again for 24 hours."
        }
        infoText={
          coinsWithBalanceCount > 0
            ? 'Coins found so far will still be available to add to your wallet.'
            : null
        }
        infoIcon={'check-circle-outline'}
        confirmLabel={'Cancel Scan'}
        dismissLabel={'Keep Scanning'}
        onConfirm={handleConfirmCancelScan}
        onDismiss={handleDismissCancelScan}
      />
    </View>
  );
};

export default CoinSyncScreen;
