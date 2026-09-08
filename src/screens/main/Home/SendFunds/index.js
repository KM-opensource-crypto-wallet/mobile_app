import React, {useContext, useEffect, useMemo, useState} from 'react';
import {
  Keyboard,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {Portal, Provider} from 'react-native-paper';
import {useFormik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';
import BigNumber from 'bignumber.js';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {v4} from 'uuid';
import myStyles from './SendFundsStyles';
import ModalSend from 'components/ModalSend';
import {ModalQR} from 'components/ModalQR';
import ModalAddressPoisoningWarning from 'components/ModalAddressPoisoningWarning';
import SendFundsForm from 'components/SendFundsForm';
import useSendFundsForm from 'hooks/useSendFundsForm';
import useSendFormPrefill from 'hooks/useSendFormPrefill';
import isJson from 'dok-wallet-blockchain-networks/service/isJson';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {IS_ANDROID, useFloatingHeight} from 'utils/dimensions';
import {ThemeContext} from 'theme/ThemeContext';
import {
  calculateEstimateFee,
  updateCurrentTransferData,
} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSlice';
import {getTransferData} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSelector';
import {
  selectCurrentCoin,
  selectCurrentWallet,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {
  isEip7702SupportedChain,
  multiplyBNWithFixed,
  validateBigNumberStr,
} from 'dok-wallet-blockchain-networks/helper';
import {setExchangeSuccess} from 'dok-wallet-blockchain-networks/redux/exchange/exchangeSlice';
import {parseBoolean} from 'utils/common';
import {addBatchTransaction} from 'dok-wallet-blockchain-networks/redux/batchTransaction/batchTransactionSlice';

// Legacy QR payload: a JSON object carrying the address. Anything else that
// is present but not JSON yields '' (nothing to prefill, ModalQR stays empty).
const getAddressFromQrData = data =>
  data ? (isJson(data) ? JSON.parse(data).address : '') : data;

const SendFunds = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();
  const currentCoin = useSelector(selectCurrentCoin);
  const currentWallet = useSelector(selectCurrentWallet);
  const localCurrency = useSelector(getLocalCurrency);
  const transferData = useSelector(getTransferData);
  const floatingHeight = useFloatingHeight();

  const {
    qrAddress,
    qrAmount,
    address: linkAddress,
    amount: linkAmount,
    memo: linkMemo,
    newDateToString: newDate,
    redirect_url,
    meta,
    data: qrData,
  } = route?.params || {};
  const fieldDisable = parseBoolean(route?.params?.fieldDisable);
  const qrDataAddress = useMemo(() => getAddressFromQrData(qrData), [qrData]);
  const uuid = useMemo(() => v4(), []);

  const [modal, setModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const form = useSendFundsForm({coin: currentCoin, wallet: currentWallet});
  const {availableAmount} = form;

  const proceedToTransfer = (values, validAddress) => {
    const toAddress = validAddress || values?.toAddress?.trim();
    const amount = validateBigNumberStr(values?.amount);
    const memo = values?.memo?.trim();
    dispatch(
      // Full reset+merge: drops whatever a previous flow (exchange quote,
      // staking, NFT, batch) left behind in transferData. The UTXO fields are
      // the one thing set before this dispatch (SelectUTXOsScreen) that the
      // fee poll, the max clamp and the send itself still read from the
      // store, so they must be carried through the reset.
      updateCurrentTransferData({
        toAddress,
        currentCoin,
        amount,
        initialAmount: currentCoin?.type !== 'token' && amount,
        isSendFunds: true,
        validName: validAddress ? values?.toAddress : null,
        memo,
        selectedUTXOs: transferData?.selectedUTXOs,
        selectedUTXOsValue: transferData?.selectedUTXOsValue,
      }),
    );
    dispatch(
      calculateEstimateFee({
        isFetchNonce: true,
        fromAddress: currentCoin?.address,
        toAddress,
        amount,
        contractAddress: currentCoin?.contractAddress,
        balance: availableAmount,
        memo,
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

  const formik = useFormik({
    initialValues: {
      toAddress: qrAddress || linkAddress || '',
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
    },
    validationSchema: form.validationSchema,
    onSubmit: async (values, helpers) => {
      if (form.applyChainRules(values, helpers)) {
        return;
      }
      if (new BigNumber(values.amount).gt(availableAmount)) {
        setModal(true);
        return;
      }
      const {validAddress, resolvedAddress} = await form.resolveRecipient(
        values.toAddress,
      );
      if (!resolvedAddress) {
        helpers.setFieldError('toAddress', 'address is not valid');
        return;
      }
      form.checkPoisoningThenProceed(resolvedAddress, () =>
        proceedToTransfer(values, validAddress),
      );
    },
  });

  useSendFormPrefill(
    formik,
    {
      address: qrAddress || linkAddress || qrDataAddress,
      amount: qrAmount || linkAmount,
      memo: linkMemo,
      refreshKey: newDate,
    },
    {isLightning: form.isLightning, currencyRate: currentCoin?.currencyRate},
  );

  useEffect(() => {
    setModalVisible(route.params?.showModal || false);
  }, [route]);

  const addToBatch = async () => {
    const values = formik.values;
    const {resolvedAddress} = await form.resolveRecipient(values.toAddress);
    if (!resolvedAddress) {
      // Bypasses handleSubmit, so the field must be touched for the error
      // to show.
      formik.setFieldTouched('toAddress', true, false);
      formik.setFieldError('toAddress', 'address is not valid');
      return;
    }
    form.checkPoisoningThenProceed(resolvedAddress, () => {
      dispatch(
        addBatchTransaction({
          transactionId: uuid,
          selectedCoin: currentCoin,
          transferData: {
            contractAddress: currentCoin?.contractAddress,
            fromAddress: currentCoin?.address,
            toAddress: resolvedAddress,
            decimals: currentCoin?.decimal,
            amount: validateBigNumberStr(values?.amount),
            fiatAmount: values?.currencyAmount || '0',
          },
          isERC20Token: currentCoin?.type?.toLowerCase() === 'token',
          navigation,
        }),
      );
    });
  };

  const {isValid} = formik;

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
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{flex: 1}}>
              <View
                style={{
                  ...styles.container,
                  paddingVertical: floatingHeight > 400 ? 40 : 10,
                }}>
                <View style={styles.formInput}>
                  <SendFundsForm
                    formik={formik}
                    form={form}
                    coin={currentCoin}
                    wallet={currentWallet}
                    localCurrency={localCurrency}
                    navigation={navigation}
                    scannerPage="SendFunds"
                    fieldDisable={fieldDisable}
                  />
                </View>
                {isEip7702SupportedChain(currentCoin?.chain_name) && (
                  <TouchableOpacity
                    disabled={!isValid}
                    style={{
                      ...styles.button,
                      backgroundColor: isValid ? 'transparent' : theme.gray,
                      borderColor: isValid ? theme.background : theme.gray,
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
                    backgroundColor: isValid ? theme.background : theme.gray,
                  }}
                  onPress={formik.handleSubmit}>
                  <Text style={styles.buttonTitle}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAwareScrollView>

        <ModalSend
          visible={modal}
          hideModal={setModal}
          navigation={navigation}
        />
        <ModalQR
          visible={modalVisible}
          hideModal={setModalVisible}
          data={qrDataAddress}
        />
        <ModalAddressPoisoningWarning
          visible={!!form.poisonWarning}
          suspiciousAddress={form.poisonWarning?.suspiciousAddress}
          matchedAddress={form.poisonWarning?.matchedAddress}
          onCancel={form.cancelPoisonWarning}
          onContinue={form.confirmPoisonWarning}
        />
      </Portal>
    </Provider>
  );
};

export default SendFunds;
