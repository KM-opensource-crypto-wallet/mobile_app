import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {TextInput as TextField} from 'react-native-paper';
import structuredClone from '@ungap/structured-clone';
import {showToast} from 'utils/toast';

import myStyles from './ExchangeStyles';

import {shallowEqual, useSelector, useDispatch} from 'react-redux';
import ArrIcon from 'assets/images/icons/ic_arrow_right.svg';
import InfoIcon from 'assets/images/icons/info.svg';
import EditIcon from 'assets/images/icons/edit.svg';
import ScurvedIcon from 'assets/images/icons/S-curved.svg';

import SelectInputExchange from 'components/SelectInputExchange';

import {ThemeContext} from 'theme/ThemeContext';
import FastImage from '@d11/react-native-fast-image';

import DokDropdown from 'components/DokDropdown';
import {
  _currentWalletIndexSelector,
  getCoinsOptions,
  selectAllWallets,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {
  getExchange,
  getExchangeApproveLoading,
  getExchangePermitApproveLoading,
} from 'dok-wallet-blockchain-networks/redux/exchange/exchangeSelectors';
import {
  approveExchangePermit2,
  approveSwapAllowance,
  calculateExchange,
  fetchExchangeAllowance,
  fetchExchangePermitAllowance,
  setExchangeFields,
} from 'dok-wallet-blockchain-networks/redux/exchange/exchangeSlice';
import {getTransferData} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSelector';
import BigNumber from 'bignumber.js';
import {
  calculateSliderValue,
  debounce,
  isEVMChain,
  multiplyBNWithFixed,
  validateNumber,
  validateNumberInInput,
} from 'dok-wallet-blockchain-networks/helper';
import Slider from '@react-native-community/slider';
import {useKeyboardHeight} from 'hooks/useKeyboardHeight';
import ModalAddCoins from 'components/ModalAddCoins';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {currencySymbol} from 'data/currency';
import {useIsFocused} from '@react-navigation/native';
import {setCurrentTransferSuccess} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSlice';
import {getExchangeQuote} from 'dok-wallet-blockchain-networks/service/dokApi';
import ExchangeProviderItem from 'components/ExchangeProviderItem';
import {getExchangeProviders} from 'dok-wallet-blockchain-networks/redux/cryptoProviders/cryptoProvidersSelectors';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import AllowanceInfoSheet from 'components/AllowanceInfoSheet';
import PermitInfoSheet from 'components/PermitInfoSheet';

const calculateEstimatePrice = async (
  selectedFromAsset,
  selectedToAsset,
  data,
  dispatch,
  callback,
  slippage,
) => {
  const fromSymbol = selectedFromAsset?.symbol;
  const fromNetwork = selectedFromAsset?.chain_symbol;
  const toSymbol = selectedToAsset?.symbol;
  const toNetwork = selectedToAsset?.chain_symbol;

  const payload = {
    coinFrom: fromSymbol,
    coinTo: toSymbol,
    networkFrom: fromNetwork,
    networkTo: toNetwork,
    amount: validateNumber(data)?.toString() || '1',
    rateType: 'fixed',
    fromChainName: selectedFromAsset?.chain_name,
    toChainName: selectedToAsset?.chain_name,
    fromContractAddress: selectedFromAsset?.contractAddress,
    toContractAddress: selectedToAsset?.contractAddress,
    fromAddress: selectedFromAsset?.address,
    slippage: slippage ? Number(slippage) : undefined,
  };

  const resp = await getExchangeQuote(payload);
  const respData = resp?.data;
  let max = new BigNumber(1);
  let maxIndex = 0;
  for (let i = 0; i <= respData.length; i++) {
    const currentResponse = respData?.[i];
    const toAmount = currentResponse?.toAmount;
    if (toAmount) {
      if (new BigNumber(toAmount).gt(max)) {
        max = new BigNumber(toAmount);
        maxIndex = i;
      }
    }
  }
  const finalResp = respData[maxIndex];
  if (finalResp?.toAmount) {
    const payloadd = {
      amountTo: finalResp?.toAmount + '',
      selectedExchangeChain: finalResp,
      extraData: finalResp?.extraData,
      availableProviders: respData,
    };
    dispatch(setExchangeFields(payloadd));
  } else {
    dispatch(
      setExchangeFields({
        amountTo: '0',
        availableProviders: [],
      }),
    );
  }
  callback?.();
};

const Exchange = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const exchangeProvidersText = useSelector(getExchangeProviders);
  const coinOptions = useSelector(getCoinsOptions, shallowEqual);
  const allWallets = useSelector(selectAllWallets);
  const currentWalletIndex = useSelector(_currentWalletIndexSelector);
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
    sliderValue,
    fiatPay,
    availableProviders,
    selectedExchangeChain,
    slippage,
  } = useSelector(getExchange);
  const exchangeApproveLoading = useSelector(getExchangeApproveLoading);
  const exchangePermitApproveLoading = useSelector(
    getExchangePermitApproveLoading,
  );
  const transferData = useSelector(getTransferData);
  const isPermit2Flow = Boolean(transferData?.swapData?.permit_abi);
  const localCurrency = useSelector(getLocalCurrency);

  const keyboardHeight = useKeyboardHeight();

  const [isFetching, setIsFetching] = useState({from: false, to: false});
  const [isEditingSlippage, setIsEditingSlippage] = useState(false);
  const [isPreparingAllowance, setIsPreparingAllowance] = useState(false);

  const minimumAmountRef = useRef({});
  const sliderRef = useRef();
  const scrollViewRef = useRef();

  const dispatch = useDispatch();
  const coinFromRef = useRef();
  const coinToRef = useRef();
  const isFocused = useIsFocused();
  const addMoreCoinsSheet = useRef();
  const exchangeAllowanceSheetRef = useRef();
  const exchangePermitSheetRef = useRef();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounceEstimateAmount = useCallback(
    debounce(
      (
        localSelectedFromAsset,
        localSelectedToAsset,
        localData,
        localDispatch,
        callback,
        localSlippage,
      ) =>
        calculateEstimatePrice(
          localSelectedFromAsset,
          localSelectedToAsset,
          localData,
          localDispatch,
          callback,
          localSlippage,
        ),
      1000,
    ),
    [],
  );

  const handleFromChange = useCallback(
    async (data, isNotUpdateSlider) => {
      if (selectedToAsset) {
        setIsFetching({from: false, to: true});
      }
      const tempValues = validateNumberInInput(
        data,
        selectedFromAsset?.decimal,
      );
      const tempFiatPay = multiplyBNWithFixed(
        tempValues,
        selectedFromAsset?.currencyRate,
        2,
      );
      if (!isNotUpdateSlider) {
        const balance = selectedFromAsset?.totalAmount;
        if (balance) {
          const tempSliderValue = calculateSliderValue(balance, tempValues);
          dispatch(
            setExchangeFields({
              amountFrom: tempValues,
              fiatPay: tempFiatPay,
              sliderValue: Number(tempSliderValue),
            }),
          );
        }
      } else {
        dispatch(
          setExchangeFields({amountFrom: tempValues, fiatPay: tempFiatPay}),
        );
      }
      if (selectedFromAsset?.symbol && selectedToAsset?.symbol) {
        await debounceEstimateAmount(
          selectedFromAsset,
          selectedToAsset,
          tempValues,
          dispatch,
          () => {
            setIsFetching({from: false, to: false});
          },
          slippage,
        );
      }
    },
    [
      debounceEstimateAmount,
      dispatch,
      selectedFromAsset,
      selectedToAsset,
      slippage,
    ],
  );

  const onSliderValueChange = useCallback(
    value => {
      dispatch(setExchangeFields({sliderValue: value}));
      const balance = selectedFromAsset?.totalAmount;
      if (balance) {
        const balanceBN = new BigNumber(balance);
        const valueBN = new BigNumber(value);
        const amount = balanceBN
          .multipliedBy(valueBN)
          .dividedBy(new BigNumber(100))
          .toFixed(6);
        handleFromChange(amount, true).then();
      }
    },
    [dispatch, handleFromChange, selectedFromAsset?.totalAmount],
  );

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
        if (i === currentWalletIndex && tempCoinDetails) {
          selectedCoinDetails = tempCoinDetails;
          selectedWalletDetails = tempWallet;
        }
        if (tempCoinDetails) {
          const tempAddress = tempCoinDetails?.address;
          const optionPayload = {
            label: `${tempWallet?.walletName}: ${tempAddress}`,
            value: tempAddress,
            options: {
              coinDetails: tempCoinDetails,
              walletDetails: tempWallet,
            },
          };
          possibleCoinDetails.push(optionPayload);
        }
      }
      if (!selectedCoinDetails?.symbol && possibleCoinDetails.length) {
        selectedCoinDetails = possibleCoinDetails[0].options.coinDetails;
        selectedWalletDetails = possibleCoinDetails[0].options.walletDetails;
      }
      return {selectedCoinDetails, possibleCoinDetails, selectedWalletDetails};
    },
    [allWallets, currentWalletIndex],
  );

  const onChangeFromValues = useCallback(
    item => {
      const {possibleCoinDetails, selectedCoinDetails, selectedWalletDetails} =
        getCoinDetails(item);
      const balance = selectedCoinDetails?.totalAmount;
      const tempSliderValue = calculateSliderValue(balance, amountFrom);
      dispatch(
        setExchangeFields({
          selectedCoinFromOptions: item,
          possibleFromCoin: possibleCoinDetails,
          selectedFromAsset: selectedCoinDetails,
          selectedFromWallet: selectedWalletDetails,
          sliderValue: tempSliderValue,
        }),
      );
    },
    [getCoinDetails, amountFrom, dispatch],
  );

  const getExchangeQuoteForFrom = useCallback(
    async (localSelectFromAsset, localSelectToAsset, localAmount) => {
      const fromSymbol = localSelectFromAsset?.symbol;
      const fromNetwork = localSelectFromAsset?.chain_symbol;
      const toSymbol = localSelectToAsset?.symbol;
      const toNetwork = localSelectToAsset?.chain_symbol;
      let key = null;
      if (fromSymbol && fromNetwork && toNetwork && toSymbol) {
        key = `${fromNetwork}:${fromSymbol}_${toNetwork}:${toSymbol}`;
      }
      const minimumValue = minimumAmountRef.current[key];
      const minimumValueBN = new BigNumber(minimumValue);
      const fromAmountBN = new BigNumber(localAmount);
      if (
        fromSymbol &&
        localSelectToAsset?.symbol &&
        (!minimumValue || fromAmountBN.gte(minimumValueBN))
      ) {
        setIsFetching({from: true, to: true});
        const payload = {
          coinFrom: fromSymbol,
          coinTo: localSelectToAsset?.symbol,
          networkFrom: fromNetwork,
          networkTo: localSelectToAsset?.chain_symbol,
          amount: localAmount ? localAmount : '0',
          rateType: 'fixed',
          fromChainName: localSelectFromAsset?.chain_name,
          toChainName: localSelectToAsset?.chain_name,
          fromContractAddress: localSelectFromAsset?.contractAddress,
          toContractAddress: localSelectToAsset?.contractAddress,
          isFetchMinimum: true,
          fromAddress: localSelectFromAsset?.address,
          slippage: slippage ? Number(slippage) : undefined,
        };
        if (!minimumValue) {
          payload.amount = null;
        }
        const resp = await getExchangeQuote(payload);
        const data = resp?.data;
        const selectedProvider = data?.[0];
        const finalAvailableProviders = data;
        const minAmount = selectedProvider?.minAmount;
        if (minAmount) {
          minimumAmountRef.current[key] = minAmount;
        }
        const toAmount = selectedProvider?.toAmount;
        const fromAmount = selectedProvider?.fromAmount;
        if (toAmount) {
          const tempFiatPay = multiplyBNWithFixed(
            fromAmount,
            selectedFromAsset?.currencyRate,
            2,
          );
          dispatch(
            setExchangeFields({
              fiatPay: tempFiatPay,
              amountFrom: fromAmount + '',
              amountTo: toAmount + '',
              extraData: selectedProvider?.extraData,
              selectedExchangeChain: selectedProvider,
              sliderValue: calculateSliderValue(
                selectedFromAsset?.totalAmount,
                fromAmount,
              ),
              availableProviders: finalAvailableProviders,
            }),
          );
        } else {
          dispatch(
            setExchangeFields({
              amountTo: '0',
              availableProviders: [],
            }),
          );
        }
        setIsFetching({from: false, to: false});
      }
    },
    [
      dispatch,
      selectedFromAsset?.currencyRate,
      selectedFromAsset?.totalAmount,
      slippage,
    ],
  );

  useEffect(() => {
    getExchangeQuoteForFrom(
      selectedFromAsset,
      selectedToAsset,
      amountFrom,
    ).then();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFromAsset, selectedToAsset]);

  useEffect(() => {
    if (isFocused) {
      if (selectedCoinToOptions) {
        onChangeToValues(selectedCoinToOptions);
      }
      if (selectedCoinFromOptions) {
        onChangeFromValues(selectedCoinFromOptions);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  const onChangeToValues = useCallback(
    item => {
      const {possibleCoinDetails, selectedCoinDetails} = getCoinDetails(item);
      const customPayload = {
        label: 'Custom',
        value: 'Custom',
        options: {
          coinDetails: {},
          walletDetails: {},
        },
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

  const onPressSwap = useCallback(() => {
    const tempPossibleToCoin = structuredClone(possibleFromCoin);
    const tempPossibleFromCoin = structuredClone(possibleToCoins);
    const tempSelectedFromAssets = structuredClone(selectedToAsset);
    const tempSelectedToAssets = structuredClone(selectedFromAsset);
    const tempSelectedCoinFromOptions = structuredClone(selectedCoinToOptions);
    const tempSelectedCoinToOptions = structuredClone(selectedCoinFromOptions);
    dispatch(
      setExchangeFields({
        selectedCoinFromOptions: tempSelectedCoinFromOptions,
        selectedCoinToOptions: tempSelectedCoinToOptions,
        selectedToAsset: tempSelectedToAssets,
        selectedFromAsset: tempSelectedFromAssets,
        possibleToCoins: tempPossibleToCoin,
        possibleFromCoin: tempPossibleFromCoin,
      }),
    );
  }, [
    possibleFromCoin,
    possibleToCoins,
    selectedToAsset,
    selectedFromAsset,
    selectedCoinToOptions,
    selectedCoinFromOptions,
    dispatch,
  ]);

  const onPressProvider = useCallback(
    item => {
      const toAmount = item?.toAmount;
      const fromAmount = item?.fromAmount;
      if (toAmount) {
        const tempFiatPay = multiplyBNWithFixed(
          fromAmount,
          selectedFromAsset?.currencyRate,
          2,
        );
        dispatch(
          setExchangeFields({
            fiatPay: tempFiatPay,
            amountFrom: fromAmount + '',
            amountTo: toAmount + '',
            extraData: item?.extraData,
            selectedExchangeChain: item,
            sliderValue: calculateSliderValue(
              selectedFromAsset?.totalAmount,
              fromAmount,
            ),
          }),
        );
      }
    },
    [dispatch, selectedFromAsset?.currencyRate, selectedFromAsset?.totalAmount],
  );

  const onPressAddMoreCoin = useCallback(() => {
    addMoreCoinsSheet?.current?.close?.();
    addMoreCoinsSheet?.current?.present?.();
  }, []);

  const onDismissAddCoinsSheet = useCallback(() => {
    addMoreCoinsSheet?.current?.close?.();
  }, []);

  const onPressSlippage = useCallback(() => {
    setIsEditingSlippage(true);
  }, []);

  const onChangeSlippageValue = useCallback(
    text => {
      const sanitized = validateNumberInInput(text, 2);
      dispatch(setExchangeFields({slippage: sanitized}));
    },
    [dispatch],
  );

  const onDoneEditingSlippage = useCallback(() => {
    setIsEditingSlippage(false);
    getExchangeQuoteForFrom(
      selectedFromAsset,
      selectedToAsset,
      amountFrom,
    ).then();
  }, [amountFrom, getExchangeQuoteForFrom, selectedFromAsset, selectedToAsset]);

  useEffect(() => {
    if (isEditingSlippage && keyboardHeight > 0) {
      scrollViewRef.current?.scrollToEnd({animated: true});
    }
  }, [isEditingSlippage, keyboardHeight]);

  const fromSymbol = selectedFromAsset?.symbol;
  const fromNetwork = selectedFromAsset?.chain_symbol;
  let minimumValue = null;
  const toSymbol = selectedToAsset?.symbol;
  const toNetwork = selectedToAsset?.chain_symbol;
  if (fromSymbol && fromNetwork && toNetwork && toSymbol) {
    minimumValue = selectedExchangeChain?.minAmount || null;
  }
  const backendSlippage = selectedExchangeChain?.extraData?.slippage;
  const displaySlippage = slippage || backendSlippage;
  const isMinimumValueGreater = minimumValue > amountFrom;
  const isBalanceLess = new BigNumber(selectedFromAsset?.totalAmount).lt(
    new BigNumber(amountFrom),
  );
  const isCustomAddressRequire = customOption === 'Custom' && !customAddress;
  const balance = isNaN(selectedFromAsset?.totalAmount)
    ? ''
    : Number(selectedFromAsset?.totalAmount).toFixed(6) || '';

  const isButtonDisabled =
    !amountFrom ||
    !minimumValue ||
    !validateNumber(amountTo) ||
    isMinimumValueGreater ||
    isBalanceLess ||
    isCustomAddressRequire ||
    isFetching.to;

  const isERC20FromAsset =
    isEVMChain(selectedFromAsset?.chain_name) &&
    !!selectedFromAsset?.contractAddress;
  const showApproveAndSwap = isERC20FromAsset && !isButtonDisabled;

  // After the ERC20-level allowance is confirmed (already approved, or just
  // approved via the AllowanceInfoSheet), a permit2 swap quote still needs a
  // separate router-level (Permit2) allowance before it's safe to swap.
  const handlePermitCheckAndProceed = useCallback(async () => {
    if (!isPermit2Flow) {
      navigation.navigate('Transfer', {fromScreen: 'Exchange'});
      return;
    }
    const permitResult = await dispatch(
      fetchExchangePermitAllowance(),
    ).unwrap();
    if (permitResult?.isApproved) {
      navigation.navigate('Transfer', {fromScreen: 'Exchange'});
    } else {
      exchangePermitSheetRef.current?.present();
    }
  }, [dispatch, navigation, isPermit2Flow]);

  const handleSubmit = async () => {
    dispatch(setCurrentTransferSuccess(false));
    if (showApproveAndSwap) {
      console.log('[ExchangeDebug] entering approve flow', {
        contractAddress: selectedFromAsset?.contractAddress,
        chain_name: selectedFromAsset?.chain_name,
      });
      setIsPreparingAllowance(true);
      try {
        await dispatch(calculateExchange()).unwrap();
        console.log('[ExchangeDebug] calculateExchange resolved');
        const result = await dispatch(fetchExchangeAllowance()).unwrap();
        console.log('[ExchangeDebug] fetchExchangeAllowance result', result);
        if (result?.isApproved) {
          console.log(
            '[ExchangeDebug] already approved, checking permit2 allowance',
          );
          await handlePermitCheckAndProceed();
        } else {
          console.log(
            '[ExchangeDebug] not approved, presenting sheet. ref current:',
            !!exchangeAllowanceSheetRef.current,
          );
          exchangeAllowanceSheetRef.current?.present();
        }
      } catch (error) {
        console.log('[ExchangeDebug] threw error', error?.message, error);
        console.error('Error preparing swap allowance', error);
        showToast({
          type: 'errorToast',
          title: error?.message || 'Failed to check token allowance',
        });
      } finally {
        setIsPreparingAllowance(false);
      }
      return;
    }
    console.log('[ExchangeDebug] showApproveAndSwap is false, plain Next flow');
    navigation.navigate('Transfer', {fromScreen: 'Exchange'});
    dispatch(calculateExchange());
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
        await handlePermitCheckAndProceed();
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
        navigation.navigate('Transfer', {fromScreen: 'Exchange'});
      } catch (error) {
        console.error('Error approving permit2 allowance', error);
      }
    },
    [dispatch, navigation],
  );

  return (
    <DokSafeAreaView style={styles.container}>
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.contentContainerStyle}
          keyboardShouldPersistTaps={'always'}>
          <TouchableWithoutFeedback
            style={styles.container}
            onPress={() => Keyboard.dismiss()}>
            <View style={styles.container}>
              <View style={styles.lable}>
                <Text style={styles.title}>FROM</Text>
                <View style={styles.amountAvailable}>
                  <Text style={styles.amountAvailableText}>
                    Available amount: {balance}
                    {'0 '}
                    {` ${
                      selectedCoinFromOptions?.options?.symbol?.toUpperCase() ||
                      ''
                    }`}
                  </Text>

                  <InfoIcon width={24} height={24} stroke={theme.background} />
                </View>
              </View>
              <View style={styles.inputFrom}>
                <TouchableOpacity
                  style={styles.select}
                  onPress={() => coinFromRef.current.open()}>
                  {selectedCoinFromOptions?.options?.icon && (
                    <View style={styles.iconBox}>
                      <FastImage
                        source={{uri: selectedCoinFromOptions?.options?.icon}}
                        resizeMode={'contain'}
                        style={{height: '100%', width: '100%'}}
                      />
                    </View>
                  )}
                  <View style={styles.selectInput}>
                    <SelectInputExchange
                      selectRef={coinFromRef}
                      listData={coinOptions}
                      selectedValue={selectedCoinFromOptions?.value}
                      onValueChange={onChangeFromValues}
                    />
                  </View>
                  <Text style={styles.coinTitle}>
                    {selectedCoinFromOptions?.options?.symbol?.toUpperCase()}
                  </Text>
                  <View style={styles.arrow}>
                    <ArrIcon width={12} height={12} fill={theme.gray} />
                  </View>
                </TouchableOpacity>
                <View
                  style={[
                    styles.select,
                    {marginLeft: 20, flex: 1, justifyContent: 'flex-end'},
                  ]}>
                  {isFetching?.from ? (
                    <ActivityIndicator
                      size={'large'}
                      color={theme.background}
                    />
                  ) : (
                    <TextInput
                      style={{
                        ...styles.coinTitle,
                        color: isBalanceLess ? '#ff0000' : theme.font,
                        flex: 1,
                        textAlign: 'right',
                      }}
                      onChangeText={handleFromChange}
                      value={amountFrom}
                      placeholder="0.0"
                      keyboardType="numeric"
                    />
                  )}
                  <View style={styles.arrowAmount}>
                    <ArrIcon width={12} height={12} fill={theme.gray} />
                  </View>
                </View>
              </View>
              {!!minimumValue && isMinimumValueGreater && (
                <Text
                  style={
                    styles.errorText
                  }>{`Minimum value is ${minimumValue} ${selectedFromAsset?.symbol}`}</Text>
              )}
              {isBalanceLess && (
                <Text
                  style={
                    styles.errorText
                  }>{`You don't have ${amountFrom} ${selectedFromAsset?.symbol}`}</Text>
              )}
              {Number(selectedFromAsset?.totalAmount) > 0 ? (
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderValue}>{`${sliderValue}%`}</Text>
                  <Slider
                    ref={sliderRef}
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={100}
                    step={1}
                    minimumTrackTintColor={theme.background}
                    maximumTrackTintColor={theme.font}
                    tapToSeek={true}
                    onValueChange={onSliderValueChange}
                    value={sliderValue}
                  />
                </View>
              ) : null}
              {!!possibleFromCoin?.length && (
                <View style={styles.addressView}>
                  <DokDropdown
                    placeholder={'Select address'}
                    title={'Select address'}
                    data={possibleFromCoin}
                    onChangeValue={onSelectFromAsset}
                    value={selectedFromAsset?.address}
                    selectedTextProps={{numberOfLines: 1}}
                  />
                </View>
              )}
              <View style={styles.scurvedIcon}>
                <TouchableOpacity
                  onPress={onPressSwap}
                  hitSlop={{top: 10, left: 10, bottom: 10, right: 10}}>
                  <ScurvedIcon
                    width={25}
                    height={20}
                    stroke={theme.background}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.lable}>
                <Text style={styles.title}>TO</Text>
              </View>
              <View style={styles.inputFrom}>
                <TouchableOpacity
                  style={styles.select}
                  onPress={() => coinToRef.current.open()}>
                  {selectedCoinToOptions?.options?.icon && (
                    <View style={styles.iconBox}>
                      <FastImage
                        source={{uri: selectedCoinToOptions?.options?.icon}}
                        resizeMode={'contain'}
                        style={{height: '100%', width: '100%'}}
                      />
                    </View>
                  )}
                  <View style={styles.selectInput}>
                    <SelectInputExchange
                      selectRef={coinToRef}
                      listData={coinOptions}
                      selectedValue={selectedCoinToOptions?.value}
                      onValueChange={onChangeToValues}
                    />
                  </View>
                  <Text style={styles.coinTitle}>
                    {selectedCoinToOptions?.options?.symbol?.toUpperCase()}
                  </Text>
                  <View style={styles.arrow}>
                    <ArrIcon width={12} height={12} fill={theme.gray} />
                  </View>
                </TouchableOpacity>
                <View
                  style={[
                    styles.select,
                    {marginLeft: 20, flex: 1, justifyContent: 'flex-end'},
                  ]}>
                  {isFetching?.to ? (
                    <ActivityIndicator
                      size={'large'}
                      color={theme.background}
                    />
                  ) : (
                    <TextInput
                      style={[styles.coinTitle, {flex: 1, textAlign: 'right'}]}
                      value={amountTo}
                      placeholder="0.0"
                      keyboardType="numeric"
                      editable={false}
                    />
                  )}
                  <View style={styles.arrowAmount}>
                    <ArrIcon width={12} height={12} fill={theme.gray} />
                  </View>
                </View>
              </View>
              <Text style={styles.addCoinText}>
                {'Looking for more coins?'}
                <Text
                  style={{color: theme.background}}
                  onPress={onPressAddMoreCoin}>
                  {' Click here for add coins on selected wallet'}
                </Text>
              </Text>
              {!!possibleToCoins?.length && (
                <View style={styles.addressView}>
                  <DokDropdown
                    placeholder={'Select address'}
                    title={'Select address'}
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
                    colors: {
                      onSurfaceVariant: '#989898',
                      primary: '#989898',
                    },
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
              {!isFetching?.to && !!availableProviders?.length && (
                <>
                  <Text style={styles.selectTitle}>{'Exchange Providers'}</Text>
                  {availableProviders?.map(item => (
                    <ExchangeProviderItem
                      key={item?.providerName}
                      item={item}
                      selectedToAsset={selectedToAsset}
                      selectedFromAsset={selectedFromAsset}
                      selectedExchangeChain={selectedExchangeChain}
                      onPressItem={onPressProvider}
                    />
                  ))}
                </>
              )}
              <View style={styles.textContainer}>
                <Text style={styles.text}>Minimum amount</Text>
                <View style={styles.amountAvailable}>
                  <Text style={styles.textValue}>{`${minimumValue || 0} ${
                    selectedFromAsset?.symbol || ''
                  }`}</Text>
                </View>
              </View>
              {!!selectedExchangeChain && !!backendSlippage && (
                <View style={styles.textContainer}>
                  <Text style={styles.text}>Slippage</Text>
                  {isEditingSlippage ? (
                    <View style={styles.amountAvailable}>
                      <TextInput
                        style={styles.textValue}
                        keyboardType="numeric"
                        autoFocus={true}
                        value={`${displaySlippage}`}
                        onChangeText={onChangeSlippageValue}
                        onBlur={onDoneEditingSlippage}
                        onSubmitEditing={onDoneEditingSlippage}
                      />
                      <EditIcon
                        width={14}
                        height={14}
                        fill={theme.gray}
                        style={styles.editIcon}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.amountAvailable}
                      onPress={onPressSlippage}>
                      <Text style={styles.textValue}>
                        {`${displaySlippage}%`}
                      </Text>
                      <EditIcon
                        width={14}
                        height={14}
                        fill={theme.gray}
                        style={styles.editIcon}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <View style={styles.textContainer}>
                <Text style={{...styles.text, fontFamily: 'Roboto-Bold'}}>
                  You pay
                </Text>
                <View style={styles.amountAvailable}>
                  <Text
                    style={{...styles.textValue, fontFamily: 'Roboto-Bold'}}>
                    {amountFrom || '0.0'}
                    {` ${
                      selectedCoinFromOptions?.options?.symbol?.toUpperCase() ||
                      ''
                    }`}
                  </Text>
                </View>
              </View>
              <View style={styles.textContainer}>
                <Text style={{...styles.text, fontFamily: 'Roboto-Bold'}}>
                  You pay in fiat
                </Text>
                <View style={styles.amountAvailable}>
                  <Text
                    style={{...styles.textValue, fontFamily: 'Roboto-Bold'}}>
                    {`${currencySymbol[localCurrency]}${fiatPay || '0.0'}`}
                  </Text>
                </View>
              </View>

              <View style={styles.boxFooter}>
                <Text style={styles.textStyle}>
                  {`Swap services are available through third-party API provider (${exchangeProvidersText}).`}
                </Text>

                {customOption === 'Custom' && (
                  <Text style={[styles.warningText]}>
                    {
                      'Please ensure the custom wallet address before exchanging.'
                    }
                  </Text>
                )}
                <TouchableOpacity
                  style={{
                    ...styles.button,
                    backgroundColor:
                      isButtonDisabled || isPreparingAllowance
                        ? '#708090'
                        : theme.background,
                  }}
                  onPress={handleSubmit}
                  disabled={isButtonDisabled || isPreparingAllowance}>
                  {isPreparingAllowance ? (
                    <ActivityIndicator size="small" color={theme.title} />
                  ) : (
                    <Text style={styles.buttonTitle}>
                      {showApproveAndSwap ? 'Approve and Swap' : 'Next'}
                    </Text>
                  )}
                </TouchableOpacity>
                <View style={{height: keyboardHeight, width: '100%'}} />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
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
