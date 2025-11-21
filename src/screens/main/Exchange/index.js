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

import myStyles from './ExchangeStyles';

import {shallowEqual, useSelector, useDispatch} from 'react-redux';
import ArrIcon from 'assets/images/icons/ic_arrow_right.svg';
import InfoIcon from 'assets/images/icons/info.svg';
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
import {getExchange} from 'dok-wallet-blockchain-networks/redux/exchange/exchangeSelectors';
import {
  calculateExchange,
  setExchangeFields,
} from 'dok-wallet-blockchain-networks/redux/exchange/exchangeSlice';
import BigNumber from 'bignumber.js';
import {
  calculateSliderValue,
  debounce,
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

const calculateEstimatePrice = async (
  selectedFromAsset,
  selectedToAsset,
  data,
  dispatch,
  callback,
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
  } = useSelector(getExchange);
  const localCurrency = useSelector(getLocalCurrency);

  const keyboardHeight = useKeyboardHeight();

  const [isFetching, setIsFetching] = useState({from: false, to: false});

  const minimumAmountRef = useRef({});
  const sliderRef = useRef();

  const dispatch = useDispatch();
  const coinFromRef = useRef();
  const coinToRef = useRef();
  const isFocused = useIsFocused();
  const addMoreCoinsSheet = useRef();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounceEstimateAmount = useCallback(
    debounce(
      (
        localSelectedFromAsset,
        localSelectedToAsset,
        localData,
        localDispatch,
        callback,
      ) =>
        calculateEstimatePrice(
          localSelectedFromAsset,
          localSelectedToAsset,
          localData,
          localDispatch,
          callback,
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
        );
      }
    },
    [debounceEstimateAmount, dispatch, selectedFromAsset, selectedToAsset],
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

  const handleSubmit = useCallback(async () => {
    dispatch(setCurrentTransferSuccess(false));
    navigation.navigate('Transfer', {fromScreen: 'Exchange'});
    dispatch(calculateExchange());
  }, [dispatch, navigation]);

  const getCoinDetails = useCallback(
    coinDetails => {
      let selectedCoinDetails = {};
      let selectedWalletDetails = {};
      let possibleCoinDetails = [];
      for (let i = 0; i < allWallets.length; i++) {
        const tempWallet = allWallets[i];
        const tempCoinDetails = tempWallet?.coins.find(
          item =>
            item?.symbol?.toUpperCase() ===
              coinDetails?.options?.symbol?.toUpperCase() &&
            item?.chain_name === coinDetails?.options?.chain_name,
        );
        if (tempCoinDetails?.chain_symbol === 'BNB') {
          tempCoinDetails.chain_symbol = 'BSC';
        }
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
              walletDetails: selectedWalletDetails,
            },
          };
          possibleCoinDetails.push(optionPayload);
        }
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
    [dispatch, selectedFromAsset?.currencyRate, selectedFromAsset?.totalAmount],
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

  const fromSymbol = selectedFromAsset?.symbol;
  const fromNetwork = selectedFromAsset?.chain_symbol;
  let minimumValue = null;
  const toSymbol = selectedToAsset?.symbol;
  const toNetwork = selectedToAsset?.chain_symbol;
  if (fromSymbol && fromNetwork && toNetwork && toSymbol) {
    minimumValue = selectedExchangeChain?.minAmount || null;
  }
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

  return (
    <DokSafeAreaView style={styles.container}>
      <View style={styles.container}>
        <ScrollView
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
                    backgroundColor: isButtonDisabled
                      ? '#708090'
                      : theme.background,
                  }}
                  onPress={handleSubmit}
                  disabled={isButtonDisabled}>
                  <Text style={styles.buttonTitle}>Next</Text>
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
        {/*<ModalExchange*/}
        {/*  visible={true}*/}
        {/*  hideModal={setmodalVisible}*/}
        {/*  reset={() => {*/}
        {/*    setAmountFrom('');*/}
        {/*    setAmountTo('');*/}
        {/*  }}*/}
        {/*  navigation={navigation}*/}
        {/*/>*/}
      </View>
    </DokSafeAreaView>
  );
};

export default Exchange;
