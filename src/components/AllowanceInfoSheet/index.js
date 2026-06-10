import React, {
  useContext,
  forwardRef,
  useImperativeHandle,
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {BottomSheetView} from '@gorhom/bottom-sheet';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DokBottomSheet from 'components/BottomSheet';
import {ThemeContext} from 'theme/ThemeContext';
import BigNumber from 'bignumber.js';
import {
  isEVMChain,
  isBalanceNotAvailable,
  GAS_CURRENCY,
} from 'dok-wallet-blockchain-networks/helper';
import {useDispatch, useSelector} from 'react-redux';
import {fetchStakingAllowanceEstimationFee} from 'dok-wallet-blockchain-networks/redux/staking/stakingSlice';
import {
  getStakingAllowance,
  getStakingAllowanceLoading,
} from 'dok-wallet-blockchain-networks/redux/staking/stakingSelectors';
import {
  selectCurrentCoin,
  selectUserCoins,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import AdvancedFeesSheet from '../AdvancedFeesSheet';

const selectNativeBalance = state => {
  const currentCoin = selectCurrentCoin(state);
  const allCoins = selectUserCoins(state);
  const nativeCoin = allCoins.find(
    item =>
      item.symbol === currentCoin?.chain_symbol &&
      item.chain_name === currentCoin?.chain_name &&
      item.type !== 'token',
  );
  return nativeCoin?.totalAmount || 0;
};

const AllowanceInfoSheet = forwardRef(
  (
    {
      symbol,
      tokenSymbol,
      requiredAmount,
      availableAmount,
      approveLoading,
      onContinue,
      stakingProviderName,
      amount,
      chainName,
      chainSymbol,
    },
    ref,
  ) => {
    const {theme} = useContext(ThemeContext);
    const styles = myStyles(theme);
    const bottomSheetRef = useRef(null);
    const dispatch = useDispatch();

    const allowanceData = useSelector(getStakingAllowance);
    const isLoading = useSelector(getStakingAllowanceLoading);
    const nativeBalance = useSelector(selectNativeBalance);

    const [isOpen, setIsOpen] = useState(false);
    const [selectedType, setSelectedType] = useState('manual');
    const [selectedFeesType, setSelectedFeesType] = useState('recommended');
    const [customGasPrice, setCustomGasPrice] = useState('');
    const [customNonce, setCustomNonce] = useState('');
    const [isFetchingFeesAgain, setIsFetchingFeesAgain] = useState(false);
    const isFetchingFeesRef = useRef(false);
    const advancedFeesSheetRef = useRef(null);

    const convertedChainName = isEVMChain(chainName) ? 'ethereum' : chainName;

    // Sync nonce input when allowanceData updates
    useEffect(() => {
      if (allowanceData?.nonce != null) {
        setCustomNonce(String(allowanceData.nonce));
      }
    }, [allowanceData?.nonce]);

    // Sync custom gas price default when feesOptions arrive
    useEffect(() => {
      if (allowanceData?.feesOptions?.[0]?.gasPrice != null) {
        setCustomGasPrice(String(allowanceData.feesOptions[0].gasPrice));
      }
    }, [allowanceData?.feesOptions]);

    const fetchEstimationFee = useCallback(() => {
      if (isFetchingFeesRef.current) {
        return;
      }
      isFetchingFeesRef.current = true;
      setIsFetchingFeesAgain(true);
      dispatch(
        fetchStakingAllowanceEstimationFee({stakingProviderName, amount}),
      )
        .unwrap()
        .then(() => {
          setIsFetchingFeesAgain(false);
          isFetchingFeesRef.current = false;
        })
        .catch(() => {
          setIsFetchingFeesAgain(false);
          isFetchingFeesRef.current = false;
        });
    }, [dispatch, stakingProviderName, amount]);

    // Fire once immediately when sheet opens, then repeat every 10 seconds
    useEffect(() => {
      if (!isOpen || !stakingProviderName || !amount) {
        return;
      }
      fetchEstimationFee();
      const interval = setInterval(fetchEstimationFee, 10000);
      return () => clearInterval(interval);
    }, [isOpen, stakingProviderName, amount, fetchEstimationFee]);

    // customizing the ref
    useImperativeHandle(ref, () => ({
      present: () => {
        setIsOpen(true);
        setSelectedType('manual');
        setSelectedFeesType('recommended');
        bottomSheetRef.current?.present();
      },
      close: () => {
        setIsOpen(false);
        bottomSheetRef.current?.close();
      },
    }));

    const handleClose = useCallback(() => {
      setIsOpen(false);
      bottomSheetRef.current?.close();
    }, []);

    const displayRequiredAmount =
      allowanceData?.stakeAmountFormatted || requiredAmount || '0';

    const insufficientBalance = useMemo(() => {
      if (!displayRequiredAmount || !availableAmount) {
        return false;
      }
      return new BigNumber(displayRequiredAmount).gt(
        new BigNumber(availableAmount),
      );
    }, [displayRequiredAmount, availableAmount]);

    const isInsufficientFeeBalance = useMemo(
      () =>
        !!nativeBalance &&
        !!allowanceData?.transactionFee &&
        isBalanceNotAvailable(nativeBalance, allowanceData.transactionFee),
      [nativeBalance, allowanceData?.transactionFee],
    );

    // Gas price in Gwei for the selected option
    const selectedGasPriceGwei = useMemo(() => {
      if (selectedFeesType === 'custom') {
        return parseFloat(customGasPrice) || 0;
      }
      if (selectedFeesType === 'normal') {
        return allowanceData?.feesOptions?.[1]?.gasPrice || 0;
      }
      return allowanceData?.feesOptions?.[0]?.gasPrice || 0;
    }, [selectedFeesType, customGasPrice, allowanceData?.feesOptions]);

    // Fee display: gasPrice (Gwei) * estimateGas / 1e9 = ETH
    const displayFee = useMemo(() => {
      try {
        if (!selectedGasPriceGwei || !allowanceData?.estimateGas) {
          return allowanceData?.transactionFee || '0';
        }
        return new BigNumber(selectedGasPriceGwei)
          .multipliedBy(new BigNumber(allowanceData.estimateGas))
          .dividedBy(new BigNumber(1e9))
          .toFixed(8);
      } catch {
        return allowanceData?.transactionFee || '0';
      }
    }, [
      selectedGasPriceGwei,
      allowanceData?.estimateGas,
      allowanceData?.transactionFee,
    ]);

    const handleContinue = useCallback(() => {
      if (!onContinue) {
        return;
      }
      const gasFeeWei =
        selectedFeesType === 'recommended' && allowanceData?.gasFee
          ? allowanceData.gasFee
          : String(
              Math.round(
                new BigNumber(selectedGasPriceGwei)
                  .multipliedBy(1e9)
                  .toNumber(),
              ),
            );
      const finalNonce = parseInt(customNonce, 10);
      onContinue({
        type: selectedType,
        gasFee: gasFeeWei,
        maxPriorityFeePerGas: allowanceData?.maxPriorityFeePerGas,
        estimateGas: allowanceData?.estimateGas,
        nonce: !isNaN(finalNonce) ? finalNonce : allowanceData?.nonce,
      });
    }, [
      onContinue,
      selectedType,
      selectedFeesType,
      selectedGasPriceGwei,
      customNonce,
      allowanceData,
    ]);

    const onSelectFeesType = useCallback((type, gasPrice) => {
      if (type === 'custom') {
        setSelectedFeesType('custom');
        return;
      }
      setCustomGasPrice(gasPrice?.toString() || '');
      setSelectedFeesType(type);
    }, []);

    const isDisabled =
      isLoading ||
      approveLoading ||
      insufficientBalance ||
      isInsufficientFeeBalance;

    const bottomSheetRefCallback = useCallback(sheetRef => {
      bottomSheetRef.current = sheetRef;
    }, []);
    console.log('allowanceData fee options:', allowanceData?.feesOptions);
    return (
      <>
        <DokBottomSheet
          bottomSheetRef={bottomSheetRefCallback}
          enableDynamicSizing={true}
          maxDynamicContentSize={750}
          onDismiss={handleClose}>
          <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <BottomSheetView style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={24}
                  color={theme.background}
                />
                <Text style={styles.title}>Token Allowance</Text>
              </View>

              {approveLoading ? (
                <View style={styles.approveLoadingView}>
                  <ActivityIndicator size="large" color={theme.background} />
                  <Text style={styles.approveLoadingText}>
                    Processing approval...
                  </Text>
                </View>
              ) : isLoading && !isFetchingFeesAgain ? (
                <View style={styles.loadingView}>
                  <ActivityIndicator size="small" color={theme.background} />
                  <Text style={styles.loadingText}>Fetching allowance...</Text>
                </View>
              ) : (
                <>
                  {allowanceData ? (
                    <View style={styles.statusRow}>
                      <MaterialCommunityIcons
                        name={
                          allowanceData.isApproved
                            ? 'check-circle'
                            : 'alert-circle'
                        }
                        size={18}
                        color={allowanceData.isApproved ? '#4CAF50' : '#FF9800'}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          allowanceData.isApproved
                            ? styles.statusApproved
                            : styles.statusPending,
                        ]}>
                        {allowanceData.isApproved
                          ? `Current allowance: ${parseFloat(
                              allowanceData.allowanceFormatted || '0',
                            ).toFixed(6)}`
                          : `Allowance required: ${parseFloat(
                              allowanceData.requiredFormatted || '0',
                            ).toFixed(6)} (current: ${parseFloat(
                              allowanceData.allowanceFormatted || '0',
                            ).toFixed(6)})`}
                      </Text>
                    </View>
                  ) : isFetchingFeesAgain ? (
                    <View style={styles.statusRow}>
                      <MaterialCommunityIcons
                        name="help-circle"
                        size={18}
                        color="#FF9800"
                      />
                      <Text style={[styles.statusText, styles.statusPending]}>
                        Current allowance: Refreshing...
                      </Text>
                    </View>
                  ) : null}

                  {/* Approval type cards */}
                  <Text style={styles.sectionLabel}>Select Approval Type</Text>
                  <View style={styles.cardsRow}>
                    <TouchableOpacity
                      style={[
                        styles.card,
                        selectedType === 'manual' && styles.cardSelected,
                      ]}
                      onPress={() => setSelectedType('manual')}
                      activeOpacity={0.75}>
                      <View style={styles.cardHeader}>
                        <MaterialCommunityIcons
                          name="pencil-outline"
                          size={20}
                          color={
                            selectedType === 'manual'
                              ? theme.background
                              : theme.gray
                          }
                        />
                        {selectedType === 'manual' ? (
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={16}
                            color={theme.background}
                          />
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.cardTitle,
                          selectedType === 'manual' && styles.cardTitleSelected,
                        ]}>
                        Manual
                      </Text>
                      <Text style={styles.cardDesc}>
                        Approve exact stake amount
                      </Text>
                      <Text
                        style={[
                          styles.cardAmount,
                          selectedType === 'manual' &&
                            styles.cardAmountSelected,
                        ]}
                        numberOfLines={1}>
                        {parseFloat(displayRequiredAmount).toFixed(6)}
                      </Text>
                      <Text style={styles.cardSymbol}>{tokenSymbol || ''}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.card,
                        selectedType === 'unlimited' && styles.cardSelected,
                      ]}
                      onPress={() => setSelectedType('unlimited')}
                      activeOpacity={0.75}>
                      <View style={styles.cardHeader}>
                        <MaterialCommunityIcons
                          name="infinity"
                          size={20}
                          color={
                            selectedType === 'unlimited'
                              ? theme.background
                              : theme.gray
                          }
                        />
                        {selectedType === 'unlimited' ? (
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={16}
                            color={theme.background}
                          />
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.cardTitle,
                          selectedType === 'unlimited' &&
                            styles.cardTitleSelected,
                        ]}>
                        Unlimited
                      </Text>
                      <Text style={styles.cardDesc}>Skip future approvals</Text>
                      <Text
                        style={[
                          styles.cardAmount,
                          selectedType === 'unlimited' &&
                            styles.cardAmountSelected,
                        ]}>
                        ∞
                      </Text>
                      <Text style={styles.cardSymbol}>{tokenSymbol || ''}</Text>
                    </TouchableOpacity>
                  </View>
                  {/* Hints */}
                  {insufficientBalance ? (
                    <Text style={styles.errorText}>
                      Insufficient balance. Amount exceeds available balance of{' '}
                      {parseFloat(availableAmount || '0').toFixed(6)}{' '}
                      {symbol || ''}.
                    </Text>
                  ) : (
                    <Text style={styles.hint}>
                      Approval transaction will be submitted before staking.
                    </Text>
                  )}
                  {/* Network Fee Row — tap to open AdvancedFeesSheet */}
                  <TouchableOpacity
                    style={styles.feeRow}
                    onPress={() => advancedFeesSheetRef.current?.present()}>
                    <View style={styles.feeLabelRow}>
                      <MaterialCommunityIcons
                        name="gas-station"
                        size={16}
                        color={theme.background}
                      />
                      <Text style={styles.feeSectionLabel}>Network Fee</Text>
                    </View>
                    <View style={styles.feeValueRow}>
                      <Text style={styles.feeSectionValue}>
                        {isFetchingFeesAgain
                          ? 'Refreshing...'
                          : `${displayFee} ${chainSymbol || ''}`}
                      </Text>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={18}
                        color={theme.gray}
                      />
                    </View>
                  </TouchableOpacity>
                  {isInsufficientFeeBalance ? (
                    <Text style={styles.errorText}>
                      {`Insufficient ${
                        chainSymbol || ''
                      } balance to pay the network fee.`}
                    </Text>
                  ) : null}
                </>
              )}

              {/* Action button */}
              {!approveLoading ? (
                onContinue ? (
                  <TouchableOpacity
                    disabled={isDisabled}
                    style={[styles.button, isDisabled && styles.buttonDisabled]}
                    onPress={handleContinue}>
                    <Text style={styles.buttonText}>Approve</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.button} onPress={handleClose}>
                    <Text style={styles.buttonText}>Close</Text>
                  </TouchableOpacity>
                )
              ) : null}
            </BottomSheetView>
          </TouchableWithoutFeedback>
        </DokBottomSheet>
        <AdvancedFeesSheet
          ref={advancedFeesSheetRef}
          feesOptions={allowanceData?.feesOptions}
          selectedFeesType={selectedFeesType}
          customFees={customGasPrice}
          customNonce={customNonce}
          chainName={convertedChainName}
          gasCurrency={GAS_CURRENCY[convertedChainName] || 'Gwei'}
          onSelectFeesType={onSelectFeesType}
          onChangeCustomFees={setCustomGasPrice}
          onChangeCustomNonce={setCustomNonce}
        />
      </>
    );
  },
);

