import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {View, StyleSheet, Text, TouchableOpacity, Keyboard} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {ThemeContext} from 'theme/ThemeContext';
import {useSelector, useDispatch} from 'react-redux';
import {getBatchTransactions} from 'dok-wallet-blockchain-networks/redux/batchTransaction/batchTransactionSelectors';
import {selectCurrentWallet} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {clearAllBatchTransactions} from 'dok-wallet-blockchain-networks/redux/batchTransaction/batchTransactionSlice';
import ModalConfirm from 'components/ModalConfirm';
import BatchTransactionSheet from 'components/BatchTransactionSheet';

const BatchTransactionBanner = () => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const batchTransactions = useSelector(getBatchTransactions);
  const currentWallet = useSelector(selectCurrentWallet);
  const dispatch = useDispatch();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const walletSheetRef = useRef();

  const {transactionCount, displayText, walletTransactions} = useMemo(() => {
    if (!batchTransactions || !currentWallet?.clientId) {
      return {transactionCount: 0, chainCount: 0, displayText: ''};
    }

    const localWalletTransactions =
      batchTransactions[currentWallet.clientId] || [];
    const totalTransactions = localWalletTransactions.length || 0;

    if (totalTransactions === 0) {
      return {transactionCount: 0, chainCount: 0, displayText: ''};
    }

    // Get unique chains from transactions
    const chains = [
      ...new Set(localWalletTransactions.map(tx => tx.chain_display_name)),
    ].filter(Boolean);

    let chainText = '';
    if (chains.length === 1) {
      chainText = ` on ${chains[0]}`;
    } else if (chains.length > 1) {
      chainText = ` across ${chains.length} chains (${chains.join(', ')})`;
    }

    const transactionText = `${totalTransactions} ${
      totalTransactions === 1 ? 'transaction' : 'transactions'
    }`;

    return {
      transactionCount: totalTransactions,
      chainCount: chains.length,
      displayText: `${transactionText} pending ${chainText}. Tap to view details.`,
      walletTransactions: localWalletTransactions,
    };
  }, [batchTransactions, currentWallet]);

  const handleClose = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    setShowConfirmModal(false);
    dispatch(clearAllBatchTransactions({wallet_id: currentWallet?.clientId}));
  }, [dispatch, currentWallet?.clientId]);

  const handleCancelDelete = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  const onBottomSheetRef = useCallback(ref => {
    walletSheetRef.current = ref;
  }, []);

  const onPressView = useCallback(() => {
    Keyboard.dismiss();
    walletSheetRef.current?.close?.();
    walletSheetRef.current?.present?.();
  }, []);

  const onDismissSheet = useCallback(() => {
    Keyboard.dismiss();
    walletSheetRef.current?.close?.();
  }, []);

  useEffect(() => {
    if (transactionCount === 0) {
      walletSheetRef.current?.close?.();
    }
  }, [transactionCount]);

  if (transactionCount === 0) {
    return null;
  }

  return (
    <View style={styles.batchView}>
      <View style={styles.contentContainer}>
        <Text style={styles.batchTitle} numberOfLines={2}>
          {displayText}
        </Text>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.viewButton} onPress={onPressView}>
            <Text style={styles.viewButtonTitle}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleClose}>
            <MaterialCommunityIcons name={'delete'} size={20} color={'white'} />
          </TouchableOpacity>
        </View>
      </View>
      <ModalConfirm
        visible={showConfirmModal}
        title="Clear Batch Transactions"
        description={`Are you sure you want to clear all ${transactionCount} pending batch ${
          transactionCount === 1 ? 'transaction' : 'transactions'
        }? This action cannot be undone.`}
        onPressYes={handleConfirmDelete}
        onPressNo={handleCancelDelete}
        yesButtonTitle="Clear All"
        noButtonTitle="Cancel"
      />
      <BatchTransactionSheet
        transactions={walletTransactions}
        onDismiss={onDismissSheet}
        bottomSheetRef={onBottomSheetRef}
      />
    </View>
  );
};

const myStyles = theme =>
  StyleSheet.create({
    batchView: {
      backgroundColor: theme.walletItemColor,
      borderRadius: 12,
      marginHorizontal: 16,
      marginVertical: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    contentContainer: {
      padding: 12,
    },
    batchTitle: {
      color: theme.font,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      fontWeight: '500',
      lineHeight: 18,
      marginBottom: 8,
    },
    buttonsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    viewButton: {
      backgroundColor: theme.background,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      flex: 1,
      marginRight: 12,
      alignItems: 'center',
    },
    viewButtonTitle: {
      color: 'white',
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
    },
    deleteButton: {
      backgroundColor: '#ff4757',
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default BatchTransactionBanner;
