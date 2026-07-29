import React, {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {BottomSheetView} from '@gorhom/bottom-sheet';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DokBottomSheet from 'components/BottomSheet';
import {ThemeContext} from 'theme/ThemeContext';
import BigNumber from 'bignumber.js';
import {
  isBalanceNotAvailable,
  GAS_CURRENCY,
  delay,
  validateNumberInInput,
} from 'dok-wallet-blockchain-networks/helper';
import {useDispatch, useSelector} from 'react-redux';
import {fetchExchangePermitApproveEstimationFee} from 'dok-wallet-blockchain-networks/redux/exchange/exchangeSlice';
import {
  getExchangePermitAllowance,
  getExchangePermitAllowanceLoading,
} from 'dok-wallet-blockchain-networks/redux/exchange/exchangeSelectors';
import {selectUserCoins} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import AdvancedFeesSheet from 'components/AdvancedFeesSheet';
import ModalConfirmTransaction from 'components/ModalConfirmTransaction';

const selectNativeBalance = (chainName, chainSymbol) => state => {
  const allCoins = selectUserCoins(state);
  const nativeCoin = allCoins.find(
    item =>
      item.symbol === chainSymbol &&
      item.chain_name === chainName &&
      item.type !== 'token',
  );
  return nativeCoin?.totalAmount || 0;
};

// Router-level (Permit2) allowance confirmation, shown after the ERC20-level
// AllowanceInfoSheet approval when the swap quote uses a permit2 spender
// (swapData.permit_abi is present).
const PermitInfoSheet = forwardRef(
  (
    {
      tokenSymbol,
      requiredAmount,
      availableAmount,
      approveLoading,
      onContinue,
      chainName,
      chainSymbol,
    },
    ref,
  ) => {
    const {theme} = useContext(ThemeContext);
    const styles = myStyles(theme);
    const bottomSheetRef = useRef(null);
    const dispatch = useDispatch();

    const permitAllowanceData = useSelector(getExchangePermitAllowance);
    const isLoading = useSelector(getExchangePermitAllowanceLoading);
    const nativeBalance = useSelector(
      selectNativeBalance(chainName, chainSymbol),
    );

    const [isOpen, setIsOpen] = useState(false);
    const [selectedType, setSelectedType] = useState('manual');
    const [selectedFeesType, setSelectedFeesType] = useState('recommended');

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [customNonce, setCustomNonce] = useState('');
    const [isFetchingFeesAgain, setIsFetchingFeesAgain] = useState(false);
    const [hasError, setHasError] = useState(false);
    const isFetchingFeesRef = useRef(false);
    const advancedFeesSheetRef = useRef(null);
    const selectedFeesTypeRef = useRef('recommended');
    const isPauseCalculateFees = useRef(false);
    const [customFees, setCustomFees] = useState('');

    // Refs mirror volatile values so the fetch can read them at call time
    // without being recreated on every change (keeps the interval stable).
    const customNonceRef = useRef('');
    const selectedTypeRef = useRef('manual');
    const permitAllowanceDataRef = useRef(null);

    useEffect(() => {
      customNonceRef.current = customNonce;
    }, [customNonce]);
    useEffect(() => {
      selectedTypeRef.current = selectedType;
    }, [selectedType]);
    useEffect(() => {
      permitAllowanceDataRef.current = permitAllowanceData;
    }, [permitAllowanceData]);

    // Sync nonce input when permitAllowanceData updates
    useEffect(() => {
      if (permitAllowanceData?.nonce != null) {
        setCustomNonce(String(permitAllowanceData.nonce));
      }
    }, [permitAllowanceData?.nonce]);

    // Sync custom gas price default when feesOptions arrive, but not if user has selected custom
    useEffect(() => {
      if (
        permitAllowanceData?.feesOptions?.[0]?.gasPrice &&
        selectedFeesTypeRef.current !== 'custom'
      ) {
        setCustomFees(permitAllowanceData?.feesOptions?.[0]?.gasPrice);
      }
    }, [permitAllowanceData?.feesOptions]);

    const onChangeCustomFees = useCallback(
      text => {
        const tempValues = validateNumberInInput(
          text,
          permitAllowanceData?.decimal,
        );
        setCustomFees(tempValues);
      },
      [permitAllowanceData?.decimal],
    );

    const onChangeCustomNonce = useCallback(text => {
      const numericValue = text.replace(/[^0-9]/g, '');
      setCustomNonce(numericValue);
    }, []);

    // Stable across renders: depends only on the props it sends. Volatile values
    // (nonce, fees type, custom inputs) are read from refs at call time, so
    // completing a fetch never recreates this callback.
    const fetchEstimationFee = useCallback(() => {
      if (isFetchingFeesRef.current) {
        return;
      }
      isFetchingFeesRef.current = true;
      setIsFetchingFeesAgain(true);
      setHasError(false);
      const latestPermitAllowanceData = permitAllowanceDataRef.current;
      dispatch(
        fetchExchangePermitApproveEstimationFee({
          feesType: selectedFeesTypeRef.current,
          nonce: customNonceRef.current || latestPermitAllowanceData?.nonce,
        }),
      )
        .unwrap()
        .then(() => {
          setIsFetchingFeesAgain(false);
          isFetchingFeesRef.current = false;
        })
        .catch(error => {
          console.error('error in call', error);
          setIsFetchingFeesAgain(false);
          isFetchingFeesRef.current = false;
          setHasError(true);
        });
    }, [dispatch]);

    // Single source of fee refresh: fire once when the sheet opens, then every
    // 10s. The tick is gated by refs (in-flight + pause), so it never piles up
    // and never runs while custom fees are selected or a transaction is pending.
    useEffect(() => {
      if (!isOpen) {
        return;
      }
      fetchEstimationFee();
      const interval = setInterval(() => {
        if (!isFetchingFeesRef.current && !isPauseCalculateFees.current) {
          fetchEstimationFee();
        }
      }, 10000);
      return () => clearInterval(interval);
    }, [isOpen, fetchEstimationFee]);

    // customizing the ref
    useImperativeHandle(ref, () => ({
      present: () => {
        setIsOpen(true);
        setSelectedType('manual');
        setSelectedFeesType('recommended');
        selectedTypeRef.current = 'manual';
        selectedFeesTypeRef.current = 'recommended';
        isPauseCalculateFees.current = false;
        setHasError(false);
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

    const displayRequiredAmount = requiredAmount || '0';

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
        !!permitAllowanceData?.transactionFee &&
        isBalanceNotAvailable(
          nativeBalance,
          permitAllowanceData.transactionFee,
        ),
      [nativeBalance, permitAllowanceData?.transactionFee],
    );

    const handleContinue = useCallback(() => {
      setShowConfirmModal(true);
      isPauseCalculateFees.current = true;
    }, []);

    const onSelectFeesType = useCallback((type, gasPrice) => {
      if (type === 'custom') {
        isPauseCalculateFees.current = true;
        setSelectedFeesType('custom');
        selectedFeesTypeRef.current = 'custom';
      } else {
        isPauseCalculateFees.current = false;
        setSelectedFeesType(type);
        selectedFeesTypeRef.current = type;
      }
    }, []);

    const isDisabled =
      isLoading ||
      approveLoading ||
      isFetchingFeesAgain ||
      insufficientBalance ||
      isInsufficientFeeBalance;

    const bottomSheetRefCallback = useCallback(sheetRef => {
      bottomSheetRef.current = sheetRef;
    }, []);

    const submitTransferData = useCallback(async () => {
      if (!onContinue) {
        return;
      }
      const gasFeeWei =
        selectedFeesType === 'recommended' && permitAllowanceData?.gasFee
          ? permitAllowanceData?.gasFee
          : new BigNumber(customFees || '0').multipliedBy(1e9).toFixed(0);
      const finalNonce = parseInt(customNonce, 10);
      onContinue({
        type: selectedType,
        gasFee: gasFeeWei,
        maxPriorityFeePerGas: permitAllowanceData?.maxPriorityFeePerGas,
        nonce: !isNaN(finalNonce) ? finalNonce : permitAllowanceData?.nonce,
        feesType: selectedFeesTypeRef.current,
        estimateGas: permitAllowanceData?.estimateGas,
      });
    }, [
      customFees,
      customNonce,
      onContinue,
      permitAllowanceData?.estimateGas,
      permitAllowanceData?.gasFee,
      permitAllowanceData?.maxPriorityFeePerGas,
      permitAllowanceData?.nonce,
      selectedFeesType,
      selectedType,
    ]);

    const onSuccess = useCallback(async () => {
      setShowConfirmModal(false);
      await delay(300);
      await submitTransferData();
    }, [submitTransferData]);

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
                  name="shield-key-outline"
                  size={24}
                  color={theme.background}
                />
                <Text style={styles.title}>Router Permission</Text>
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
                  <Text style={styles.loadingText}>
                    Fetching permit allowance...
                  </Text>
                </View>
              ) : hasError ? (
                <View style={styles.errorView}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={48}
                    color="#F44336"
                  />
                  <Text style={styles.errorViewTitle}>
                    Something went wrong
                  </Text>
                  <Text style={styles.errorViewSubtitle}>
                    We couldn't estimate the network fee right now. Please check
                    your connection and try again.
                  </Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fetchEstimationFee}>
                    <MaterialCommunityIcons
                      name="refresh"
                      size={18}
                      color={theme.title}
                    />
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {permitAllowanceData ? (
                    <View style={styles.statusRow}>
                      <MaterialCommunityIcons
                        name={
                          permitAllowanceData.isApproved
                            ? 'check-circle'
                            : 'alert-circle'
                        }
                        size={18}
                        color={
                          permitAllowanceData.isApproved ? '#4CAF50' : '#FF9800'
                        }
                      />
                      <Text
                        style={[
                          styles.statusText,
                          permitAllowanceData.isApproved
                            ? styles.statusApproved
                            : styles.statusPending,
                        ]}>
                        {permitAllowanceData.isApproved
                          ? `Router allowance: ${parseFloat(
                              permitAllowanceData.permit2AmountFormatted || '0',
                            ).toFixed(6)}`
                          : `Router allowance required: ${parseFloat(
                              permitAllowanceData.requiredFormatted || '0',
                            ).toFixed(6)} (current: ${parseFloat(
                              permitAllowanceData.permit2AmountFormatted || '0',
                            ).toFixed(6)})`}
                      </Text>
                    </View>
                  ) : null}

                  {/* Approval type cards */}
                  <Text style={styles.sectionLabel}>Select Approval Type</Text>
                  <Text style={styles.whatIsApprove}>
                    {`This lets the swap router use your ${
                      tokenSymbol || 'tokens'
                    } through Permit2. Your tokens stay in your wallet until you swap.`}
                  </Text>
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
                        Approve only this amount
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
                      <Text style={styles.cardDesc}>
                        Approve once, skip future
                      </Text>
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
                      {tokenSymbol || ''}.
                    </Text>
                  ) : (
                    <>
                      <View style={styles.selectionNote}>
                        <MaterialCommunityIcons
                          name={
                            selectedType === 'unlimited'
                              ? 'alert-outline'
                              : 'shield-check-outline'
                          }
                          size={16}
                          color={
                            selectedType === 'unlimited'
                              ? '#FF9800'
                              : theme.gray
                          }
                        />
                        <Text
                          style={[
                            styles.selectionNoteText,
                            selectedType === 'unlimited'
                              ? styles.selectionNoteWarning
                              : styles.selectionNoteSafe,
                          ]}>
                          {selectedType === 'unlimited'
                            ? `The swap router can move any amount of your ${
                                tokenSymbol || 'tokens'
                              } via Permit2 until you revoke it. Saves fees and time on future swaps — choose only for protocols you trust.`
                            : `Safest option. The router can only ever move this exact amount via Permit2 — you'll need to approve again for future swaps.`}
                        </Text>
                      </View>
                      <Text style={styles.hint}>
                        Permit2 approval transaction will be submitted before
                        swapping.
                      </Text>
                    </>
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
                          : `${permitAllowanceData?.transactionFee || '0'} ${
                              chainSymbol || ''
                            }`}
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
              {!approveLoading && !hasError ? (
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
          <ModalConfirmTransaction
            hideModal={() => {
              setShowConfirmModal(false);
              // Resume refresh only if not on a custom fee (custom must stay local).
              isPauseCalculateFees.current =
                selectedFeesTypeRef.current === 'custom';
            }}
            visible={showConfirmModal}
            onSuccess={onSuccess}
          />
          <AdvancedFeesSheet
            ref={advancedFeesSheetRef}
            feesOptions={permitAllowanceData?.feesOptions}
            selectedFeesType={selectedFeesType}
            customFees={customFees}
            customNonce={customNonce}
            chainName="ethereum"
            gasCurrency={GAS_CURRENCY.ethereum || 'Gwei'}
            onSelectFeesType={onSelectFeesType}
            onChangeCustomFees={onChangeCustomFees}
            onChangeCustomNonce={onChangeCustomNonce}
            // Opens OVER the permit sheet: layer above it and keep the
            // permit sheet mounted (dimmed + non-interactive) underneath.
            zIndex={10001}
            stackBehavior="push"
          />
        </DokBottomSheet>
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
    errorView: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      gap: 12,
    },
    errorViewTitle: {
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      color: theme.font,
      fontWeight: '600',
    },
    errorViewSubtitle: {
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      color: theme.gray,
      lineHeight: 19,
      textAlign: 'center',
      paddingHorizontal: 12,
      marginBottom: 4,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 44,
      paddingHorizontal: 24,
      borderRadius: 12,
      backgroundColor: theme.background,
    },
    retryButtonText: {
      fontSize: 15,
      fontFamily: 'Roboto-Regular',
      color: theme.title,
      fontWeight: '600',
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
    whatIsApprove: {
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      color: theme.gray,
      lineHeight: 17,
      marginTop: -4,
      marginBottom: 12,
    },
    selectionNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      marginBottom: 10,
    },
    selectionNoteText: {
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      lineHeight: 18,
      flexShrink: 1,
    },
    selectionNoteSafe: {
      color: theme.gray,
    },
    selectionNoteWarning: {
      color: '#FF9800',
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
      marginBottom: 16,
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

export default PermitInfoSheet;
