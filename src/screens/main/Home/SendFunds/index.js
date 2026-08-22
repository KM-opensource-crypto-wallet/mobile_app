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
  updateCurrentTransferData,
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
  isEip7702SupportedChain,
} from 'dok-wallet-blockchain-networks/helper';
import {getChain} from 'dok-wallet-blockchain-networks/cryptoChain';
import {showToast} from 'utils/toast';
import {setExchangeSuccess} from 'dok-wallet-blockchain-networks/redux/exchange/exchangeSlice';
import AddressBookPicker from 'components/AddressBookPicker';
import {getTransferData} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSelector';
import {isBitcoinChain} from 'dok-wallet-blockchain-networks/helper';
import {parseBoolean} from 'utils/common';
import {addBatchTransaction} from 'dok-wallet-blockchain-networks/redux/batchTransaction/batchTransactionSlice';
import {v4} from 'uuid';
import {
  getCustomRPCWithData,
  selectAllCustomRpc,
} from 'dok-wallet-blockchain-networks/redux/customRpc/customRpcSelectors';
import {getSentAddressHistory} from 'dok-wallet-blockchain-networks/redux/sentAddressHistory/sentAddressHistorySelectors';
import {getAddressBook} from 'dok-wallet-blockchain-networks/redux/addressBook/addressBookSelector';
import {findLookalikeAddress} from 'dok-wallet-blockchain-networks/helper/addressPoisoning';
import {getBolt11InvoiceAmount} from 'dok-wallet-blockchain-networks/helper/bolt11';
import ModalAddressPoisoningWarning from 'components/ModalAddressPoisoningWarning';

