import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from 'react';
import myStyles from './SendNFTStyles';
import {
  TouchableOpacity,
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {TextInput} from 'react-native-paper';
import {Formik} from 'formik';
import {useSelector, useDispatch} from 'react-redux';
import isJson from 'dok-wallet-blockchain-networks/service/isJson';
import {Portal, Provider} from 'react-native-paper';
import {validationSchemaSendNFT} from 'utils/validationSchema';

import {IS_ANDROID} from 'utils/dimensions';

import {ThemeContext} from 'theme/ThemeContext';
import {
  calculateEstimateFee,
  setCurrentTransferData,
} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSlice';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {
  getSelectedNft,
  selectCurrentWallet,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import FastImage from '@d11/react-native-fast-image';
import DefaultDokWalletImage from 'components/DefaultDokWalletImage';
import {getChain} from 'dok-wallet-blockchain-networks/cryptoChain';
import {setExchangeSuccess} from 'dok-wallet-blockchain-networks/redux/exchange/exchangeSlice';
import {isNameSupportChain} from 'dok-wallet-blockchain-networks/helper';

const SendNFT = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const selectedNft = useSelector(getSelectedNft);
  const selectedWallet = useSelector(selectCurrentWallet);

  const qrAddress = route?.params?.qrAddress;
  const qrAmount = route?.params?.qrAmount;
  const newDate = route?.params?.newDateToString;
  const [sendInput, setSendInput] = useState(qrAddress || '');
  const [localImage, setLocalImage] = useState(selectedNft?.metadata?.image);

  useEffect(() => {
    setLocalImage(selectedNft?.metadata?.image);
  }, [selectedNft?.metadata?.image]);
  const dispatch = useDispatch();
  const formikRef = useRef(null);

  // useEffect(() => {
  //   setUserCoins(coins);
  // }, [coins]);

  useEffect(() => {
    if (qrAddress) {
      formikRef?.current?.setFieldValue('send', qrAddress);
    }
    if (qrAmount) {
      formikRef?.current?.setFieldValue('amount', qrAmount);
    }
    if (qrAddress || qrAmount) {
      setTimeout(() => {
        formikRef?.current?.setFieldTouched('send', true);
        formikRef?.current?.setFieldTouched('amount', true);
      }, 0);
    }
  }, [newDate, qrAddress, qrAmount]);

  useEffect(() => {
    setSendInput(isDataCorrect() || '');
  }, [route?.params?.data, isDataCorrect]);

  const isDataCorrect = useCallback(() => {
    return route?.params?.data
      ? isJson(route?.params?.data)
        ? JSON.parse(route?.params?.data).address
        : ''
      : route?.params?.data;
  }, [route]);

  const handleSubmitForm = async values => {
    // setAmountInput(values.amount);
    const currentChain = getChain(selectedNft?.coin?.chain_name);
    const isValid = await currentChain.isValidAddress({address: values?.send});
    let validAddress = null;
    if (!isValid && isNameSupportChain(selectedNft?.coin?.chain_name)) {
      validAddress = await currentChain?.isValidName({name: values?.send});
    }
    if (isValid || validAddress) {
      dispatch(
        setCurrentTransferData({
          toAddress: validAddress || values?.send,
          currentCoin: selectedNft?.coin,
          selectedNFT: selectedNft,
          isSendFunds: false,
          validAddress,
          validName: validAddress ? values?.send : null,
        }),
      );

      dispatch(
        calculateEstimateFee({
          selectedCoin: selectedNft?.coin,
          selectedWallet,
          fromAddress: selectedNft?.coin?.address,
          toAddress: validAddress || values?.send,
          contract_type: selectedNft?.contract_type,
          tokenId: selectedNft?.token_id,
          tokenAmount: selectedNft?.amount || 1,
          contractAddress:
            selectedNft?.token_address || selectedNft?.associatedTokenAddress,
          mint: selectedNft?.mint,
          isNFT: true,
        }),
      );
      dispatch(setExchangeSuccess(false));
      navigation.navigate('Transfer', {fromScreen: 'SendNFT'});
    } else {
      formikRef?.current?.setFieldError('send', 'address is not valid');
    }
  };

  return (
    <Provider>
      <Portal>
        <KeyboardAwareScrollView
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          bounces={false}
          keyboardShouldPersistTaps={'always'}
          {...(IS_ANDROID ? {extraScrollHeight: 30} : {})}
          enableResetScrollToCoords={false}
          keyboardOpeningTime={Number.MAX_SAFE_INTEGER}
          contentContainerStyle={styles.contentContainerStyle}>
          <Formik
            innerRef={formikRef}
            enableReinitialize={true}
            initialValues={{
              send: qrAddress || sendInput,
            }}
            validationSchema={validationSchemaSendNFT()}
            onSubmit={handleSubmitForm}>
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              isValid,
              setFieldValue,
            }) => (
              <TouchableWithoutFeedback
                onPress={() => {
                  Keyboard.dismiss();
                }}>
                <View style={{flex: 1}}>
                  <View style={styles.formInput}>
                    <View
                      style={{
                        flex: 1,
                      }}>
                      <View style={styles.boxInput}>
                        <Text style={styles.listTitle}>Send to</Text>
                        <TextInput
                          style={styles.input}
                          label="Enter wallet adress or scan QR"
                          theme={{
                            colors: {
                              onSurfaceVariant: errors ? theme.gray : 'red',
                            },
                          }}
                          textColor={theme.font}
                          outlineColor={errors.send ? 'red' : theme.gray}
                          activeOutlineColor={errors.send ? 'red' : theme.font}
                          autoCapitalize="none"
                          returnKeyType="next"
                          mode="outlined"
                          blurOnSubmit={false}
                          name="send"
                          onChangeText={handleChange('send')}
                          onBlur={handleBlur('send')}
                          value={values.send}
                          onSubmitEditing={handleSubmit}
                          right={
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
                          }
                        />
                        {errors.send && (
                          <Text style={styles.textConfirm}>{errors.send}</Text>
                        )}
                      </View>
                      <View style={styles.nftMainView}>
                        {localImage ? (
                          <FastImage
                            source={{uri: localImage}}
                            style={styles.imageStyle}
                            resizeMode={'contain'}
                            onError={e => {
                              setLocalImage(null);
                            }}
                          />
                        ) : (
                          <DefaultDokWalletImage height={60} width={60} />
                        )}
                        <Text style={styles.nftTitle}>
                          {selectedNft.name}
                          {!!selectedNft?.token_id && (
                            <Text
                              style={
                                styles.nftSubTitle
                              }>{` (${selectedNft?.token_id})`}</Text>
                          )}
                        </Text>
                        {!!selectedNft?.metadata?.description && (
                          <Text style={styles.description}>
                            {selectedNft?.metadata?.description}
                          </Text>
                        )}
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
      </Portal>
    </Provider>
  );
};

export default SendNFT;