const myStyles = theme =>
  StyleSheet.create({
    content: {
      padding: 20,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.headerBorder,
    },
    title: {
      fontSize: 18,
      fontFamily: 'Roboto-Regular',
      color: theme.font,
      fontWeight: '600',
    },
    loadingView: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
    },
    loadingText: {
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      color: theme.gray,
    },
    approveLoadingView: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      gap: 16,
    },
    approveLoadingText: {
      fontSize: 15,
      fontFamily: 'Roboto-Regular',
      color: theme.font,
      fontWeight: '500',
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 16,
    },
    statusText: {
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      fontWeight: '500',
      flexShrink: 1,
    },
    statusApproved: {
      color: '#4CAF50',
    },
    statusPending: {
      color: '#FF9800',
    },
    sectionLabel: {
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      color: theme.gray,
      marginBottom: 10,
    },
    cardsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    card: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: theme.headerBorder,
      borderRadius: 12,
      padding: 14,
      backgroundColor: 'transparent',
    },
    cardSelected: {
      borderColor: theme.background,
      backgroundColor: theme.background + '15',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    cardTitle: {
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
      color: theme.font,
      marginBottom: 4,
    },
    cardTitleSelected: {
      color: theme.background,
    },
    cardDesc: {
      fontSize: 11,
      fontFamily: 'Roboto-Regular',
      color: theme.gray,
      marginBottom: 10,
    },
    cardAmount: {
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
      color: theme.font,
    },
    cardAmountSelected: {
      color: theme.background,
    },
    cardSymbol: {
      fontSize: 11,
      fontFamily: 'Roboto-Regular',
      color: theme.gray,
      marginTop: 2,
    },
    hint: {
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      color: theme.gray,
      lineHeight: 18,
      marginBottom: 12,
    },
    errorText: {
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      color: '#F44336',
      lineHeight: 18,
      marginBottom: 12,
    },
    feeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.headerBorder,
      paddingTop: 16,
      marginBottom: 16,
    },
    feeLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    feeValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    feeSectionLabel: {
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      color: theme.font,
      fontWeight: '600',
    },
    feeSectionValue: {
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      color: theme.font,
      fontWeight: '500',
    },
    button: {
      height: 50,
      borderRadius: 12,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    buttonDisabled: {
      backgroundColor: '#708090',
    },
    buttonText: {
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      color: theme.title,
      fontWeight: '600',
    },
  });

export default AllowanceInfoSheet;
