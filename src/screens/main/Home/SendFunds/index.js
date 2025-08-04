import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
  useMemo,
} from 'react';
import myStyles from './SendFundsStyles';
import {
  TouchableOpacity,
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {TextInput} from 'react-native-paper';
import {Formik} from 'formik';
import ModalSend from 'components/ModalSend';
import {useSelector, useDispatch} from 'react-redux';
import {ModalQR} from 'components/ModalQR';
import isJson from 'dok-wallet-blockchain-networks/service/isJson';
import {Portal, Provider} from 'react-native-paper';
import {validationSchemaSendFunds} from 'utils/validationSchema';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {IS_ANDROID, useFloatingHeight} from 'utils/dimensions';
import {ThemeContext} from 'theme/ThemeContext';
import {
  calculateEstimateFee,
  setCurrentTransferData,
} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSlice';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {currencySymbol} from 'data/currency';
import {
  selectCurrentCoin,
  selectCurrentWallet,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import BigNumber from 'bignumber.js';
import {
  isNameSupportChain,
  isMemoSupportChain,
  multiplyBNWithFixed,
  validateBigNumberStr,
  validateNumberInInput,
  validateNumber,
} from 'dok-wallet-blockchain-networks/helper';
import {getChain} from 'dok-wallet-blockchain-networks/cryptoChain';
import {showToast} from 'utils/toast';
import {setExchangeSuccess} from 'dok-wallet-blockchain-networks/redux/exchange/exchangeSlice';
import AddressBookPicker from 'components/AddressBookPicker';
import {getTransferData} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSelector';
import {isBitcoinChain} from 'dok-wallet-blockchain-networks/helper';
import {parseBoolean} from 'utils/common';

const SendFunds = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const currentCoin = useSelector(selectCurrentCoin);
  const qrAddress = route?.params?.qrAddress;
  const qrAmount = route?.params?.qrAmount;
  const linkAddress = route?.params?.address;
  const linkAmount = route?.params?.amount;
  const newDate = route?.params?.newDateToString;
  const fieldDisable = parseBoolean(route?.params?.fieldDisable);
  const redirect_url = route?.params?.redirect_url;
  const localCurrency = useSelector(getLocalCurrency);
  const currentWallet = useSelector(selectCurrentWallet);
  const transferData = useSelector(getTransferData);
  const isBitcoin = isBitcoinChain(currentCoin?.chain_name);

  const [modal, setModal] = useState(false);
  const [maxAmount, setMaxAmount] = useState('0.00000');
  const [modalVisible, setmodalVisible] = useState(false);
  const availableAmount = useMemo(() => {
    const amount =
      (isBitcoin && transferData?.selectedUTXOsValue) ||
      currentCoin?.totalAmount ||
      '0';
    const minBalance = currentCoin?.minimumBalance || '0';
    const localAvailableAmount = new BigNumber(amount).minus(
      new BigNumber(minBalance),
    );
    const zeroAmount = new BigNumber(0);
    return localAvailableAmount.gt(zeroAmount)
      ? localAvailableAmount.toString()
      : zeroAmount?.toString();
  }, [
    isBitcoin,
    currentCoin?.minimumBalance,
    currentCoin?.totalAmount,
    transferData?.selectedUTXOsValue,
  ]);
  const availableAmountCurrency = useMemo(() => {
    return multiplyBNWithFixed(availableAmount, currentCoin?.currencyRate, 2);
  }, [availableAmount, currentCoin?.currencyRate]);
  const isMemoSupported = useMemo(() => {
    return isMemoSupportChain(currentCoin?.chain_name);
  }, [currentCoin?.chain_name]);

  const floatingHeight = useFloatingHeight();
  const dispatch = useDispatch();
  const formikRef = useRef(null);

  // useEffect(() => {
  //   setUserCoins(coins);
  // }, [coins]);

  useEffect(() => {
    const localAddress = qrAddress || linkAddress;
    const localAmount = qrAmount || linkAmount;
    const localCurrencyAmount = localAmount
      ? multiplyBNWithFixed(localAmount, currentCoin?.currencyRate, 2)
      : '';
    if (localAddress) {
      formikRef?.current?.setFieldValue('send', localAddress);
    }
    if (localAmount) {
      formikRef?.current?.setFieldValue('amount', localAmount);
    }
    if (localCurrencyAmount) {
      formikRef?.current?.setFieldValue('currencyAmount', localCurrencyAmount);
    }
    if (localAddress || localAmount || localCurrencyAmount) {
      setTimeout(() => {
        formikRef?.current?.setFieldTouched('send', true);
        formikRef?.current?.setFieldTouched('amount', true);
        formikRef?.current?.setFieldTouched('currencyAmount', true);
      }, 0);
    }
  }, [
    currentCoin?.currencyRate,
    linkAddress,
    linkAmount,
    newDate,
    qrAddress,
    qrAmount,
  ]);

  useEffect(() => {
    if (new BigNumber(availableAmount).gt(new BigNumber(0))) {
      setMaxAmount(availableAmount);
    }
  }, [availableAmount]);

  useEffect(() => {
    setmodalVisible(route.params?.showModal || false);
  }, [route]);

  const isDataCorrect = useCallback(() => {
    return route?.params?.data
      ? isJson(route?.params?.data)
        ? JSON.parse(route?.params?.data).address
        : ''
      : route?.params?.data;
  }, [route]);

  useEffect(() => {
    const correctData = isDataCorrect();
    if (correctData) {
      formikRef?.current?.setFieldValue('send', correctData);
    }
  }, [route?.params?.data, isDataCorrect]);

  useEffect(() => {
    if (route?.params?.memo) {
      formikRef?.current?.setFieldValue('memo', route?.params?.memo);
    }
  }, [route?.params?.memo]);

  const handleSubmitForm = async values => {
    if (
      currentCoin?.chain_name === 'polkadot' ||
      currentCoin.chain_name === 'cardano'
    ) {
      const availableAmountBN = new BigNumber(availableAmount);
      const amount = new BigNumber(values.amount);
      if (
        currentCoin.chain_name === 'polkadot' &&
        availableAmountBN.minus(amount).lt(new BigNumber(1.1)) &&
        !availableAmountBN.eq(amount)
      ) {
        showToast({
          type: 'errorToast',
          title: 'Polkadot warning',
          message: 'Required minimum 1 DOT or send total amount',
        });
        return;
      }
      if (currentCoin.chain_name === 'cardano') {
        if (amount.lt(new BigNumber(1))) {
          formikRef?.current?.setFieldError(
            'amount',
            'minimum 1 ADA is required for transaction',
          );
          return;
        }
        if (
          !amount.eq(availableAmountBN) &&
          availableAmountBN.minus(amount).lt(new BigNumber(1))
        ) {
          formikRef?.current?.setFieldError(
            'amount',
            'Remaining balance is less than 1 ADA, please send max amount',
          );
          return;
        }
      }
    }
    if (
      currentCoin?.chain_name === 'ripple' &&
      values?.memo &&
      !validateNumber(values?.memo)
    ) {
      showToast({
        type: 'errorToast',
        title: 'Invalid MEMO or TAG',
        message: 'MEMO or TAG must be number',
      });
      return;
    }
    if (new BigNumber(values.amount).gt(availableAmount)) {
      setModal(true);
      return;
    }
    const currentChain = getChain(currentCoin?.chain_name);
    const isValid = await currentChain.isValidAddress({address: values?.send});
    let validAddress = null;
    if (!isValid && isNameSupportChain(currentCoin?.chain_name)) {
      validAddress = await currentChain?.isValidName({name: values?.send});
    }

    if (isValid || validAddress) {
      dispatch(
        setCurrentTransferData({
          toAddress: validAddress || values?.send?.trim(),
          currentCoin,
          amount: validateBigNumberStr(values?.amount),
          initialAmount:
            currentCoin?.type !== 'token' &&
            validateBigNumberStr(values?.amount),
          isSendFunds: true,
          validName: validAddress ? values?.send : null,
          memo: values?.memo?.trim(),
        }),
      );
      dispatch(
        calculateEstimateFee({
          fromAddress: currentCoin?.address,
          toAddress: validAddress || values?.send,
          amount: validateBigNumberStr(values?.amount),
          contractAddress: currentCoin?.contractAddress,
          balance: availableAmount,
          memo: values?.memo?.trim(),
          selectedUTXOs: transferData?.selectedUTXOs,
        }),
      );
      dispatch(setExchangeSuccess(false));
      navigation.navigate('Transfer', {
        fromScreen: 'SendFunds',
        redirect_url,
      });
    } else {
      formikRef?.current?.setFieldError('send', 'address is not valid');
    }
  };

  const onSelectAddress = useCallback(item => {
    const address = item?.address;
    if (address) {
      formikRef?.current?.setFieldValue('send', address);
    }
  }, []);

  return (
    <Provider>
      <Portal>
        <KeyboardAwareScrollView
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          bounces={false}
          keyboardShouldPersistTaps={'always'}
          {...(IS_ANDROID ? {extraScrollHeight: 30} : {})}
          keyboardOpeningTime={Number.MAX_SAFE_INTEGER}
          contentContainerStyle={styles.contentContainerStyle}>
          <Formik
            innerRef={formikRef}
            initialValues={{
              send: qrAddress || linkAddress || '',
              amount: qrAmount || linkAmount || '',
              currencyAmount:
                qrAmount || linkAmount
                  ? multiplyBNWithFixed(
                      qrAmount || linkAmount,
                      currentCoin?.currencyRate,
                      2,
                    )
                  : '',
              memo: '',
            }}
            validationSchema={validationSchemaSendFunds(
              availableAmount,
              availableAmountCurrency,
            )}
            onSubmit={handleSubmitForm}>
            {({
              handleBlur,
              handleSubmit,
              values,
              errors,
              isValid,
              setFieldValue,
            }) => (
              <TouchableWithoutFeedback
                onPress={() => {
                  Keyboard.dismiss();
                }}>
                <View style={{flex: 1}}>
                  <View
                    style={{
                      ...styles.container,
                      paddingVertical: floatingHeight > 400 ? 40 : 10,
                    }}>
                    <View style={styles.formInput}>
                      <Text style={styles.title}>
                        Amount available for send
                      </Text>
                      <View style={styles.box}>
                        <Text style={styles.boxTitle}>{availableAmount}</Text>
                        <Text style={styles.boxTitle}>
                          {' ' + currentCoin?.symbol}
                        </Text>
                      </View>
                      <View style={styles.box}>
                        <Text style={styles.boxBalance}>
                          {currencySymbol[localCurrency] || ''}
                          {availableAmountCurrency}
                        </Text>
                      </View>
                      <View
                        style={{
                          flex: 1,
                        }}>
                        <View style={styles.boxInput}>
                          <Text style={styles.listTitle}>Send to</Text>
                          <View style={styles.rowView}>
                            <TextInput
                              style={[
                                styles.addressInput,
                                fieldDisable && {width: '100%'},
                              ]}
                              editable={!fieldDisable}
                              label="Enter wallet adress or scan QR"
                              textColor={fieldDisable ? theme.gray : theme.font}
                              theme={{
                                colors: {
                                  onSurfaceVariant: errors ? theme.gray : 'red',
                                },
                              }}
                              outlineColor={errors.send ? 'red' : theme.gray}
                              activeOutlineColor={
                                errors.send ? 'red' : theme.font
                              }
                              autoCapitalize="none"
                              returnKeyType="next"
                              mode="outlined"
                              blurOnSubmit={false}
                              name="send"
                              onChangeText={text => {
                                setFieldValue('send', text);
                              }}
                              onBlur={handleBlur('send')}
                              value={values.send}
                              onSubmitEditing={handleSubmit}
                              right={
                                !fieldDisable && (
                                  <TextInput.Icon
                                    style={styles.scan}
                                    icon="qrcode-scan"
                                    iconColor={theme.backgroundColor}
                                    size={15}
                                    onPress={() => {
                                      navigation.navigate('Scanner', {
                                        page: 'SendFunds',
                                      });
                                    }}
                                  />
                                )
                              }
                            />
                            {!fieldDisable && (
                              <AddressBookPicker
                                chain_name={currentCoin?.chain_name}
                                walletId={currentWallet?.clientId}
                                onSelectAddress={onSelectAddress}
                              />
                            )}
                          </View>
                          {errors.send && (
                            <Text style={styles.textConfirm}>
                              {errors.send}
                            </Text>
                          )}
                        </View>
                        <View style={styles.boxInput}>
                          <Text style={styles.listTitle}>Amount</Text>
                          <View style={styles.inputView}>
                            <TextInput
                              style={styles.input}
                              editable={!fieldDisable}
                              label="Enter amount of Crypto to send"
                              textColor={fieldDisable ? theme.gray : theme.font}
                              theme={{
                                colors: {
                                  onSurfaceVariant: errors ? theme.gray : 'red',
                                },
                              }}
                              outlineColor={errors.amount ? 'red' : theme.gray}
                              activeOutlineColor={
                                errors.amount ? 'red' : theme.font
                              }
                              autoCapitalize="none"
                              returnKeyType="next"
                              mode="outlined"
                              blurOnSubmit={false}
                              name="amount"
                              onChangeText={text => {
                                const tempValues = validateNumberInInput(
                                  text,
                                  currentCoin?.decimal,
                                );
                                const tempAmount = multiplyBNWithFixed(
                                  tempValues,
                                  currentCoin?.currencyRate,
                                  2,
                                );
                                setFieldValue('currencyAmount', tempAmount);
                                setFieldValue('amount', tempValues);
                              }}
                              onBlur={handleBlur('amount')}
                              value={values.amount}
                              onSubmitEditing={handleSubmit}
                              keyboardType="decimal-pad"
                              type="number"
                            />
                            {!fieldDisable && (
                              <TouchableOpacity
                                style={styles.btnMax}
                                hitSlop={{
                                  top: 12,
                                  left: 12,
                                  right: 12,
                                  bottom: 12,
                                }}
                                onPress={() => {
                                  setFieldValue(
                                    'currencyAmount',
                                    availableAmountCurrency,
                                  );
                                  setFieldValue('amount', maxAmount + '');
                                }}>
                                <Text style={styles.btnText}>Max</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          {errors.amount && (
                            <Text style={styles.textConfirm}>
                              {errors.amount}
                            </Text>
                          )}
                        </View>
                        <View style={styles.boxInput}>
                          <Text style={styles.listTitle}>Currency Amount</Text>
                          <View style={styles.inputView}>
                            <TextInput
                              style={styles.input}
                              editable={!fieldDisable}
                              label={`Enter ${localCurrency} amount of Crypto to send`}
                              textColor={fieldDisable ? theme.gray : theme.font}
                              theme={{
                                colors: {
                                  onSurfaceVariant: !errors?.currencyAmount
                                    ? theme.gray
                                    : 'red',
                                },
                              }}
                              outlineColor={errors.amount ? 'red' : theme.gray}
                              activeOutlineColor={
                                errors.amount ? 'red' : theme.font
                              }
                              autoCapitalize="none"
                              returnKeyType="next"
                              mode="outlined"
                              blurOnSubmit={false}
                              name="currencyAmount"
                              onChangeText={text => {
                                const tempValues = validateNumberInInput(
                                  text,
                                  2,
                                );
                                const tempAmount = new BigNumber(tempValues)
                                  .dividedBy(
                                    new BigNumber(currentCoin?.currencyRate),
                                  )
                                  .toFixed(Number(currentCoin?.decimal));
                                setFieldValue('currencyAmount', tempValues);
                                setFieldValue('amount', tempAmount);
                              }}
                              onBlur={handleBlur('currencyAmount')}
                              value={values.currencyAmount}
                              onSubmitEditing={handleSubmit}
                              keyboardType="decimal-pad"
                              type="number"
                            />
                            {!fieldDisable && (
                              <TouchableOpacity
                                style={styles.btnMax}
                                hitSlop={{
                                  top: 12,
                                  left: 12,
                                  right: 12,
                                  bottom: 12,
                                }}
                                onPress={() => {
                                  setFieldValue(
                                    'currencyAmount',
                                    availableAmountCurrency,
                                  );
                                  setFieldValue('amount', maxAmount + '');
                                }}>
                                <Text style={styles.btnText}>Max</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          {errors.amount && (
                            <Text style={styles.textConfirm}>
                              {errors.amount}
                            </Text>
                          )}
                        </View>
                        {isMemoSupported && (
                          <View style={styles.boxInput}>
                            <Text style={styles.listTitle}>Memo:</Text>
                            <TextInput
                              style={styles.input}
                              editable={!fieldDisable}
                              label="Enter Memo or Scan QR"
                              textColor={fieldDisable ? theme.gray : theme.font}
                              theme={{
                                colors: {
                                  onSurfaceVariant: errors ? theme.gray : 'red',
                                },
                              }}
                              outlineColor={errors.memo ? 'red' : theme.gray}
                              activeOutlineColor={
                                errors.memo ? 'red' : theme.font
                              }
                              autoCapitalize="none"
                              returnKeyType="next"
                              mode="outlined"
                              blurOnSubmit={false}
                              name="memo"
                              onChangeText={text => {
                                setFieldValue('memo', text);
                              }}
                              onBlur={handleBlur('memo')}
                              value={values.memo}
                              onSubmitEditing={handleSubmit}
                              right={
                                <TextInput.Icon
                                  style={styles.scan}
                                  icon="qrcode-scan"
                                  iconColor={theme.backgroundColor}
                                  size={15}
                                  onPress={() => {
                                    navigation.navigate('Scanner', {
                                      page: 'SendFundsMemo',
                                    });
                                  }}
                                />
                              }
                            />
                            <Text style={styles.infoText}>
                              {
                                'Memo or Tag is optional, It is only required when recipient needed.'
                              }
                            </Text>
                            {errors.memo && (
                              <Text style={styles.textConfirm}>
                                {errors.memo}
                              </Text>
                            )}
                          </View>
                        )}

                        {/*<View style={styles.blockList}>*/}
                        {/*  <Text style={styles.blockTitle}>Blockchain fee</Text>*/}
                        {/*  <View style={{direction: 'rtl'}}>*/}
                        {/*    <View style={styles.box}>*/}
                        {/*      <Text style={styles.boxText}>*/}
                        {/*        {currentCoin.totalAmount}*/}
                        {/*      </Text>*/}
                        {/*      <Text style={{...styles.boxText, marginLeft: 5}}>*/}
                        {/*        {currentCoin.title}*/}
                        {/*      </Text>*/}
                        {/*    </View>*/}
                        {/*    <View style={{...styles.box, alignSelf: 'flex-end'}}>*/}
                        {/*      <Text style={styles.boxText}>*/}
                        {/*        {currencySymbol}*/}
                        {/*        {currentCoin.totalCourse}*/}
                        {/*      </Text>*/}
                        {/*    </View>*/}
                        {/*  </View>*/}
                        {/*</View>*/}
                        {/*<View style={styles.switchList}>*/}
                        {/*  <Switch*/}
                        {/*    value={isSwitchOn}*/}
                        {/*    onValueChange={onToggleSwitch}*/}
                        {/*    trackColor={{false: 'gray', true: '#E8E8E8'}}*/}
                        {/*    thumbColor={isSwitchOn ? '#F44D03' : 'white'}*/}
                        {/*    ios_backgroundColor="#E8E8E8"*/}
                        {/*  />*/}
                        {/*  <Text style={styles.switchText}>*/}
                        {/*    Fast Transaction*/}
                        {/*  </Text>*/}
                        {/*</View>*/}
                      </View>
                    </View>
                    <TouchableOpacity
                      // disabled={!isValid}
                      style={{
                        ...styles.button,
                        backgroundColor: isValid
                          ? theme.background
                          : theme.gray,
                      }}
                      onPress={handleSubmit}>
                      <Text style={styles.buttonTitle}>Next</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            )}
          </Formik>
        </KeyboardAwareScrollView>

        <ModalSend
          visible={modal}
          hideModal={setModal}
          navigation={navigation}
        />
        <ModalQR
          visible={modalVisible}
          hideModal={setmodalVisible}
          data={isDataCorrect()}
        />
      </Portal>
    </Provider>
  );
};

export default SendFunds;
