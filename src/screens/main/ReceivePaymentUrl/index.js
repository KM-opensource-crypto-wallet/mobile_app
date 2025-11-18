import React, {
  useContext,
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {Formik} from 'formik';
import myStyles from './ReceivePaymentUrlStyles';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import {Portal, Provider, TextInput} from 'react-native-paper';
import Clipboard from '@react-native-clipboard/clipboard';
import {ThemeContext} from 'theme/ThemeContext';
import {getUserCoinsOptions} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import FastImage from '@d11/react-native-fast-image';
import DokDropdown from 'components/DokDropdown';
import CryptoCurrencyOptionItem from 'components/CryptoCurrencyOptionItem';
import {amountValidation} from 'utils/validationSchema';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import CopyIcon from 'assets/images/icons/copy.svg';
import {triggerHapticFeedbackLight} from 'utils/hapticFeedback';
import Toast from 'react-native-toast-message';
import {setCryptoProviderLoading} from 'dok-wallet-blockchain-networks/redux/cryptoProviders/cryptoProviderSlice';
import ModalAddCoins from 'components/ModalAddCoins';
import BigNumber from 'bignumber.js';
import {
  multiplyBNWithFixed,
  validateNumberInInput,
} from 'dok-wallet-blockchain-networks/helper';
import {URLData} from 'utils/wlData';

const ReceivePaymentUrl = () => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const localCurrency = useSelector(getLocalCurrency);
  const coinOptions = useSelector(getUserCoinsOptions, shallowEqual);
  const dispatch = useDispatch();
  const addMoreCoinsSheet = useRef();

  const formikRef = useRef();

  useEffect(() => {
    dispatch(setCryptoProviderLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <ScrollView
          style={styles.container}
          keyboardShouldPersistTaps={'always'}
          contentContainerStyle={styles.contentContainerStyle}>
          <View style={styles.container}>
            <Formik
              innerRef={formikRef}
              initialValues={{
                amount: '',
                selectedCoin: null,
                currencyAmount: '',
              }}
              validationSchema={amountValidation}
              onSubmit={() => {}}>
              {({handleBlur, values, errors, touched, setFieldValue}) => {
                const selectedCoin = values?.selectedCoin?.options;
                const receivePaymentUrl = `${URLData.appUrl}/home/send/send-funds?address=${selectedCoin?.walletAddress}&amount=${values?.amount}&currency=${selectedCoin?.chain_name}:${selectedCoin?.symbol}`;
                return (
                  <TouchableWithoutFeedback
                    style={styles.container}
                    onPress={() => {
                      Keyboard.dismiss();
                    }}>
                    <View>
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
                        }}
                        value={values.selectedCoin?.value}
                        renderItem={item => {
                          return <CryptoCurrencyOptionItem item={item} />;
                        }}
                        renderLeftIcon={() =>
                          selectedCoin?.icon && (
                            <FastImage
                              source={{uri: selectedCoin?.icon}}
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
                        returnKeyType="done"
                        onSubmitEditing={() => {
                          Keyboard.dismiss();
                        }}
                        mode="outlined"
                        blurOnSubmit={false}
                        name="amount"
                        onChangeText={text => {
                          const tempValues = validateNumberInInput(
                            text,
                            selectedCoin?.decimal,
                          );
                          const tempAmount = multiplyBNWithFixed(
                            tempValues,
                            selectedCoin?.currencyRate,
                            2,
                          );
                          setFieldValue('currencyAmount', tempAmount);
                          setFieldValue('amount', tempValues);
                        }}
                        onBlur={handleBlur('amount')}
                        value={values.amount}
                        keyboardType={'decimal-pad'}
                      />
                      {errors.amount && touched.amount && (
                        <Text style={styles.textConfirm}>{errors.amount}</Text>
                      )}
                      <TextInput
                        style={styles.input}
                        label={`Enter ${localCurrency} amount`}
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
                        returnKeyType="done"
                        onSubmitEditing={() => {
                          Keyboard.dismiss();
                        }}
                        mode="outlined"
                        blurOnSubmit={false}
                        name="currencyAmount"
                        onChangeText={text => {
                          const tempValues = validateNumberInInput(text, 2);
                          const tempAmount = new BigNumber(tempValues)
                            .dividedBy(
                              new BigNumber(selectedCoin?.currencyRate),
                            )
                            .toFixed(
                              selectedCoin?.decimal
                                ? Number(selectedCoin?.decimal)
                                : 8,
                            );
                          setFieldValue('currencyAmount', tempValues);
                          setFieldValue('amount', tempAmount);
                        }}
                        onBlur={handleBlur('currencyAmount')}
                        value={values.currencyAmount}
                        keyboardType={'decimal-pad'}
                      />
                      {errors.currencyAmount && touched.currencyAmount && (
                        <Text style={styles.textConfirm}>
                          {errors.currencyAmount}
                        </Text>
                      )}
                      {!!selectedCoin?.walletAddress && (
                        <View style={styles.addView}>
                          <View style={styles.rowView}>
                            <Text style={styles.selectTitle}>
                              {'Wallet Address'}
                            </Text>
                            <TouchableOpacity
                              onPress={() => {
                                Clipboard.setString(
                                  selectedCoin?.walletAddress,
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
                            {selectedCoin?.walletAddress}
                          </Text>
                        </View>
                      )}
                      {!!selectedCoin?.walletAddress &&
                        values?.amount &&
                        !errors.amount && (
                          <View style={styles.addView}>
                            <View style={styles.rowView}>
                              <Text style={styles.selectTitle}>
                                {'Request Crypto URL'}
                              </Text>
                              <TouchableOpacity
                                onPress={() => {
                                  Clipboard.setString(receivePaymentUrl);
                                  triggerHapticFeedbackLight();
                                  Toast.show({
                                    type: 'successToast',
                                    text1: 'Request crypto url is copied',
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
                              {receivePaymentUrl}
                            </Text>
                          </View>
                        )}
                    </View>
                  </TouchableWithoutFeedback>
                );
              }}
            </Formik>
          </View>
        </ScrollView>
      </Portal>
    </Provider>
  );
};

export default ReceivePaymentUrl;
