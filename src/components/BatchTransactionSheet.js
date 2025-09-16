import React, {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useEffect,
  useState,
} from 'react';
import {View, StyleSheet, Text, TouchableOpacity} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {ThemeContext} from 'theme/ThemeContext';
import DokBottomSheet from 'components/BottomSheet';
import DokDropdown from 'components/DokDropdown';
import {BottomSheetFlatList} from '@gorhom/bottom-sheet';
import BatchTransactionItem from 'components/BatchTransactionItem';
import {useDispatch, useSelector} from 'react-redux';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {
  removeBatchTransaction,
  setSelectedChain,
  setSelectedAddress,
  setIsSelectionMode,
  toggleSelectedItem,
  clearSelectedItems,
  initializeFilters,
} from 'dok-wallet-blockchain-networks/redux/batchTransaction/batchTransactionSlice';
import {
  getUniqueChains,
  getUniqueAddresses,
  getFilteredTransactions,
  getWalletIdFromTransactions,
  getSelectedChain,
  getSelectedAddress,
  getIsSelectionMode,
  getSelectedItems,
  getFilterLoading,
  getShouldShowDropdowns,
  getBatchTransactionIsValid,
  getBatchTransactionInvalidReason,
} from 'dok-wallet-blockchain-networks/redux/batchTransaction/batchTransactionSelectors';
import {
  calculateEstimateFee,
  updateCurrentTransferData,
} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSlice';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Loading from 'components/Loading';

