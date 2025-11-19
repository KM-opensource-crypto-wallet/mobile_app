import React, { useCallback, useContext, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import ProgressDialog from 'react-native-progress-dialog';
import { ThemeContext } from '../../../theme/ThemeContext';
import myStyles from './SellCryptoStyles';
import { Portal, Provider, TextInput } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { IS_ANDROID } from '../../../utils/dimensions';
import { Formik } from 'formik';
import { sellCryptoValidation } from '../../../utils/validationSchema';
import DokDropdown from '../../../components/DokDropdown';
import CryptoCurrencyOptionItem from '../../../components/CryptoCurrencyOptionItem';
import FastImage from '@d11/react-native-fast-image';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { getUserCoinsOptions } from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import FiatCurrencyOptionItem from '../../../components/FiatCurrencyOptionItem';
import { validateNumberInInput } from 'dok-wallet-blockchain-networks/helper';
import Clipboard from '@react-native-clipboard/clipboard';
import { triggerHapticFeedbackLight } from '../../../utils/hapticFeedback';
import CopyIcon from '../../../assets/images/icons/copy.svg';
import Toast from 'react-native-toast-message';
import { getLocalCurrency } from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import { validateNumber } from 'dok-wallet-blockchain-networks/helper';
import { currencySymbol } from '../../../data/currency';
import Loading from '../../../components/Loading';
import { WebViewModal } from './WebViewModal';
import { selectAllWallets } from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import { _currentWalletIndexSelector } from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import { getSellCryptoProviders } from 'dok-wallet-blockchain-networks/redux/sellCrypto/sellCryptoSelectors';
import { getSellCryptoLoading } from 'dok-wallet-blockchain-networks/redux/sellCrypto/sellCryptoSelectors';
import { setSellCryptoLoading } from 'dok-wallet-blockchain-networks/redux/sellCrypto/sellCryptoSlice';
import { debounceFetchSellCryptoQuote } from 'dok-wallet-blockchain-networks/redux/sellCrypto/sellCryptoSlice';
import { fetchSellCryptoQuote } from 'dok-wallet-blockchain-networks/redux/sellCrypto/sellCryptoSlice';
import { setRequestDetails } from 'dok-wallet-blockchain-networks/redux/sellCrypto/sellCryptoSlice';
import { fetchSellCryptoPaymentDetails } from 'dok-wallet-blockchain-networks/redux/sellCrypto/sellCryptoSlice';
import { fetchSellCryptoUrl } from 'dok-wallet-blockchain-networks/redux/sellCrypto/sellCryptoSlice';
import { initiateSellCryptoTransfer } from 'dok-wallet-blockchain-networks/redux/sellCrypto/sellCryptoSlice';
import { setCurrentTransferSuccess } from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSlice';
import { getSellCryptoRequestDetails } from 'dok-wallet-blockchain-networks/redux/sellCrypto/sellCryptoSelectors';
import { setTransferDetails } from 'dok-wallet-blockchain-networks/redux/sellCrypto/sellCryptoSlice';
import { getSelectedCountry } from 'dok-wallet-blockchain-networks/redux/cryptoProviders/cryptoProvidersSelectors';

const SellCrypto = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const styles = myStyles(theme);

  const currencyPicker = [
    {
      label: '$ USD',
      displayTitle: '$',
      value: 'USD',
    },
    {
      label: '€ EURO',
      displayTitle: '€',
      value: 'EUR',
    },
  ];

  const localCurrency = useSelector(getLocalCurrency);
  const cryptoProviders = useSelector(getSellCryptoProviders);
  const dispatch = useDispatch();
  const [progressDialogVisible, setProgressDialogVisible] = useState(false);
  const [modalAddCoinsVisible, setModalAddCoinsVisible] = useState(false);
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [webViewUri, setWebViewUri] = useState('');
  const isLoading = useSelector(getSellCryptoLoading);
  const coinOptions = useSelector(getUserCoinsOptions, shallowEqual);
  const allWallets = useSelector(selectAllWallets);
  const currentWalletIndex = useSelector(_currentWalletIndexSelector);
  const sellCryptoRequestDetails = useSelector(getSellCryptoRequestDetails);
  const selectedCountry = useSelector(getSelectedCountry);

  const formikRef = useRef();

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
      return { selectedCoinDetails, possibleCoinDetails, selectedWalletDetails };
    },
    [allWallets, currentWalletIndex],
  );

  const onPressItem = useCallback(
    async item => {
      const chainDetails = formikRef?.current?.values?.selectedCoin?.options;
      if (
        !chainDetails ||
        !formikRef?.current?.values?.amount ||
        formikRef?.current?.values?.amount === '0'
      ) {
        return;
      }
      const payload = {
        providerName: item?.provider_name,
        selectedCoin: {
          symbol: chainDetails?.symbol,
          chain_name: chainDetails?.chain_name,
        },
        amount: validateNumber(formikRef?.current?.values?.amount) || '0',
        fiatCurrency: formikRef?.current?.values?.fiatCurrency,
        quoteId: item?.extraData?.id,
      };

      if (item?.extraData?.url) {
        setWebViewUri(item?.extraData?.url);
        // TO BE HANDLED setRequestId(item?.extraData?.id);
        setWebViewVisible(true);
      } else {
        setProgressDialogVisible(true);
        const resp = await dispatch(fetchSellCryptoUrl(payload));
        setProgressDialogVisible(false);
        if (!resp || !resp.payload) {
          Toast.show({
            type: 'errorToast',
            text1: 'Unable to fetch the URL',
          });
          return;
        }
        const respUrl = resp?.payload;
        const splitArr = respUrl?.split('requestId=');
        let requestId = '';
        if (splitArr.length !== 2) {
          requestId = '';
        } else {
          requestId = splitArr[1];
        }
        const coinDetails = getCoinDetails(
          formikRef?.current?.values?.selectedCoin,
        );
        dispatch(
          setRequestDetails({
            requestId: requestId,
            providerName: item?.provider_name,
            providerDisplayName: item?.title,
            selectedFromAsset: coinDetails?.selectedCoinDetails,
            selectedFromWallet: coinDetails?.selectedWalletDetails,
          }),
        );

        setWebViewUri(respUrl);
        setWebViewVisible(true);
      }
    },
    [dispatch, getCoinDetails],
  );

  const handleWebViewClose = useCallback(
    async (success, data) => {
      setWebViewVisible(false);
      if (success) {
        if (data != null) {
          dispatch(
            setTransferDetails({
              depositAmount: data.baseCurrencyAmount,
              depositAddress: data.depositWalletAddress,
              memo: data?.depositWalletAddressTag,
            }),
          );
        } else {
          await dispatch(fetchSellCryptoPaymentDetails());
        }
        dispatch(setCurrentTransferSuccess(false));
        dispatch(initiateSellCryptoTransfer());
        navigation.navigate('Transfer', { fromScreen: 'SellCrypto' });
      }
    },
    [dispatch, navigation],
  );

  const onSubmit = useCallback(
    async (values, _, isNotDismissKeyboard, isDebounce) => {
      if (!isNotDismissKeyboard) {
        Keyboard.dismiss();
      }
      const chainDetails = values?.selectedCoin?.options;
      if (!chainDetails || !values.amount || values?.amount === '0') {
        return;
      }
      const payload = {
        fiatCurrency: values?.fiatCurrency,
        amount: validateNumber(values?.amount) || '0',
        chain_name: chainDetails?.chain_name,
        symbol: chainDetails?.symbol,
        walletAddress: chainDetails?.walletAddress,
        from_device: Platform.OS,
      };
      const fromDevice = Platform.OS;
      if (isDebounce) {
        dispatch(setSellCryptoLoading(true));
        dispatch(
          debounceFetchSellCryptoQuote({
            ...payload,
            currentCountry: selectedCountry,
            fromDevice,
          }),
        );
      } else {
        dispatch(
          fetchSellCryptoQuote({
            ...payload,
            currentCountry: selectedCountry,
            fromDevice,
          }),
        );
      }
    },
    [dispatch],
  );

  return (
    <Provider>
      <Portal>
        <KeyboardAwareScrollView
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          bounces={false}
          keyboardShouldPersistTaps={'always'}
          {...(IS_ANDROID ? { extraScrollHeight: 30 } : {})}
          enableResetScrollToCoords={false}
          keyboardOpeningTime={Number.MAX_SAFE_INTEGER}
          contentContainerStyle={styles.contentContainerStyle}>
          <TouchableWithoutFeedback
            style={styles.container}
            onPress={() => Keyboard.dismiss()}>
            <View style={styles.container}>
              <Formik
                innerRef={formikRef}
                initialValues={{
                  amount: '0.1',
                  selectedCoin: null,
                  fiatCurrency: localCurrency,
                }}
                validationSchema={sellCryptoValidation}
                onSubmit={onSubmit}>
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  values,
                  errors,
                  touched,
                  setFieldValue,
                }) => (
                  <View>
                    <DokDropdown
                      titleStyle={{ color: theme.primary }}
                      placeholder={'Select Crypto'}
                      title={'Select Crypto'}
                      data={coinOptions}
                      dropdownStyle={{ height: 70 }}
                      search={true}
                      searchField={'value'}
                      keyboardAvoiding={true}
                      searchPlaceholder={'Search'}
                      onChangeValue={item => {
                        setFieldValue('selectedCoin', item);
                        onSubmit(
                          { ...values, selectedCoin: item },
                          null,
                          true,
                          false,
                        );
                      }}
                      value={values.selectedCoin?.value}
                      renderItem={item => {
                        return <CryptoCurrencyOptionItem item={item} />;
                      }}
                      renderLeftIcon={() =>
                        values.selectedCoin?.options?.icon && (
                          <FastImage
                            source={{ uri: values.selectedCoin?.options?.icon }}
                            resizeMode={'contain'}
                            style={{ height: 40, width: 40, marginRight: 8 }}
                          />
                        )
                      }
                      labelField="options.displayTitle"
                    />
                    {errors.selectedCoin && touched.selectedCoin && (
                      <Text style={styles.textConfirm}>
                        {errors.selectedCoin}
                      </Text>
                    )}
                    <Text style={styles.addCoinText}>
                      {'Looking for more coins?'}
                      <Text
                        style={{ color: theme.background }}
                        onPress={() => setModalAddCoinsVisible(true)}>
                        {' Click here for add coins on selected wallet'}
                      </Text>
                    </Text>
                    <View style={{ height: 12 }} />
                    <DokDropdown
                      titleStyle={{ color: theme.primary }}
                      placeholder={'Select payout currency'}
                      title={'Select Payout Currency'}
                      data={currencyPicker}
                      dropdownStyle={{ height: 70 }}
                      onChangeValue={item => {
                        setFieldValue('fiatCurrency', item.value);
                        onSubmit(
                          { ...values, fiatCurrency: item.value },
                          null,
                          true,
                          false,
                        );
                      }}
                      renderItem={item => (
                        <FiatCurrencyOptionItem item={item} />
                      )}
                      value={values.fiatCurrency}
                      labelField="value"
                      selectedTextStyle={{
                        marginLeft: 12,
                        color: theme.primary,
                        fontWeight: '600',
                        fontSize: 16,
                      }}
                    />
                    <TextInput
                      style={styles.input}
                      label="Amount"
                      textColor={theme.font}
                      theme={{
                        colors: {
                          onSurfaceVariant: '#989898',
                          primary: '#989898',
                        },
                      }}
                      outlineColor={errors.amount ? 'red' : '#989898'}
                      activeOutlineColor={
                        errors.amount ? 'red' : theme.borderActiveColor
                      }
                      returnKeyType="next"
                      mode="outlined"
                      blurOnSubmit={false}
                      name="amount"
                      onChangeText={text => {
                        const tempValues = validateNumberInInput(
                          text,
                          values?.selectedCoin?.options?.decimal,
                        );
                        setFieldValue('amount', tempValues);
                        onSubmit(
                          { ...values, amount: tempValues },
                          null,
                          true,
                          true,
                        );
                      }}
                      onBlur={handleBlur('amount')}
                      value={values.amount}
                      keyboardType={'decimal-pad'}
                    />
                    {errors.amount && touched.amount && (
                      <Text style={styles.textConfirm}>{errors.amount}</Text>
                    )}
                    {!!values?.selectedCoin?.options?.walletAddress && (
                      <View style={styles.addView}>
                        <View style={styles.rowView}>
                          <Text style={styles.selectTitle}>
                            {'Wallet Address'}
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              Clipboard.setString(
                                values?.selectedCoin?.options?.walletAddress,
                              );
                              triggerHapticFeedbackLight();
                              Toast.show({
                                type: 'successToast',
                                text1: 'Address copied',
                              });
                            }}>
                            <CopyIcon
                              fill={theme.background}
                              width={20}
                              height={30}
                            />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.description}>
                          {values?.selectedCoin?.options?.walletAddress}
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.button}
                      onPress={handleSubmit}>
                      <Text style={styles.buttonTitle}>
                        {'Check Best Price'}
                      </Text>
                    </TouchableOpacity>
                    {isLoading ? (
                      <Loading />
                    ) : (
                      cryptoProviders?.map((item, index) => (
                        <TouchableOpacity
                          key={`cryptoProvider_${index}`}
                          style={styles.btn}
                          onPress={() => {
                            onPressItem(item);
                          }}>
                          <View style={styles.imageBox}>
                            <FastImage
                              source={{ uri: item.src }}
                              style={styles.image}
                            />
                          </View>
                          <View style={styles.btnBox}>
                            <Text style={styles.btnTitle}>{item.title}</Text>
                            <Text style={styles.btnCoins} numberOfLines={1}>
                              {item?.fromAmount &&
                                item?.toAmount &&
                                values.selectedCoin
                                ? `${item.fromAmount} ${values.selectedCoin?.options?.symbol
                                } ==> ${currencySymbol[values.fiatCurrency]}${item.toAmount
                                }`
                                : ''}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
              </Formik>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAwareScrollView>
      </Portal>
      <ProgressDialog visible={progressDialogVisible} />
      <WebViewModal
        visible={webViewVisible}
        uri={webViewUri}
        onClose={handleWebViewClose}
        title={sellCryptoRequestDetails?.providerDisplayName}
      />
    </Provider>
  );
};

export default SellCrypto;
