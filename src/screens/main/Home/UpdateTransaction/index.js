import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import myStyles from './UpdateTransactionStyles';
import {useSelector, useDispatch} from 'react-redux';

import {ThemeContext} from 'theme/ThemeContext';
import {selectCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';

import {updateTransactionValidation} from 'utils/validationSchema';
import {TextInput} from 'react-native-paper';
import {Formik} from 'formik';
import Exclamationcircleo from 'assets/images/icons/exclamationcircle.svg';
import {getUpdateTransactionData} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSelector';
import {
  fetchTransactionData,
  resetUpdateTransactionData,
} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSlice';
import {
  getCustomizePublicAddress,
  isCustomAddressNotSupportedChain,
} from 'dok-wallet-blockchain-networks/helper';
import Loading from 'components/Loading';
import ModalConfirmTransaction from 'components/ModalConfirmTransaction';
import {sendPendingTransactions} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {useNavigation} from '@react-navigation/native';
import Spinner from 'components/Spinner';
import {DokSafeAreaView} from 'components/DokSafeAreaView';

const UpdateTransaction = () => {
  const currentCoin = useSelector(selectCurrentCoin);
  const transactionData = useSelector(getUpdateTransactionData);
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();
  const isLoading = transactionData?.isLoading;
  const isSubmitting = transactionData?.isSubmitting;
  const success = transactionData?.success;
  const [showModal, setShowModal] = useState(false);
  const navigation = useNavigation();
  const isCancelTransactionRef = useRef(false);

  useEffect(() => {
    return () => {
      dispatch(resetUpdateTransactionData());
    };
  }, [dispatch]);

  const onSubmit = useCallback(
    values => {
      Keyboard.dismiss();
      dispatch(fetchTransactionData({txHash: values?.tx}));
    },
    [dispatch],
  );

  const onSuccess = useCallback(() => {
    setShowModal(false);
    Keyboard.dismiss();
    const tx = transactionData?.transactionData;
    dispatch(
      sendPendingTransactions({
        from: tx?.extraPendingTransactionData?.from,
        to: tx?.extraPendingTransactionData?.to,
        value: tx?.extraPendingTransactionData?.value,
        data: tx?.extraPendingTransactionData?.data,
        nonce: tx?.extraPendingTransactionData?.nonce,
        pendingTxHash: tx?.extraPendingTransactionData?.txHash,
        isCancelTransaction: isCancelTransactionRef.current,
        navigation: navigation,
        isFromUpdateScreen: true,
      }),
    );
  }, [dispatch, navigation, transactionData?.transactionData]);

  const onPressCancelTransaction = useCallback(() => {
    Keyboard.dismiss();
    isCancelTransactionRef.current = true;
    setShowModal(true);
  }, []);

  const onPressSpeedupTransaction = useCallback(() => {
    Keyboard.dismiss();
    isCancelTransactionRef.current = false;
    setShowModal(true);
  }, []);

  const renderBox = () => {
    const tx = transactionData?.transactionData;
    if (!tx) {
      return null;
    }
    const contractDetails = tx?.contractDetails;
    return (
      <View style={styles.formInput}>
        <View style={styles.box}>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Chain'}</Text>
            <Text style={styles.boxBalance}>
              {currentCoin?.chain_display_name}
            </Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Amount'}</Text>
            <Text style={styles.boxBalance}>{`${tx?.amount} ${
              contractDetails?.symbol || currentCoin?.symbol
            }`}</Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Asset'}</Text>
            <Text style={styles.boxBalance}>{`${
              contractDetails?.name || currentCoin?.name
            } (${contractDetails?.symbol || currentCoin?.symbol})`}</Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'From'}</Text>
            <Text style={styles.boxBalance}>{`${
              isCustomAddressNotSupportedChain(currentCoin?.chain_name)
                ? tx.from
                : getCustomizePublicAddress(tx?.from)
            }`}</Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'To'}</Text>
            <Text style={styles.boxBalance}>{`${
              isCustomAddressNotSupportedChain(currentCoin?.chain_name)
                ? tx?.to
                : getCustomizePublicAddress(tx?.to)
            }`}</Text>
          </View>
        </View>
        <View style={styles.box}>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Estimate Network Fee'}</Text>
            <Text style={styles.boxBalance}>
              {`${transactionData.transactionFee} ${currentCoin?.chain_symbol}`}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (!currentCoin) {
    return null;
  }

  return (
    <DokSafeAreaView style={styles.container}>
      {isSubmitting && <Spinner />}
      <ScrollView
        contentContainerStyle={styles.containerContainerStyle}
        keyboardShouldPersistTaps={'always'}>
        <TouchableWithoutFeedback
          style={styles.container}
          onPress={() => {
            Keyboard.dismiss();
          }}>
          <View style={styles.container}>
            <Formik
              initialValues={{
                tx: '',
              }}
              validationSchema={updateTransactionValidation}
              onSubmit={onSubmit}>
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
                isValid,
              }) => {
                const isDisabledButton = !isValid || !values.tx || isLoading;

                return (
                  <TouchableWithoutFeedback
                    style={styles.container}
                    onPress={() => Keyboard.dismiss()}>
                    <View>
                      <View style={styles.infoView}>
                        <Exclamationcircleo
                          height="20"
                          width="20"
                          fill={'red'}
                        />
                        <Text style={styles.info}>
                          {`Please ensure that the transaction belongs to the ${currentCoin?.chain_display_name} chain and its status is pending.`}
                        </Text>
                      </View>
                      <TextInput
                        style={styles.input}
                        label="Tx Hash"
                        numberOfLines={1}
                        textColor={theme.font}
                        placeholder={'Enter tx hash'}
                        theme={{
                          colors: {
                            onSurfaceVariant: '#989898',
                            primary: errors.fullname ? 'red' : '#989898',
                          },
                        }}
                        outlineColor={
                          touched.fullname && errors.fullname
                            ? 'red'
                            : '#989898'
                        }
                        activeOutlineColor={
                          touched.fullname && errors.fullname
                            ? 'red'
                            : theme.borderActiveColor
                        }
                        autoCapitalize="none"
                        returnKeyType="next"
                        mode="outlined"
                        blurOnSubmit={false}
                        name="tx"
                        onChangeText={handleChange('tx')}
                        onBlur={handleBlur('tx')}
                        value={values.tx}
                      />
                      {errors.tx && touched.tx && (
                        <Text style={styles.textConfirm}>{errors.tx}</Text>
                      )}

                      <TouchableOpacity
                        disabled={isDisabledButton}
                        style={[
                          styles.button,
                          isDisabledButton && {backgroundColor: theme.gray},
                        ]}
                        onPress={handleSubmit}>
                        <Text style={styles.buttonTitle}>
                          {'Fetch transaction'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableWithoutFeedback>
                );
              }}
            </Formik>
            {isLoading ? <Loading /> : renderBox()}
            {!!success && !isLoading && (
              <View style={styles.footerView}>
                <TouchableOpacity
                  style={[styles.button]}
                  onPress={onPressCancelTransaction}>
                  <Text style={styles.buttonTitle}>{'Cancel transaction'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button]}
                  onPress={onPressSpeedupTransaction}>
                  <Text style={styles.buttonTitle}>
                    {'Speed up transaction'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
      <ModalConfirmTransaction
        hideModal={() => {
          setShowModal(false);
        }}
        visible={showModal}
        onSuccess={onSuccess}
      />
    </DokSafeAreaView>
  );
};

export default UpdateTransaction;
