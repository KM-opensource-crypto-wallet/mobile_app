import React, {useCallback, useContext, useMemo} from 'react';
import {
  View,
  FlatList,
  Text,
  BackHandler,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
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
} from 'dok-wallet-blockchain-networks/redux/coinSync/coinSyncSelectors';
import {
  syncAllCoins,
  cancelSync,
  resetCoinSync,
  toggleCoinSelection,
} from 'dok-wallet-blockchain-networks/redux/coinSync/coinSyncSlice';
import {addOrToggleCoinInWallet} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {showToast} from 'utils/toast';
import CoinSyncItem from 'components/CoinSyncItem';
import InteractionBlocker from 'components/InteractionBlocker';
import CoinSyncProgress from 'components/CoinSyncProgress';
import CoinSyncActionButton from 'components/CoinSyncActionButton';
import CoinSyncEmptyState from 'components/CoinSyncEmptyState';
import myStyles from './CoinSyncScreenStyles';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import {useEffect} from 'react';

const CoinSyncScreen = () => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();
  const navigation = useNavigation();

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

  // Derived state
  const isCompleted = status === 'completed';

  const resultsHeaderText = useMemo(() => {
    if (isCompleted) {
      return coinsWithBalanceCount > 0
        ? 'Select coins to add'
        : 'No coins with balance found';
    }
    return '';
  }, [isCompleted, coinsWithBalanceCount]);

  // Block back during wallet creation
  useEffect(() => {
    const onBackPress = () => {
      if (isCreatingWallets) {
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );
    return () => backHandler.remove();
  }, [isCreatingWallets]);

  // Handlers
  const handleStartSync = useCallback(() => {
    dispatch(syncAllCoins());
  }, [dispatch]);

  const handleCancel = useCallback(() => {
    dispatch(cancelSync());
  }, [dispatch]);

  const handleGoBack = useCallback(() => {
    if (isCreatingWallets) {
      return;
    }

    if (!isSyncing) {
      dispatch(resetCoinSync());
    }
    navigation.goBack();
  }, [dispatch, navigation, isSyncing, isCreatingWallets]);

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

    for (const coin of selectedCoins) {
      try {
        await dispatch(
          addOrToggleCoinInWallet({
            ...coin,
            walletIndex: syncingWalletIndex,
            forceInWallet: true,
          }),
        );
      } catch (err) {
        console.error('Error adding coin:', err);
      }
    }
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
          <View style={styles.navHeaderContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleGoBack}
              disabled={isCreatingWallets}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={isCreatingWallets ? theme.gray : theme.font}
              />
            </TouchableOpacity>
            <Text style={styles.title}>{'Sync Coin Balances'}</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView>
            <View style={styles.headerContainer}>
              <CoinSyncProgress
                theme={theme}
                progress={progress}
                currentCoin={currentCoin}
                isSyncing={isSyncing}
                status={status}
              />

              {isCompleted && coinsWithBalanceCount > 0 && (
                <Text style={styles.resultsHeader}>{resultsHeaderText}</Text>
              )}
            </View>

            <FlatList
              data={coinsWithBalance}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              ListEmptyComponent={renderEmptyList}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          </ScrollView>

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
    </View>
  );
};

export default CoinSyncScreen;
