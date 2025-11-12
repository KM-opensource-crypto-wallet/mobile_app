import React, {useContext, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import {Formik} from 'formik';
import myStyles from './CryptoProvidersStyles';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import {Portal, Provider, TextInput} from 'react-native-paper';
import Clipboard from '@react-native-clipboard/clipboard';
import {ThemeContext} from 'theme/ThemeContext';
import {InAppBrowser} from 'react-native-inappbrowser-reborn';
import {getUserCoinsOptions} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import FastImage from '@d11/react-native-fast-image';
import DokDropdown from 'components/DokDropdown';
import CryptoCurrencyOptionItem from 'components/CryptoCurrencyOptionItem';
import {amountValidation} from 'utils/validationSchema';
import {currencySymbol} from 'data/currency';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import CopyIcon from 'assets/images/icons/copy.svg';
import {triggerHapticFeedbackLight} from 'utils/hapticFeedback';
import Toast from 'react-native-toast-message';
import FiatCurrencyOptionItem from 'components/FiatCurrencyOptionItem';
import {
  getCryptoProviders,
  getCryptoProvidersLoading,
  getSelectedCountry,
} from 'dok-wallet-blockchain-networks/redux/cryptoProviders/cryptoProvidersSelectors';
import {
  debounceFetchBuyCryptoQuote,
  fetchBuyCryptoQuote,
  setCryptoProviderLoading,
} from 'dok-wallet-blockchain-networks/redux/cryptoProviders/cryptoProviderSlice';
import Loading from 'components/Loading';
import {APP_VERSION, inAppBrowserOptions} from 'utils/common';
import {
  getBuyCryptoUrl,
  getIPAddress,
} from 'dok-wallet-blockchain-networks/service/dokApi';
import {
  validateNumber,
  validateNumberInInput,
} from 'dok-wallet-blockchain-networks/helper';
import {IS_ANDROID, IS_IOS} from 'utils/dimensions';
import ModalAddCoins from 'components/ModalAddCoins';
import PaymentOptionItem from 'components/PaymentOptionItem';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {IS_KIML_WALLET} from 'utils/wlData';

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

const paymentOptions = [
  {
    label: 'Apple Pay',
    value: 'apple_pay',
    options: {
      icon: 'apple',
    },
  },
  {
    label: 'Credit Card',
    value: 'credit_card',
    options: {
      icon: 'credit-card',
    },
  },
];

const CryptoProviders = () => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const localCurrency = useSelector(getLocalCurrency);
  const coinOptions = useSelector(getUserCoinsOptions, shallowEqual);
  const cryptoProviders = useSelector(getCryptoProviders);
  const isLoading = useSelector(getCryptoProvidersLoading);
  const dispatch = useDispatch();
  const addMoreCoinsSheet = useRef();
  const selectedCountry = useSelector(getSelectedCountry);

  const formikRef = useRef();

  useEffect(() => {
    dispatch(setCryptoProviderLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPressItem = useCallback(async item => {
    try {
      const selectedCoin = formikRef.current?.values?.selectedCoin?.options;
      const paymentMethod =
        formikRef.current?.values?.selectedPaymentMethod?.value;
      const amount = formikRef.current?.values?.amount;
      const fiatCurrency = formikRef.current?.values?.fiatCurrency;
      if (!selectedCoin) {
        formikRef?.current?.setFieldError('selectedCoin');
        formikRef?.current?.setFieldTouched('selectedCoin', true);
        return;
      }
      if (isNaN(Number(amount)) || !Number(amount)) {
        formikRef?.current?.setFieldError('amount');
        formikRef?.current?.setFieldTouched('amount', true);
        return;
      }
      const isAvailable = await InAppBrowser.isAvailable();
      let ipAddress = null;
      if (item?.provider_name === 'simplex') {
        ipAddress = await getIPAddress();
      }
      if (isAvailable) {
        const url = item?.extraData?.url;
        if (item?.extraData?.url) {
          await InAppBrowser.open(url, inAppBrowserOptions);
        } else {
          const resp = await getBuyCryptoUrl({
            ...item,
            selectedCoin,
            fiatCurrency,
            amount,
            ipAddress,
            payment_method: paymentMethod,
            appVersion: APP_VERSION,
            from_device: Platform.OS,
          });
          await InAppBrowser.open(resp?.data, inAppBrowserOptions);
        }
      } else {
        console.error('Provider not found');
      }
    } catch (e) {
      console.error('Error in press item', e);
    }
  }, []);

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
        payment_method: values.selectedPaymentMethod?.value,
        chain_name: chainDetails?.chain_name,
        type: chainDetails?.type,
        symbol: chainDetails?.symbol,
        walletAddress: chainDetails?.walletAddress,
        from_device: Platform.OS,
      };
      const fromDevice = Platform.OS;
      if (isDebounce) {
        dispatch(setCryptoProviderLoading(true));
        dispatch(
          debounceFetchBuyCryptoQuote({
            ...payload,
            currentCountry: selectedCountry,
            fromDevice,
          }),
        );
      } else {
        dispatch(
          fetchBuyCryptoQuote({
            ...payload,
            currentCountry: selectedCountry,
            fromDevice,
          }),
        );
      }
    },
    [dispatch, selectedCountry],
  );

  const onPressAddMoreCoin = useCallback(() => {
    addMoreCoinsSheet?.current?.close?.();
    addMoreCoinsSheet?.current?.present?.();
  }, []);

  const onDismissAddCoinsSheet = useCallback(() => {
    addMoreCoinsSheet?.current?.close?.();
  }, []);

  return (
    <Provider>
      <Portal>
        <ModalAddCoins
          bottomSheetRef={ref => (addMoreCoinsSheet.current = ref)}
          onDismiss={onDismissAddCoinsSheet}
        />
        <KeyboardAwareScrollView
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          bounces={false}
          keyboardShouldPersistTaps={'always'}
          {...(IS_ANDROID ? {extraScrollHeight: 30} : {})}
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
                  amount: '100',
                  selectedCoin: null,
                  fiatCurrency: localCurrency,
                  selectedPaymentMethod:
                    IS_IOS && IS_KIML_WALLET ? paymentOptions[0] : null,
                }}
                validationSchema={amountValidation}
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
                    {IS_IOS && IS_KIML_WALLET && (
                      <>
                        <DokDropdown
                          titleStyle={{color: theme.primary}}
                          placeholder={'Select payment method'}
                          title={'Select Payment Method'}
                          data={paymentOptions}
                          dropdownStyle={{height: 70}}
                          onChangeValue={item => {
                            setFieldValue('selectedPaymentMethod', item);
                            onSubmit(
                              {...values, selectedPaymentMethod: item},
                              null,
                              true,
                              false,
                            );
                          }}
                          value={values.selectedPaymentMethod?.value}
                          renderItem={item => {
                            return <PaymentOptionItem item={item} />;
                          }}
                          selectedTextStyle={{
                            marginLeft: 12,
                            color: theme.primary,
                            fontWeight: '600',
                            fontSize: 16,
                          }}
                          renderLeftIcon={() =>
                            values.selectedPaymentMethod?.options?.icon && (
                              <MaterialCommunityIcon
                                name={
                                  values.selectedPaymentMethod?.options?.icon
                                }
                                color={theme.font}
                                size={32}
                              />
                            )
                          }
                        />
                        <View style={styles.paddingView} />
                      </>
                    )}
                    <DokDropdown
                      titleStyle={{color: theme.primary}}
                      placeholder={'Select Crypto'}
                      title={'Select Crypto'}
                      data={coinOptions}
                      dropdownStyle={{height: 70}}
                      search={true}
                      searchField={'value'}
                      keyboardAvoiding={true}
                      searchPlaceholder={'Search'}
                      onChangeValue={item => {
                        setFieldValue('selectedCoin', item);
                        onSubmit(
                          {...values, selectedCoin: item},
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
                            source={{uri: values.selectedCoin?.options?.icon}}
                            resizeMode={'contain'}
                            style={{height: 40, width: 40, marginRight: 8}}
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
                        style={{color: theme.background}}
                        onPress={onPressAddMoreCoin}>
                        {' Click here for add coins on selected wallet'}
                      </Text>
                    </Text>
                    <View style={styles.rowView}>
                      <DokDropdown
                        dropdownStyle={{
                          height: 70,
                          width: 60,
                          paddingHorizontal: 0,
                          paddingLeft: 8,
                          marginTop: 20,
                        }}
                        customSelectedTextStyle={{fontSize: 32}}
                        contentContainerStyle={{width: 100}}
                        titleStyle={{color: theme.primary}}
                        data={currencyPicker}
                        onChangeValue={item => {
                          setFieldValue('fiatCurrency', item.value);
                          onSubmit(
                            {...values, fiatCurrency: item.value},
                            null,
                            true,
                            false,
                          );
                        }}
                        renderItem={item => (
                          <FiatCurrencyOptionItem item={item} />
                        )}
                        value={values.fiatCurrency}
                        labelField="displayTitle"
                      />
                      <TextInput
                        style={styles.input}
                        label="    Amount"
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
                            {...values, amount: tempValues},
                            null,
                            true,
                            true,
                          );
                        }}
                        onBlur={handleBlur('amount')}
                        value={values.amount}
                        keyboardType={'decimal-pad'}
                      />
                    </View>
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
                      cryptoProviders?.map((item, index) =>
                        values?.selectedPaymentMethod?.value === 'apple_pay' &&
                        item.title === 'Coinify' ? null : (
                          <TouchableOpacity
                            key={`cryptoProvider_${index}`}
                            style={styles.btn}
                            onPress={() => {
                              onPressItem(item);
                            }}>
                            <View style={styles.imageBox}>
                              <FastImage
                                source={{uri: item.src}}
                                style={styles.image}
                              />
                            </View>
                            <View style={styles.btnBox}>
                              <Text style={styles.btnTitle}>{item.title}</Text>
                              <Text style={styles.btnCoins} numberOfLines={1}>
                                {item?.fromAmount &&
                                item?.toAmount &&
                                values.selectedCoin
                                  ? `${currencySymbol[values.fiatCurrency]}${
                                      item.fromAmount
                                    } ==> ${item.toAmount} ${
                                      values.selectedCoin?.options?.symbol
                                    }`
                                  : ''}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ),
                      )
                    )}
                  </View>
                )}
              </Formik>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAwareScrollView>
      </Portal>
    </Provider>
  );
};

export default CryptoProviders;