const SendFunds = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const currentCoin = useSelector(selectCurrentCoin);
  const qrAddress = route?.params?.qrAddress;
  const qrAmount = route?.params?.qrAmount;
  const linkAddress = route?.params?.address;
  const linkAmount = route?.params?.amount;
  const linkMemo = route?.params?.memo;
  const newDate = route?.params?.newDateToString;
  const fieldDisable = parseBoolean(route?.params?.fieldDisable);
  const redirect_url = route?.params?.redirect_url;
  const meta = route?.params?.meta;
  const localCurrency = useSelector(getLocalCurrency);
  const currentWallet = useSelector(selectCurrentWallet);
  const allCustomRPC = useSelector(selectAllCustomRpc);
  const transferData = useSelector(getTransferData);
  const sentAddressHistory = useSelector(getSentAddressHistory);
  const addressBook = useSelector(getAddressBook);
  const isBitcoin = isBitcoinChain(currentCoin?.chain_name);
  const isLightning = currentCoin?.chain_name === 'bitcoin_lightning';
  const uuid = useMemo(() => {
    return v4();
  }, []);

  const [modal, setModal] = useState(false);
  const [maxAmount, setMaxAmount] = useState('0.00000');
  const [modalVisible, setmodalVisible] = useState(false);
  const [poisonWarning, setPoisonWarning] = useState(null);
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
    const invoiceAmount = isLightning
      ? getBolt11InvoiceAmount(localAddress)
      : null;
    // A fixed-amount invoice must be paid exactly and locks the amount field
    // (see isInvoiceAmountLocked below), so it outranks any amount carried by
    // the QR/deep link — otherwise "lightning:lnbc..?amount=" would prefill an
    // uneditable wrong amount. Variable-amount invoices fall through as before.
    const localAmount = invoiceAmount || qrAmount || linkAmount;
    const localMemo = linkMemo;
    const localCurrencyAmount = localAmount
      ? multiplyBNWithFixed(localAmount, currentCoin?.currencyRate, 2)
      : '';
    if (localAddress) {
      formikRef?.current?.setFieldValue('send', localAddress);
    }
    if (localMemo) {
      formikRef?.current?.setFieldValue('memo', localMemo);
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
        formikRef?.current?.setFieldTouched('memo', true);
      }, 0);
    }
  }, [
    currentCoin?.currencyRate,
    isLightning,
    linkAddress,
    linkAmount,
    linkMemo,
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

  // Validate the recipient: a directly valid address, or (on name-support
  // chains) a resolvable name. Shared by the send and batch flows.
  const validateRecipientAddress = useCallback(
    async sendValue => {
      const customRPC = getCustomRPCWithData(
        allCustomRPC,
        currentCoin?.chain_name,
        currentWallet?.clientId,
      );
      const currentChain = getChain(
        currentCoin?.chain_name,
        currentWallet?.phrase,
        customRPC,
      );
      const isValid = await currentChain.isValidAddress({address: sendValue});
      let validAddress = null;
      if (!isValid && isNameSupportChain(currentCoin?.chain_name)) {
        validAddress = await currentChain?.isValidName({name: sendValue});
      }
      return {isValid, validAddress};
    },
    [
      allCustomRPC,
      currentCoin?.chain_name,
      currentWallet?.clientId,
      currentWallet?.phrase,
    ],
  );

  // Run address-poisoning detection on the resolved recipient. If a lookalike
  // is found, hold the action and show the warning (proceed runs only after the
  // user acknowledges); otherwise proceed immediately. Shared by both flows.
  const checkPoisoningThenProceed = useCallback(
    (resolvedToAddress, proceed) => {
      const lookalikeAddress = findLookalikeAddress({
        inputAddress: resolvedToAddress,
        chain_name: currentCoin?.chain_name,
        sentHistory: sentAddressHistory,
        addressBook,
      });
      if (lookalikeAddress) {
        setPoisonWarning({
          suspiciousAddress: resolvedToAddress,
          matchedAddress: lookalikeAddress,
          onConfirm: proceed,
        });
        return;
      }
      proceed();
    },
    [currentCoin?.chain_name, sentAddressHistory, addressBook],
  );

  const addToBatch = useCallback(async () => {
    const values = formikRef.current.values;
    const {isValid, validAddress} = await validateRecipientAddress(
      values?.send,
    );
    if (isValid || validAddress) {
      const resolvedToAddress = validAddress || values?.send?.trim();
      checkPoisoningThenProceed(resolvedToAddress, () => {
        dispatch(
          addBatchTransaction({
            transactionId: uuid,
            selectedCoin: currentCoin,
            transferData: {
              contractAddress: currentCoin?.contractAddress,
              fromAddress: currentCoin?.address,
              toAddress: values?.send,
              decimals: currentCoin?.decimal,
              amount: validateBigNumberStr(values?.amount),
              fiatAmount: values?.currencyAmount || '0',
            },
            isERC20Token: currentCoin?.type?.toLowerCase() === 'token',
            navigation,
          }),
        );
      });
    } else {
      formikRef?.current?.setFieldError('send', 'address is not valid');
    }
  }, [
    currentCoin,
    dispatch,
    navigation,
    uuid,
    validateRecipientAddress,
    checkPoisoningThenProceed,
  ]);

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
    const {isValid, validAddress} = await validateRecipientAddress(
      values?.send,
    );
    if (isValid || validAddress) {
      const resolvedToAddress = validAddress || values?.send?.trim();
      checkPoisoningThenProceed(resolvedToAddress, () =>
        proceedToTransfer(values, validAddress),
      );
    } else {
      formikRef?.current?.setFieldError('send', 'address is not valid');
    }
  };

  const proceedToTransfer = (values, validAddress) => {
    dispatch(
      // Full reset+merge: drops whatever a previous flow (exchange quote,
      // staking, NFT, batch) left behind in transferData. The UTXO fields are
      // the one thing set before this dispatch (SelectUTXOsScreen) that the
      // fee poll, the max clamp and the send itself still read from the
      // store, so they must be carried through the reset.
      updateCurrentTransferData({
        toAddress: validAddress || values?.send?.trim(),
        currentCoin,
        amount: validateBigNumberStr(values?.amount),
        initialAmount:
          currentCoin?.type !== 'token' && validateBigNumberStr(values?.amount),
        isSendFunds: true,
        validName: validAddress ? values?.send : null,
        memo: values?.memo?.trim(),
        selectedUTXOs: transferData?.selectedUTXOs,
        selectedUTXOsValue: transferData?.selectedUTXOsValue,
      }),
    );
    dispatch(
      calculateEstimateFee({
        isFetchNonce: true,
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
      meta,
    });
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
              memo: linkMemo || '',
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
            }) => {
              // Fixed-amount BOLT11 invoices must be paid exactly, so the
              // amount fields stay locked while such an invoice is entered
              const isInvoiceAmountLocked =
                isLightning && !!getBolt11InvoiceAmount(values.send);
              return (
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
                                textColor={
                                  fieldDisable ? theme.gray : theme.font
                                }
                                theme={{
                                  colors: {
                                    onSurfaceVariant: errors
                                      ? theme.gray
                                      : 'red',
                                  },
                                }}
                                outlineColor={errors.send ? 'red' : theme.gray}
                                activeOutlineColor={
                                  errors.send ? 'red' : theme.font
                                }
                                autoCapitalize="none"
                                returnKeyType="done"
                                mode="outlined"
                                blurOnSubmit={false}
                                name="send"
                                onChangeText={text => {
                                  setFieldValue('send', text);
                                  if (isLightning) {
                                    const invoiceAmount =
                                      getBolt11InvoiceAmount(text);
                                    if (invoiceAmount) {
                                      setFieldValue('amount', invoiceAmount);
                                      setFieldValue(
                                        'currencyAmount',
                                        multiplyBNWithFixed(
                                          invoiceAmount,
                                          currentCoin?.currencyRate,
                                          2,
                                        ),
                                      );
                                    } else if (
                                      getBolt11InvoiceAmount(values.send)
                                    ) {
                                      // The previous recipient was a
                                      // fixed-amount invoice; its amount no
                                      // longer applies to this recipient.
                                      setFieldValue('amount', '');
                                      setFieldValue('currencyAmount', '');
                                    }
                                  }
                                }}
                                onBlur={handleBlur('send')}
                                value={values.send}
                                onSubmitEditing={() => {
                                  Keyboard.dismiss();
                                }}
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
                                editable={
                                  !fieldDisable && !isInvoiceAmountLocked
                                }
                                label="Enter amount of Crypto to send"
                                textColor={
                                  fieldDisable || isInvoiceAmountLocked
                                    ? theme.gray
                                    : theme.font
                                }
                                theme={{
                                  colors: {
                                    onSurfaceVariant: errors
                                      ? theme.gray
                                      : 'red',
                                  },
                                }}
                                outlineColor={
                                  errors.amount ? 'red' : theme.gray
                                }
                                activeOutlineColor={
                                  errors.amount ? 'red' : theme.font
                                }
                                autoCapitalize="none"
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
                              {!fieldDisable && !isInvoiceAmountLocked && (
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
                            <Text style={styles.listTitle}>
                              Currency Amount
                            </Text>
                            <View style={styles.inputView}>
                              <TextInput
                                style={styles.input}
                                editable={
                                  !fieldDisable && !isInvoiceAmountLocked
                                }
                                label={`Enter ${localCurrency} amount of Crypto to send`}
                                textColor={
                                  fieldDisable || isInvoiceAmountLocked
                                    ? theme.gray
                                    : theme.font
                                }
                                theme={{
                                  colors: {
                                    // The schema only validates `amount`;
                                    // both inputs are views of the same value.
                                    onSurfaceVariant: errors.amount
                                      ? 'red'
                                      : theme.gray,
                                  },
                                }}
                                outlineColor={
                                  errors.amount ? 'red' : theme.gray
                                }
                                activeOutlineColor={
                                  errors.amount ? 'red' : theme.font
                                }
                                autoCapitalize="none"
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
                              {!fieldDisable && !isInvoiceAmountLocked && (
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
                                textColor={
                                  fieldDisable ? theme.gray : theme.font
                                }
                                theme={{
                                  colors: {
                                    onSurfaceVariant: errors
                                      ? theme.gray
                                      : 'red',
                                  },
                                }}
                                outlineColor={errors.memo ? 'red' : theme.gray}
                                activeOutlineColor={
                                  errors.memo ? 'red' : theme.font
                                }
                                autoCapitalize="none"
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
                                  !fieldDisable && (
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
                                  )
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
                      {isEip7702SupportedChain(currentCoin?.chain_name) && (
                        <TouchableOpacity
                          disabled={!isValid}
                          style={{
                            ...styles.button,
                            backgroundColor: isValid
                              ? 'transparent'
                              : theme.gray,
                            borderColor: isValid
                              ? theme.background
                              : theme.gray,
                            borderWidth: 1,
                          }}
                          onPress={addToBatch}>
                          <Text
                            style={[
                              styles.buttonTitle,
                              isValid && {color: theme.background},
                            ]}>
                            Add to batch
                          </Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        disabled={!isValid}
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
              );
            }}
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
        <ModalAddressPoisoningWarning
          visible={!!poisonWarning}
          suspiciousAddress={poisonWarning?.suspiciousAddress}
          matchedAddress={poisonWarning?.matchedAddress}
          onCancel={() => setPoisonWarning(null)}
          onContinue={() => {
            const pending = poisonWarning;
            setPoisonWarning(null);
            pending?.onConfirm?.();
          }}
        />
      </Portal>
    </Provider>
  );
};

export default SendFunds;
