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
  selectSyncingWalletIndex,
  selectSyncingWalletName,
} from 'dok-wallet-blockchain-networks/redux/coinSync/coinSyncSelectors';
import {
  syncAllCoins,
  cancelSync,
  resetCoinSync,
  toggleCoinSelection,
} from 'dok-wallet-blockchain-networks/redux/coinSync/coinSyncSlice';
import {addCoinsToWallet} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {
  selectAllWallets,
  getCurrentWalletIndex,
  isCoinScanAvailableForTimestamp,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {showToast} from 'utils/toast';
import CoinSyncItem from 'components/CoinSyncItem';
import ModalConfirm from 'components/ModalConfirm';
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
  const targetWalletIndex = route?.params?.walletIndex;
  const allWallets = useSelector(selectAllWallets);
  const currentWalletIndex = useSelector(getCurrentWalletIndex);
  const resolvedWalletIndex =
    targetWalletIndex !== undefined && targetWalletIndex !== null
      ? Number(targetWalletIndex)
      : currentWalletIndex;
  const targetWalletName =
    targetWalletIndex !== undefined && targetWalletIndex !== null
      ? allWallets?.[resolvedWalletIndex]?.walletName || null
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
  const syncingWalletIndex = useSelector(selectSyncingWalletIndex);
  const syncingWalletName = useSelector(selectSyncingWalletName);

  // Derived state
  const isCompleted = status === 'completed';
  // Coins found but not yet added - leaving the screen would discard them
  const hasPendingCoins = isCompleted && coinsWithBalanceCount > 0;
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const resultsHeaderText = useMemo(() => {
    if (isCompleted) {
      return coinsWithBalanceCount > 0
        ? 'Select coins to add'
        : 'No coins with balance found';
    }
    return '';
  }, [isCompleted, coinsWithBalanceCount]);

  // Clear leftovers from a previous scan of a DIFFERENT wallet (cancelled or
  // completed-and-never-dismissed) so this wallet's screen starts pristine.
  // Never clears an actively running scan or this wallet's own results.
  useEffect(() => {
    if (
      !isSyncing &&
      syncingWalletIndex !== null &&
      Number(syncingWalletIndex) !== Number(resolvedWalletIndex)
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
    const lastScanTimestamp =
      allWallets?.[resolvedWalletIndex]?.lastCoinsScanTimestamp;
    if (!isCoinScanAvailableForTimestamp(lastScanTimestamp)) {
      showToast({
        type: 'errorToast',
        title: 'Scan Unavailable',
        message: 'You can scan each wallet once every 24 hours',
      });
      return;
    }
    dispatch(syncAllCoins({walletIndex: resolvedWalletIndex}));
  }, [dispatch, allWallets, resolvedWalletIndex]);

  const handleCancel = useCallback(() => {
    dispatch(cancelSync());
  }, [dispatch]);

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
        walletIndex: syncingWalletIndex,
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
  }, [coinsWithBalance, dispatch, navigation, syncingWalletIndex]);

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
      <ModalConfirm
        visible={showLeaveConfirm}
        title={'Discard found coins?'}
        description={
          'The coins found in this scan will be removed if you go back without adding them.'
        }
        yesButtonTitle={'Discard'}
        noButtonTitle={'Stay'}
        onPressYes={handleConfirmLeave}
        onPressNo={handleCancelLeave}
      />
    </View>
  );
};

export default CoinSyncScreen;
