import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {TextInput as TextField} from 'react-native-paper';
import structuredClone from '@ungap/structured-clone';
import {shallowEqual, useSelector, useDispatch} from 'react-redux';
import {useIsFocused} from '@react-navigation/native';
import BigNumber from 'bignumber.js';

import {showToast} from 'utils/toast';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './ExchangeStyles';

import DokDropdown from 'components/DokDropdown';
import ModalAddCoins from 'components/ModalAddCoins';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import AllowanceInfoSheet from 'components/AllowanceInfoSheet';
import PermitInfoSheet from 'components/PermitInfoSheet';
import SwapCard from './components/SwapCard';
import FlipButton from './components/FlipButton';
import AmountChips from './components/AmountChips';
import CoinSelectorSheet from './components/CoinSelectorSheet';
import ProviderList from './components/ProviderList';
import SlippageEditor from './components/SlippageEditor';

import {
  selectCurrentWalletClientId,
  getCoinsOptions,
  selectVisibleWallets,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {
  getExchange,
  getExchangeApproveLoading,
  getExchangePermitApproveLoading,
  selectProviderRows,
  selectIsQuoteFetching,
  selectQuoteError,
  selectQuoteFetchedAt,
  selectLowestPairMinimum,
} from 'dok-wallet-blockchain-networks/redux/exchange/exchangeSelectors';
import {
  approveExchangePermit2,
  approveSwapAllowance,
  calculateExchange,
  fetchExchangeAllowance,
  fetchExchangePermitAllowance,
  fetchExchangeQuotes,
  fetchPairMinimums,
  setExchangeFields,
} from 'dok-wallet-blockchain-networks/redux/exchange/exchangeSlice';
import {
  isEVMChain,
  multiplyBNWithFixed,
  validateNumber,
  validateNumberInInput,
} from 'dok-wallet-blockchain-networks/helper';
import {
  buildExchangePairKey,
  createDebounced,
  getSmartDefaultAmount,
} from 'dok-wallet-blockchain-networks/helper/exchangeHelpers';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {currencySymbol} from 'data/currency';
import {setCurrentTransferSuccess} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSlice';
import {getExchangeProviders} from 'dok-wallet-blockchain-networks/redux/cryptoProviders/cryptoProvidersSelectors';
import {useKeyboardHeight} from 'hooks/useKeyboardHeight';

const QUOTE_DEBOUNCE_MS = 700;

const Exchange = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const keyboardHeight = useKeyboardHeight();

  const exchangeProvidersText = useSelector(getExchangeProviders);
  const coinOptions = useSelector(getCoinsOptions, shallowEqual);
  const allWallets = useSelector(selectVisibleWallets);
  const currentWalletClientId = useSelector(selectCurrentWalletClientId);
  const {
    selectedCoinToOptions,
    selectedFromAsset,
    selectedCoinFromOptions,
    possibleFromCoin,
    selectedToAsset,
    possibleToCoins,
    amountFrom,
    amountTo,
    customOption,
    customAddress,
    fiatPay,
    selectedExchangeChain,
    slippage,
    lastQuotedAmount,
  } = useSelector(getExchange);
  const providerRows = useSelector(selectProviderRows);
  const isQuoteFetching = useSelector(selectIsQuoteFetching);
  const quoteError = useSelector(selectQuoteError);
  const quoteFetchedAt = useSelector(selectQuoteFetchedAt);
  const lowestPairMinimum = useSelector(selectLowestPairMinimum);
  const exchangeApproveLoading = useSelector(getExchangeApproveLoading);
  const exchangePermitApproveLoading = useSelector(
    getExchangePermitApproveLoading,
  );
  const localCurrency = useSelector(getLocalCurrency);
  const fiatSymbol = currencySymbol[localCurrency] || '$';

  const [isPreparingAllowance, setIsPreparingAllowance] = React.useState(false);
  // Set on submit: from that moment the auto-refresh countdown is removed so
  // a background quote refresh can never rewrite the amounts/provider under
  // the approval sheets or the Transfer screen. Cleared when the user edits
  // the form again or returns to this screen.
  const [isQuoteLocked, setIsQuoteLocked] = React.useState(false);

  const coinSelectorSheetRef = useRef();
  const addMoreCoinsSheet = useRef();
  const exchangeAllowanceSheetRef = useRef();
  const exchangePermitSheetRef = useRef();
  // Carries "this quote needs a permit2 approval too" across the allowance
  // sheet, which resolves asynchronously after handleSubmit has returned.
  const permitRequiredRef = useRef(false);
  // Smart default is applied at most once per pair, and never over typed input.
  const defaultAppliedPairRef = useRef(null);
  const amountFromRef = useRef(amountFrom);
  amountFromRef.current = amountFrom;

  const pairKey = buildExchangePairKey(selectedFromAsset, selectedToAsset);

  const debouncedFetchQuotes = useMemo(
    () =>
      createDebounced(amount => {
        dispatch(fetchExchangeQuotes({amount}));
      }, QUOTE_DEBOUNCE_MS),
    [dispatch],
  );
  useEffect(() => () => debouncedFetchQuotes.cancel(), [debouncedFetchQuotes]);

  const handleAmountChange = useCallback(
    value => {
      const tempValues = validateNumberInInput(
        value,
        selectedFromAsset?.decimal,
      );
      const tempFiatPay = multiplyBNWithFixed(
        tempValues,
        selectedFromAsset?.currencyRate,
        2,
      );
      dispatch(
        setExchangeFields({amountFrom: tempValues, fiatPay: tempFiatPay}),
      );
      setIsQuoteLocked(false);
      debouncedFetchQuotes(tempValues);
    },
    [
      dispatch,
      debouncedFetchQuotes,
      selectedFromAsset?.decimal,
      selectedFromAsset?.currencyRate,
    ],
  );

  // Finds, per wallet, the matching coin for a picked option; mirrors the
  // wallet the current selection belongs to.
  const getCoinDetails = useCallback(
    coinDetails => {
      let selectedCoinDetails = {};
      let selectedWalletDetails = {};
      let possibleCoinDetails = [];
      for (let i = 0; i < allWallets.length; i++) {
        const tempWallet = allWallets[i];
        const rawCoinDetails = tempWallet?.coins.find(
          item =>
            item?.symbol?.toUpperCase() ===
              coinDetails?.options?.symbol?.toUpperCase() &&
            item?.chain_name === coinDetails?.options?.chain_name,
        );
        const tempCoinDetails =
          rawCoinDetails?.chain_symbol === 'BNB'
            ? {...rawCoinDetails, chain_symbol: 'BSC'}
            : rawCoinDetails;
        if (tempWallet?.clientId === currentWalletClientId && tempCoinDetails) {
          selectedCoinDetails = tempCoinDetails;
          selectedWalletDetails = tempWallet;
        }
        if (tempCoinDetails) {
          const tempAddress = tempCoinDetails?.address;
          possibleCoinDetails.push({
            label: `${tempWallet?.walletName}: ${tempAddress}`,
            value: tempAddress,
            options: {
              coinDetails: tempCoinDetails,
              walletDetails: tempWallet,
            },
          });
        }
      }
      if (!selectedCoinDetails?.symbol && possibleCoinDetails.length) {
        selectedCoinDetails = possibleCoinDetails[0].options.coinDetails;
        selectedWalletDetails = possibleCoinDetails[0].options.walletDetails;
      }
      return {selectedCoinDetails, possibleCoinDetails, selectedWalletDetails};
    },
    [allWallets, currentWalletClientId],
  );

  const onChangeFromValues = useCallback(
    item => {
      const {possibleCoinDetails, selectedCoinDetails, selectedWalletDetails} =
        getCoinDetails(item);
      dispatch(
        setExchangeFields({
          selectedCoinFromOptions: item,
          possibleFromCoin: possibleCoinDetails,
          selectedFromAsset: selectedCoinDetails,
          selectedFromWallet: selectedWalletDetails,
        }),
      );
    },
    [getCoinDetails, dispatch],
  );

  const onChangeToValues = useCallback(
    item => {
      const {possibleCoinDetails, selectedCoinDetails} = getCoinDetails(item);
      const customPayload = {
        label: 'Custom',
        value: 'Custom',
        options: {coinDetails: {}, walletDetails: {}},
      };
      dispatch(
        setExchangeFields({
          selectedCoinToOptions: item,
          possibleToCoins: [...possibleCoinDetails, customPayload],
          selectedToAsset: selectedCoinDetails,
        }),
      );
    },
    [dispatch, getCoinDetails],
  );

  const onSelectCoin = useCallback(
    (item, direction) => {
      if (direction === 'to') {
        onChangeToValues(item);
      } else {
        onChangeFromValues(item);
      }
    },
    [onChangeFromValues, onChangeToValues],
  );

  // Pair change: refresh provider minimums, and re-quote a kept amount.
  useEffect(() => {
    if (pairKey) {
      setIsQuoteLocked(false);
      dispatch(fetchPairMinimums());
      if (validateNumber(amountFromRef.current)) {
        debouncedFetchQuotes(amountFromRef.current);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairKey, dispatch]);

  // Smart default: once per pair, when the amount field is empty, pre-fill
  // roughly $100 of the from-coin (capped at balance) so most providers
  // clear their minimums.
  useEffect(() => {
    if (!pairKey || defaultAppliedPairRef.current === pairKey) {
      return;
    }
    if (validateNumber(amountFromRef.current)) {
      defaultAppliedPairRef.current = pairKey;
      return;
    }
    const defaultAmount = getSmartDefaultAmount({
      fromAsset: selectedFromAsset,
      lowestMinimum: lowestPairMinimum,
    });
    if (defaultAmount) {
      defaultAppliedPairRef.current = pairKey;
      handleAmountChange(defaultAmount);
    }
  }, [pairKey, lowestPairMinimum, selectedFromAsset, handleAmountChange]);

  // Re-derive wallet/balance data when the screen regains focus (coins can
  // be added from the sheet, balances refresh in the background).
  useEffect(() => {
    if (isFocused) {
      setIsQuoteLocked(false);
      if (selectedCoinToOptions) {
        onChangeToValues(selectedCoinToOptions);
      }
      if (selectedCoinFromOptions) {
        onChangeFromValues(selectedCoinFromOptions);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  const onSelectFromAsset = useCallback(
    item => {
      dispatch(
        setExchangeFields({
          selectedFromAsset: item.options?.coinDetails,
          selectedFromWallet: item.options?.walletDetails,
        }),
      );
    },
    [dispatch],
  );

  const onSelectToAsset = useCallback(
    item => {
      if (item.value === 'Custom') {
        dispatch(setExchangeFields({customOption: item.value}));
      } else {
        dispatch(
          setExchangeFields({
            selectedToAsset: item.options?.coinDetails,
            customOption: '',
          }),
        );
      }
    },
    [dispatch],
  );

  const onFlip = useCallback(() => {
    const fromOption = structuredClone(selectedCoinToOptions);
    const toOption = structuredClone(selectedCoinFromOptions);
    const newAmountFrom = validateNumber(amountTo) ? `${amountTo}` : '';
    if (fromOption) {
      onChangeFromValues(fromOption);
    }
    if (toOption) {
      onChangeToValues(toOption);
    }
    dispatch(
      setExchangeFields({
        amountFrom: newAmountFrom,
        fiatPay: multiplyBNWithFixed(
          newAmountFrom,
          selectedToAsset?.currencyRate,
          2,
        ),
        amountTo: '',
        customOption: '',
        customAddress: '',
      }),
    );
    setIsQuoteLocked(false);
    if (newAmountFrom) {
      debouncedFetchQuotes(newAmountFrom);
    }
  }, [
    dispatch,
    amountTo,
    selectedCoinFromOptions,
    selectedCoinToOptions,
    selectedToAsset?.currencyRate,
    onChangeFromValues,
    onChangeToValues,
    debouncedFetchQuotes,
  ]);

  const onSelectFraction = useCallback(
    fraction => {
      const balance = new BigNumber(selectedFromAsset?.totalAmount ?? NaN);
      if (!balance.isFinite() || balance.lte(0)) {
        return;
      }
      const decimals = Math.min(Number(selectedFromAsset?.decimal) || 8, 8);
      const amount = balance
        .multipliedBy(fraction)
        .decimalPlaces(decimals, BigNumber.ROUND_DOWN)
        .toFixed();
      handleAmountChange(amount);
    },
    [
      handleAmountChange,
      selectedFromAsset?.totalAmount,
      selectedFromAsset?.decimal,
    ],
  );

  const onPressProvider = useCallback(
    row => {
      const quote = row?.quote;
      if (!quote?.toAmount) {
        return;
      }
      dispatch(
        setExchangeFields({
          selectedExchangeChain: quote,
          extraData: quote?.extraData,
          amountTo: quote.toAmount + '',
          isProviderManuallySelected: true,
        }),
      );
    },
    [dispatch],
  );

  const onCommitSlippage = useCallback(
    value => {
      dispatch(setExchangeFields({slippage: value}));
      if (validateNumber(amountFromRef.current)) {
        dispatch(fetchExchangeQuotes({amount: amountFromRef.current}));
      }
    },
    [dispatch],
  );

  const onRefreshQuotes = useCallback(() => {
    if (validateNumber(amountFromRef.current)) {
      dispatch(fetchExchangeQuotes({amount: amountFromRef.current}));
    }
  }, [dispatch]);

  const onPressAddMoreCoin = useCallback(() => {
    addMoreCoinsSheet?.current?.close?.();
    addMoreCoinsSheet?.current?.present?.();
  }, []);

  const onDismissAddCoinsSheet = useCallback(() => {
    addMoreCoinsSheet?.current?.close?.();
  }, []);

  // ---- Validation ----------------------------------------------------
  const minimumValue = selectedExchangeChain?.minAmount || null;
  const backendSlippage = selectedExchangeChain?.extraData?.slippage;
  const amountFromBN = new BigNumber(amountFrom || NaN);
  const isMinimumValueGreater = !!(
    minimumValue &&
    amountFromBN.isFinite() &&
    new BigNumber(minimumValue).gt(amountFromBN)
  );
  const isBalanceLess =
    amountFromBN.isFinite() &&
    new BigNumber(selectedFromAsset?.totalAmount ?? 0).lt(amountFromBN);
  const isCustomAddressRequire = customOption === 'Custom' && !customAddress;

  const balanceDisplay = validateNumber(selectedFromAsset?.totalAmount)
    ? new BigNumber(selectedFromAsset?.totalAmount)
        .decimalPlaces(6, BigNumber.ROUND_DOWN)
        .toFixed()
    : '0';
  const balanceText = selectedFromAsset?.symbol
    ? `Balance: ${balanceDisplay} ${selectedFromAsset?.symbol?.toUpperCase()}`
    : '';

  // Typing sits in a debounce window before the quote request even starts;
  // until the shown quote matches the entered amount, submitting would send
  // a rateId/provider that belongs to the previous amount.
  const isQuoteStaleForAmount = amountFrom !== lastQuotedAmount;

  const isButtonDisabled =
    !validateNumber(amountFrom) ||
    !validateNumber(amountTo) ||
    !selectedExchangeChain ||
    isMinimumValueGreater ||
    isBalanceLess ||
    isCustomAddressRequire ||
    isQuoteFetching ||
    isQuoteStaleForAmount ||
    !!quoteError;

  const isERC20FromAsset =
    isEVMChain(selectedFromAsset?.chain_name) &&
    !!selectedFromAsset?.contractAddress;
  const showApproveAndSwap = isERC20FromAsset && !isButtonDisabled;

  // Why the CTA is disabled, in the order the user should resolve things.
  // `transient` renders neutral (a wait state), everything else as an error.
  let disabledReason = null;
  if (isButtonDisabled && !isPreparingAllowance) {
    const fromSymbolText = selectedFromAsset?.symbol?.toUpperCase() || '';
    if (!selectedFromAsset?.symbol || !selectedToAsset?.symbol) {
      disabledReason = {text: 'Select the coins you want to swap.'};
    } else if (!validateNumber(amountFrom)) {
      disabledReason = {text: 'Enter an amount to swap.'};
    } else if (isBalanceLess) {
      disabledReason = {
        text: `You don't have enough ${fromSymbolText}. Your balance is ${balanceDisplay} ${fromSymbolText}.`,
      };
    } else if (isMinimumValueGreater) {
      disabledReason = {
        text: `Minimum for ${
          selectedExchangeChain?.title || 'this provider'
        } is ${minimumValue} ${fromSymbolText}.`,
      };
    } else if (isCustomAddressRequire) {
      disabledReason = {
        text: 'Enter the address that will receive the funds.',
      };
    } else if (isQuoteFetching || isQuoteStaleForAmount) {
      disabledReason = {text: 'Fetching the latest quote…', transient: true};
    } else if (quoteError) {
      disabledReason = {
        text: "Quotes couldn't be fetched. Tap Retry in the providers list.",
      };
    } else if (!selectedExchangeChain || !validateNumber(amountTo)) {
      disabledReason = {
        text: "No provider can swap this amount. Check each provider's minimum in the list.",
      };
    }
  }

  // ---- Approval / submit flow (unchanged behaviour) --------------------
  const goToTransfer = useCallback(() => {
    navigation.navigate('Transfer', {fromScreen: 'Exchange'});
  }, [navigation]);

  // After the ERC20-level allowance is confirmed (already approved, or just
  // approved via the AllowanceInfoSheet), a permit2 swap quote still needs a
  // separate router-level (Permit2) allowance before it's safe to swap.
  // needsPermit is read off the quote we just fetched rather than off state, so
  // it can't lag behind the provider the user actually picked.
  const handlePermitCheckAndProceed = useCallback(
    async needsPermit => {
      if (!needsPermit) {
        goToTransfer();
        return;
      }
      const permitResult = await dispatch(
        fetchExchangePermitAllowance(),
      ).unwrap();
      if (permitResult?.isApproved) {
        goToTransfer();
      } else {
        exchangePermitSheetRef.current?.present();
      }
    },
    [dispatch, goToTransfer],
  );

  const handleSubmit = async () => {
    setIsQuoteLocked(true);
    dispatch(setCurrentTransferSuccess(false));
    if (!showApproveAndSwap) {
      goToTransfer();
      dispatch(calculateExchange());
      return;
    }
    setIsPreparingAllowance(true);
    try {
      // showApproveAndSwap is computed before the quote exists, so it only tells
      // us the source is an ERC20. Whether an approval is actually needed
      // depends on the quote: only a DEX aggregator returns calldata with a
      // spender. Deposit-address providers are plain transfers.
      const quote = await dispatch(calculateExchange()).unwrap();
      if (!quote) {
        // Fulfilled without data (e.g. empty backend response): navigating
        // would show the Transfer screen against stale transfer state.
        showToast({
          type: 'errorToast',
          title: 'Failed to create the exchange. Please try again.',
        });
        return;
      }
      const spender = quote?.swapData?.spender;
      if (!spender) {
        goToTransfer();
        return;
      }
      const needsPermit = Boolean(quote?.swapData?.permit_abi);
      const result = await dispatch(fetchExchangeAllowance()).unwrap();
      if (result?.isApproved) {
        await handlePermitCheckAndProceed(needsPermit);
      } else {
        permitRequiredRef.current = needsPermit;
        exchangeAllowanceSheetRef.current?.present();
      }
    } catch (error) {
      console.error('Error preparing swap allowance', error);
      showToast({
        type: 'errorToast',
        title: error?.message || 'Failed to check token allowance',
      });
    } finally {
      setIsPreparingAllowance(false);
    }
  };

  const onAllowanceContinue = useCallback(
    async ({
      type,
      gasFee,
      maxPriorityFeePerGas,
      nonce,
      feesType,
      estimateGas,
    }) => {
      try {
        await dispatch(
          approveSwapAllowance({
            type,
            gasFee,
            maxPriorityFeePerGas,
            nonce,
            feesType,
            estimateGas,
          }),
        ).unwrap();
        exchangeAllowanceSheetRef.current?.close();
        await handlePermitCheckAndProceed(permitRequiredRef.current);
      } catch (error) {
        console.error('Error approving swap allowance', error);
      }
    },
    [dispatch, handlePermitCheckAndProceed],
  );

  const onPermitAllowanceContinue = useCallback(
    async ({
      type,
      gasFee,
      maxPriorityFeePerGas,
      nonce,
      feesType,
      estimateGas,
    }) => {
      try {
        await dispatch(
          approveExchangePermit2({
            type,
            gasFee,
            maxPriorityFeePerGas,
            nonce,
            feesType,
            estimateGas,
          }),
        ).unwrap();
        exchangePermitSheetRef.current?.close();
        goToTransfer();
      } catch (error) {
        console.error('Error approving permit2 allowance', error);
      }
    },
    [dispatch, goToTransfer],
  );

  // Paused off-focus too: the Exchange drawer screen stays mounted beneath
  // Transfer, and a background refresh there would rewrite amountTo/provider
  // under the confirmation screen the user is reading.
  const refreshPaused =
    !isFocused ||
    isPreparingAllowance ||
    exchangeApproveLoading ||
    exchangePermitApproveLoading;

  return (
    <DokSafeAreaView style={styles.container}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.contentContainerStyle}
          keyboardShouldPersistTaps={'always'}>
          <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View>
              <SwapCard
                label="You pay"
                coinOption={selectedCoinFromOptions}
                amount={amountFrom}
                fiatValue={
                  validateNumber(fiatPay) ? `~${fiatSymbol}${fiatPay}` : ''
                }
                balanceText={balanceText}
                editable={true}
                onChangeAmount={handleAmountChange}
                onPressCoin={() =>
                  coinSelectorSheetRef.current?.present('from')
                }
                hasError={isBalanceLess}>
                {new BigNumber(selectedFromAsset?.totalAmount ?? 0).gt(0) && (
                  <AmountChips onSelectFraction={onSelectFraction} />
                )}
              </SwapCard>
              <FlipButton onPress={onFlip} />
              <SwapCard
                label="You receive (estimated)"
                coinOption={selectedCoinToOptions}
                amount={validateNumber(amountTo) ? `${amountTo}` : ''}
                fiatValue={
                  validateNumber(amountTo) && selectedToAsset?.currencyRate
                    ? `~${fiatSymbol}${multiplyBNWithFixed(
                        amountTo,
                        selectedToAsset?.currencyRate,
                        2,
                      )}`
                    : ''
                }
                editable={false}
                onPressCoin={() => coinSelectorSheetRef.current?.present('to')}
                isFetching={isQuoteFetching}
              />
              {isMinimumValueGreater && (
                <Text style={styles.errorText}>
                  {`Minimum for ${
                    selectedExchangeChain?.title || 'this provider'
                  } is ${minimumValue} ${selectedFromAsset?.symbol || ''}`}
                </Text>
              )}
              {isBalanceLess && (
                <Text style={styles.errorText}>
                  {`You don't have ${amountFrom} ${
                    selectedFromAsset?.symbol || ''
                  }`}
                </Text>
              )}
              {!!possibleFromCoin?.length && (
                <View style={styles.addressView}>
                  <DokDropdown
                    placeholder={'Pay from address'}
                    title={'Pay from address'}
                    data={possibleFromCoin}
                    onChangeValue={onSelectFromAsset}
                    value={selectedFromAsset?.address}
                    selectedTextProps={{numberOfLines: 1}}
                  />
                </View>
              )}
              {!!possibleToCoins?.length && (
                <View style={styles.addressView}>
                  <DokDropdown
                    placeholder={'Receive to address'}
                    title={'Receive to address'}
                    data={possibleToCoins}
                    onChangeValue={onSelectToAsset}
                    value={customOption || selectedToAsset?.address}
                    selectedTextProps={{numberOfLines: 1}}
                  />
                </View>
              )}
              {customOption === 'Custom' && (
                <TextField
                  style={styles.input}
                  label="To Address"
                  placeholder={'Enter to address'}
                  theme={{
                    colors: {onSurfaceVariant: '#989898', primary: '#989898'},
                  }}
                  outlineColor={'#989898'}
                  autoCapitalize="none"
                  returnKeyType="next"
                  mode="outlined"
                  blurOnSubmit={false}
                  name="To Address"
                  autoFocus={true}
                  onChangeText={text => {
                    dispatch(setExchangeFields({customAddress: text}));
                  }}
                  value={customAddress}
                />
              )}
              <Text style={styles.addCoinText}>
                {'Looking for more coins?'}
                <Text style={styles.addCoinLink} onPress={onPressAddMoreCoin}>
                  {' Add coins to this wallet'}
                </Text>
              </Text>
              {!!selectedExchangeChain &&
                (backendSlippage !== undefined && backendSlippage !== null
                  ? true
                  : !!slippage) && (
                  <View style={styles.detailsCard}>
                    <SlippageEditor
                      slippage={slippage}
                      backendSlippage={backendSlippage}
                      onCommit={onCommitSlippage}
                    />
                  </View>
                )}
              <ProviderList
                rows={providerRows}
                isFetching={isQuoteFetching}
                error={quoteError}
                onRetry={onRefreshQuotes}
                onPressProvider={onPressProvider}
                fromSymbol={selectedFromAsset?.symbol?.toUpperCase()}
                toSymbol={selectedToAsset?.symbol?.toUpperCase()}
                fiatSymbol={fiatSymbol}
                quoteFetchedAt={isQuoteLocked ? null : quoteFetchedAt}
                refreshPaused={refreshPaused}
                onRefresh={onRefreshQuotes}
              />
              <View style={styles.boxFooter}>
                <Text style={styles.textStyle}>
                  {`Swap services are available through third-party API provider (${exchangeProvidersText}).`}
                </Text>
                {customOption === 'Custom' && (
                  <Text style={styles.warningText}>
                    {
                      'Please ensure the custom wallet address before exchanging.'
                    }
                  </Text>
                )}
                {!!disabledReason && (
                  <Text
                    style={
                      disabledReason.transient
                        ? styles.buttonHintInfo
                        : styles.buttonHintError
                    }>
                    {disabledReason.text}
                  </Text>
                )}
                <TouchableOpacity
                  style={[
                    styles.button,
                    (isButtonDisabled || isPreparingAllowance) &&
                      styles.buttonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={isButtonDisabled || isPreparingAllowance}>
                  {isPreparingAllowance ? (
                    <ActivityIndicator size="small" color={theme.title} />
                  ) : (
                    <Text style={styles.buttonTitle}>
                      {showApproveAndSwap ? 'Approve and swap' : 'Next'}
                    </Text>
                  )}
                </TouchableOpacity>
                <View style={{height: keyboardHeight, width: '100%'}} />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
        <CoinSelectorSheet
          ref={coinSelectorSheetRef}
          options={coinOptions}
          onSelect={onSelectCoin}
        />
        <ModalAddCoins
          bottomSheetRef={ref => (addMoreCoinsSheet.current = ref)}
          onDismiss={onDismissAddCoinsSheet}
        />
        {isERC20FromAsset && (
          <>
            <AllowanceInfoSheet
              ref={exchangeAllowanceSheetRef}
              source="exchange"
              tokenSymbol={selectedFromAsset?.symbol}
              requiredAmount={amountFrom}
              availableAmount={selectedFromAsset?.totalAmount}
              chainName={selectedFromAsset?.chain_name}
              chainSymbol={selectedFromAsset?.chain_symbol}
              approveLoading={exchangeApproveLoading}
              onContinue={onAllowanceContinue}
            />
            <PermitInfoSheet
              ref={exchangePermitSheetRef}
              tokenSymbol={selectedFromAsset?.symbol}
              requiredAmount={amountFrom}
              availableAmount={selectedFromAsset?.totalAmount}
              chainName={selectedFromAsset?.chain_name}
              chainSymbol={selectedFromAsset?.chain_symbol}
              approveLoading={exchangePermitApproveLoading}
              onContinue={onPermitAllowanceContinue}
            />
          </>
        )}
      </View>
    </DokSafeAreaView>
  );
};

export default Exchange;