const BatchTransactionSheet = ({bottomSheetRef, onDismiss, transactions}) => {
  const {theme} = useContext(ThemeContext);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {bottom = 0} = useSafeAreaInsets();
  const styles = myStyles(theme, bottom);
  const localCurrency = useSelector(getLocalCurrency);
  const selectedChain = useSelector(getSelectedChain);
  const selectedAddress = useSelector(getSelectedAddress);
  const isSelectionMode = useSelector(getIsSelectionMode);
  const selectedItems = useSelector(getSelectedItems);
  const filteredTransactions = useSelector(getFilteredTransactions);
  const uniqueChains = useSelector(getUniqueChains);
  const uniqueAddresses = useSelector(getUniqueAddresses);
  const filterLoading = useSelector(getFilterLoading);
  const shouldShowDropdowns = useSelector(getShouldShowDropdowns);
  const isValid = useSelector(getBatchTransactionIsValid);
  const invalid_reason = useSelector(getBatchTransactionInvalidReason);
  const bottomRef = useRef();
  const [isVisible, setIsVisible] = useState(false);
  const wallet_id = useMemo(() => {
    return getWalletIdFromTransactions(null, filteredTransactions);
  }, [filteredTransactions]);
  useEffect(() => {
    if (isVisible && transactions) {
      dispatch(
        initializeFilters({
          transactions,
          selectedChain,
          selectedAddress,
          isFetchDetails: true,
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, isVisible]);

  const handleSheetChange = useCallback(
    index => {
      setIsVisible(index >= 0);
    },
    [setIsVisible],
  );

  const handleToggleSelection = useCallback(
    transactionId => {
      dispatch(toggleSelectedItem(transactionId));
    },
    [dispatch],
  );

  const handleDeleteSelected = useCallback(() => {
    dispatch(
      removeBatchTransaction({
        wallet_id,
        transactionIds: selectedItems,
      }),
    );
    dispatch(clearSelectedItems());
    dispatch(setIsSelectionMode(false));
    const isDeleteAll = selectedItems?.length === filteredTransactions.length;
    if (isDeleteAll) {
      dispatch(setSelectedAddress(''));
      dispatch(setSelectedChain(''));
    }
    if (transactions?.length !== selectedItems?.length) {
      dispatch(
        initializeFilters({
          transactions,
          selectedChain: !isDeleteAll ? selectedChain : '',
          selectedAddress: !isDeleteAll ? selectedAddress : '',
        }),
      );
    }
  }, [
    dispatch,
    filteredTransactions.length,
    selectedAddress,
    selectedChain,
    selectedItems,
    transactions,
    wallet_id,
  ]);

  const handleToggleSelectionMode = useCallback(() => {
    dispatch(setIsSelectionMode(!isSelectionMode));
    dispatch(clearSelectedItems());
  }, [dispatch, isSelectionMode]);

  const renderTransactionItem = useCallback(
    ({item}) => {
      const isSelected = selectedItems.includes(item.transactionId);

      return (
        <BatchTransactionItem
          item={item}
          isSelected={isSelected}
          isSelectionMode={isSelectionMode}
          localCurrency={localCurrency}
          onToggleSelection={handleToggleSelection}
        />
      );
    },
    [selectedItems, isSelectionMode, localCurrency, handleToggleSelection],
  );

  const handleSubmit = useCallback(() => {
    const calls = filteredTransactions?.reduce((acc, item) => {
      acc.push(item.calls);
      return acc;
    }, []);
    const transferData = {
      currentCoin: filteredTransactions?.[0]?.coinInfo,
      isBatchTransaction: true,
      calls: calls,
      transactionsData: filteredTransactions,
    };
    dispatch(updateCurrentTransferData(transferData));
    dispatch(
      calculateEstimateFee({
        currentCoin: filteredTransactions?.[0]?.coinInfo,
        transferData,
        isBatchTransaction: true,
        calls: calls,
      }),
    );
    onDismiss();
    navigation.navigate('Transfer', {
      fromScreen: 'BatchTransaction',
    });
  }, [dispatch, filteredTransactions, navigation, onDismiss]);

  return (
    <DokBottomSheet
      snapPoints={['90%']}
      bottomSheetRef={ref => {
        bottomSheetRef(ref);
        bottomRef.current = ref;
      }}
      onDismiss={onDismiss}
      onChange={handleSheetChange}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Batch Transactions</Text>
          <TouchableOpacity
            style={styles.selectionToggle}
            onPress={handleToggleSelectionMode}>
            <MaterialCommunityIcons
              name={
                isSelectionMode ? 'close' : 'checkbox-multiple-marked-outline'
              }
              size={24}
              color={theme.font}
            />
          </TouchableOpacity>
        </View>

        {isSelectionMode && selectedItems.length > 0 && (
          <View style={styles.selectionActions}>
            <Text style={styles.selectionCount}>
              {selectedItems.length} selected
            </Text>
            <TouchableOpacity
              style={styles.deleteSelectedButton}
              onPress={handleDeleteSelected}>
              <MaterialCommunityIcons name="delete" size={20} color="#fff" />
              <Text style={styles.deleteSelectedText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}

        {shouldShowDropdowns && (
          <View style={styles.filtersContainer}>
            {uniqueChains.length > 1 && (
              <View style={styles.filterItem}>
                <DokDropdown
                  title="Chain"
                  data={uniqueChains}
                  value={selectedChain}
                  disabled={filterLoading}
                  onChangeValue={item => {
                    const foundTransaction = transactions?.find(
                      subItem => subItem?.coinInfo?.chain_name === item.value,
                    );
                    dispatch(
                      setSelectedAddress(foundTransaction?.coinInfo?.address),
                    );
                    dispatch(setSelectedChain(item.value));
                    dispatch(clearSelectedItems());
                    dispatch(
                      initializeFilters({
                        transactions,
                        selectedChain: item.value,
                        selectedAddress: foundTransaction?.coinInfo?.address,
                        isFetchDetails: true,
                      }),
                    );
                  }}
                  placeholder="Select Chain"
                />
              </View>
            )}
            {uniqueAddresses.length > 1 && (
              <View style={styles.filterItem}>
                <DokDropdown
                  title="Address"
                  data={uniqueAddresses}
                  value={selectedAddress}
                  disabled={filterLoading}
                  onChangeValue={item => {
                    dispatch(setSelectedAddress(item.value));
                    dispatch(clearSelectedItems());
                    dispatch(
                      initializeFilters({
                        transactions,
                        selectedChain,
                        selectedAddress: item.value,
                        isFetchDetails: true,
                      }),
                    );
                  }}
                  placeholder="Select Address"
                />
              </View>
            )}
          </View>
        )}

        <View style={styles.transactionListContainer}>
          {filterLoading || !isVisible ? (
            <View style={styles.loadingContainer}>
              <Loading />
            </View>
          ) : (
            <>
              <BottomSheetFlatList
                data={filteredTransactions}
                renderItem={renderTransactionItem}
                keyExtractor={item => item.transactionId}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.flatListContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No transactions found</Text>
                  </View>
                }
              />
              <View style={styles.bottomActionsContainer}>
                {invalid_reason && (
                  <>
                    <View style={styles.invalidReasonContainer}>
                      <Text style={styles.invalidReasonText}>
                        {invalid_reason}
                      </Text>
                    </View>
                  </>
                )}
                <TouchableOpacity
                  disabled={!isValid || filterLoading}
                  style={{
                    ...styles.button,
                    backgroundColor:
                      isValid && !filterLoading ? theme.background : theme.gray,
                  }}
                  onPress={handleSubmit}>
                  <Text style={styles.buttonTitle}>
                    {filterLoading ? 'Loading...' : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </DokBottomSheet>
  );
};

const myStyles = (theme, bottom) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
      backgroundColor: theme.backgroundColor,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.font,
      textAlign: 'center',
    },
    filtersContainer: {
      marginBottom: 16,
    },
    filterItem: {
      marginBottom: 12,
    },
    transactionListContainer: {
      flex: 1,
    },
    flatListContent: {
      paddingBottom: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    selectionToggle: {
      padding: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectionActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.lightBackground,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    selectionCount: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.font,
    },
    deleteSelectedButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ff4444',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    deleteSelectedText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 4,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: theme.gray,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      fontSize: 16,
      color: theme.gray,
      textAlign: 'center',
    },
    button: {
      height: 60,
      borderRadius: 10,
      fontSize: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20 + bottom,
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 18,
      fontFamily: 'Roboto-Regular',
    },
    divider: {
      height: 1,
      backgroundColor: theme.border || theme.gray,
      marginVertical: 16,
      shadowColor: theme.font,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    invalidReasonContainer: {
      backgroundColor: theme.errorBackground || '#ffebee',
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: theme.error || '#f44336',
    },
    invalidReasonText: {
      color: theme.error || '#f44336',
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
    },
    bottomActionsContainer: {
      backgroundColor: theme.backgroundColor,
      paddingTop: 16,
      marginHorizontal: -16,
      paddingHorizontal: 16,
      shadowColor: theme.font,
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
  });

export default BatchTransactionSheet;
