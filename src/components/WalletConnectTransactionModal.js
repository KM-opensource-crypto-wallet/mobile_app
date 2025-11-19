import React, { useCallback, useContext, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { getWalletConnect } from 'dok-wallet-blockchain-networks/service/walletconnect';

import { ThemeContext } from '../theme/ThemeContext';
import { selectWalletConnectTransactionData } from 'dok-wallet-blockchain-networks/redux/walletConnect/walletConnectSelectors';
import { SCREEN_WIDTH } from '../utils/dimensions';
import { selectWalletConnectData } from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import WalletConnect from '../assets/images/WalletConnect.png';
import {
  ETH_SIGN,
  isWalletConnectTransaction,
  PERSONAL_SIGN,
} from 'dok-wallet-blockchain-networks/service/etherWalletConnect';
import { ethers } from 'ethers';
import {
  convertHexToUtf8IfPossible,
  decodeSolMessage,
  getCustomizePublicAddress,
  isValidBigInt,
  safelyJsonStringify,
} from 'dok-wallet-blockchain-networks/helper';
import { createWalletConnectTransaction } from 'dok-wallet-blockchain-networks/redux/walletConnect/walletConnectActions';
import { currencySymbol } from '../data/currency';
import BigNumber from 'bignumber.js';
import { getLocalCurrency } from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import { setWalletConnectTransactionModal } from 'dok-wallet-blockchain-networks/redux/walletConnect/walletConnectSlice';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import {
  TRON_SIGN_MESSAGE,
  TRON_SIGN_TRANSACTION,
} from 'dok-wallet-blockchain-networks/service/tronWalletConnect';
import {
  parseSolanaSignTransaction,
  SOLANA_SIGN_AND_SEND_TRANSACTION,
  SOLANA_SIGN_MESSAGE,
  SOLANA_SIGN_TRANSACTION,
} from 'dok-wallet-blockchain-networks/service/solanaWalletConnect';
import { DokSafeAreaView } from '../components/DokSafeAreaView';

const displayMessage = (method, message) => {
  switch (method) {
    case PERSONAL_SIGN:
    case ETH_SIGN: {
      return convertHexToUtf8IfPossible(message);
    }
    case SOLANA_SIGN_MESSAGE: {
      return decodeSolMessage(message);
    }
    case SOLANA_SIGN_TRANSACTION:
    case SOLANA_SIGN_AND_SEND_TRANSACTION: {
      return safelyJsonStringify(parseSolanaSignTransaction(message));
    }
    default: {
      return safelyJsonStringify(message);
    }
  }
};
const WalletConnectTransactionModal = props => {
  const transactionData = useSelector(selectWalletConnectTransactionData);
  const dispatch = useDispatch();
  const image = transactionData?.peerMeta?.icons[0] || null;
  const title = transactionData?.peerMeta?.name || '';
  const url = transactionData?.peerMeta?.url || '';
  const id = transactionData?.id || '';
  const sessionId = transactionData?.sessionId || '';
  const method = transactionData?.method;
  const topic = transactionData?.topic;
  const chainId = transactionData?.chainId;
  const localCurrency = useSelector(getLocalCurrency);
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const walletConnectData = useSelector(selectWalletConnectData, shallowEqual);

  const walletData = useMemo(() => {
    const chains = walletConnectData[sessionId];
    const finalChains = Array.isArray(chains) ? chains : [];
    return finalChains.find(item => item.key === chainId);
  }, [chainId, sessionId, walletConnectData]);

  useEffect(() => {
    if (!isFocused) {
      dispatch(setWalletConnectTransactionModal(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  useEffect(() => {
    const backAction = () => {
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  const getTransactionRequestData = useMemo(() => {
    if (
      transactionData?.chainId?.includes('tron') ||
      transactionData?.chainId?.includes('solana')
    ) {
      if (
        transactionData?.method === TRON_SIGN_MESSAGE ||
        transactionData?.method === SOLANA_SIGN_MESSAGE
      ) {
        return {
          signTypeData: transactionData?.params?.message,
        };
      }
      if (transactionData?.method === TRON_SIGN_TRANSACTION) {
        return {
          finaltransactionData:
            transactionData?.params?.transaction?.transaction,
          signTypeData: transactionData?.params?.transaction?.transaction,
        };
      }
      if (
        transactionData?.method === SOLANA_SIGN_TRANSACTION ||
        transactionData?.method === SOLANA_SIGN_AND_SEND_TRANSACTION
      ) {
        return {
          finaltransactionData: transactionData?.params?.transaction,
          signTypeData: transactionData?.params,
        };
      }
      if (transactionData?.method === SOLANA_SIGN_MESSAGE) {
        return {
          finaltransactionData: transactionData?.params?.transaction,
          signTypeData: transactionData?.params,
        };
      }
    } else {
      const finaltransactionData = transactionData?.params[0] || {};
      const signTypeData =
        transactionData?.method === PERSONAL_SIGN
          ? transactionData?.params[0]
          : transactionData?.params[1];
      if (finaltransactionData?.value) {
        const etherAmount = finaltransactionData?.value
          ? ethers.formatUnits(finaltransactionData?.value)
          : '';
        const gasPrice =
          isValidBigInt(finaltransactionData?.gasPrice) || BigInt(0);
        const gasLimit =
          isValidBigInt(finaltransactionData?.gasLimit) || BigInt(0);
        const transactionFees = ethers.formatUnits(
          gasPrice * gasLimit,
          'ether',
        );
        const transactionFeeBN = BigNumber(transactionFees);
        const currencyRateBN = BigNumber(walletData?.currencyRate || '0');
        const fiatTransactionFees = transactionFeeBN
          .multipliedBy(currencyRateBN)
          .toString();
        const toAddress = finaltransactionData?.to;
        return {
          finaltransactionData,
          etherAmount,
          signTypeData,
          transactionFees,
          fiatTransactionFees,
          toAddress,
        };
      }
      return {
        finaltransactionData,
        signTypeData,
      };
    }
  }, [transactionData, walletData]);

  const onPressApprove = async () => {
    try {
      navigation.pop();
      dispatch(
        createWalletConnectTransaction({
          transactionData: getTransactionRequestData?.finaltransactionData,
          chain_name: walletData?.chain_name?.toLowerCase(),
          privateKey: walletData?.privateKey,
          requestId: transactionData?.id,
          sessionId,
          id,
          topic,
          method,
          signTypeData: getTransactionRequestData?.signTypeData,
        }),
      );
    } catch (e) {
      console.error('Error in approve request', e);
    }
  };

  const onPressReject = useCallback(() => {
    navigation.pop();
    const connector = getWalletConnect();
    if (connector) {
      const response = {
        id,
        jsonrpc: '2.0',
        error: {
          code: 5000,
          message: 'User rejected.',
        },
      };
      connector.respondSessionRequest({ topic, response });
    }
  }, [id, navigation, topic]);

  const { theme } = useContext(ThemeContext);

  const styles = myStyles(theme);

  const MessageView = () => {
    const signTypeData = getTransactionRequestData?.signTypeData;
    const message = displayMessage(method, signTypeData);
    return (
      <View style={{ flex: 1 }}>
        <Text style={[styles.chainTitle, { marginLeft: 0 }]}>{'Message'}</Text>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainerStyle}>
          <Text style={styles.messageStyle}>{message}</Text>
        </ScrollView>
      </View>
    );
  };

  const currencyRate = walletData?.currencyRate || '0';
  const amount = getTransactionRequestData?.etherAmount || '0';
  const currentRateBN = new BigNumber(currencyRate);
  const amountBN = new BigNumber(amount);
  const priceValue = currentRateBN.multipliedBy(amountBN);
  const fiatEstimateFee = getTransactionRequestData?.fiatTransactionFees || '0';
  const fiatEstimateFeeBN = new BigNumber(fiatEstimateFee);
  const totalValue = priceValue.plus(fiatEstimateFeeBN).toFixed(2);
  const transactionFee = getTransactionRequestData?.transactionFees;
  const transactionFeeNumber = Number(
    getTransactionRequestData?.transactionFees,
  );
  const finalTransactionFee =
    isNaN(transactionFeeNumber) || BigNumber(transactionFeeNumber).lte(0)
      ? 0
      : transactionFee;

  return (
    <DokSafeAreaView style={styles.modalStyle}>
      <View style={styles.mainView}>
        <FastImage source={WalletConnect} style={styles.mainImageStyle} />
        <View style={styles.borderView} />
        {image && <FastImage source={{ uri: image }} style={styles.imageStyle} />}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.url}>{url}</Text>
        <View style={[styles.borderView, { marginTop: 12 }]} />
        {isWalletConnectTransaction(method) ? (
          <View style={styles.formInput}>
            <Text style={styles.amountTitle}>{`-${amount || 0} ${walletData?.symbol || ''
              }`}</Text>
            <Text style={styles.boxBalance}>
              {currencySymbol[localCurrency] || ''}
              {priceValue?.toFixed(2) || '0'}
            </Text>
            <View style={styles.box}>
              <View style={styles.transferItemView}>
                <Text style={styles.transferTitle}>{'Chain'}</Text>
                <Text
                  style={
                    styles.boxBalance
                  }>{`${walletData?.chain_display_name}`}</Text>
              </View>
              <View style={styles.transferItemView}>
                <Text style={styles.transferTitle}>{'Asset'}</Text>
                <Text
                  style={
                    styles.boxBalance
                  }>{`${walletData?.name} (${walletData?.symbol})`}</Text>
              </View>
              <View style={styles.transferItemView}>
                <Text style={styles.transferTitle}>{'From'}</Text>
                <Text style={styles.boxBalance}>{`${getCustomizePublicAddress(
                  walletData?.address,
                )}`}</Text>
              </View>
              <View style={styles.transferItemView}>
                <Text style={styles.transferTitle}>{'To'}</Text>
                <Text style={styles.boxBalance}>{`${getCustomizePublicAddress(
                  getTransactionRequestData?.toAddress,
                )}`}</Text>
              </View>
            </View>
            <View style={styles.box}>
              {!!finalTransactionFee && (
                <View style={styles.transferItemView}>
                  <Text style={styles.transferTitle}>{'Network Fee'}</Text>
                  <Text
                    style={
                      styles.boxBalance
                    }>{`${finalTransactionFee} ${walletData?.chain_symbol}`}</Text>
                </View>
              )}
              <View style={styles.transferItemView}>
                <Text style={styles.transferTitle}>{'Max Total'}</Text>
                <Text style={styles.boxBalance}>{`${currencySymbol[localCurrency]
                  }${totalValue || 0}`}</Text>
              </View>
            </View>
          </View>
        ) : (
          MessageView()
        )}
        <View style={styles.bottomView}>
          <View style={styles.rowView}>
            <TouchableOpacity style={[styles.button]} onPress={onPressReject}>
              <Text style={styles.buttonTitle}>{'Reject'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              // disabled={!isValidChain}
              style={[
                styles.button,
                // {
                //   backgroundColor: !isValidChain
                //     ? theme.gray
                //     : theme.background,
                // },
              ]}
              onPress={onPressApprove}>
              <Text style={styles.buttonTitle}>{'Approve'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </DokSafeAreaView>
  );
};

const myStyles = theme =>
  StyleSheet.create({
    modalStyle: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    mainContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 40,
    },
    contentContainerStyle: {
      alignItems: 'center',
      flexGrow: 1,
      padding: 16,
    },
    imageStyle: {
      height: 40,
      width: 40,
      marginBottom: 20,
      borderRadius: 8,
      marginTop: 20,
    },
    mainImageStyle: {
      width: SCREEN_WIDTH * 0.8,
      height: 80,
      resizeMode: 'contain',
    },
    mainView: {
      backgroundColor: theme.backgroundColor,
      borderRadius: 24,
      paddingBottom: 20,
      paddingTop: 10,
      width: '100%',
      height: '100%',
      alignItems: 'center',
      flex: 1,
    },

    title: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.primary,
      marginBottom: 12,
    },
    chainTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.font,
      textAlign: 'left',
      marginTop: 12,
      alignSelf: 'flex-start',
      marginLeft: '5%',
    },
    url: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.primary,
      fontFamily: 'Roboto-Regular',
    },
    bottomView: {
      flex: 1,
      justifyContent: 'flex-end',
      paddingHorizontal: '5%',
      width: '100%',
    },
    rowView: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    chainView: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginVertical: 12,
      paddingHorizontal: '5%',
    },
    approveBtn: {
      backgroundColor: theme.font,
      width: SCREEN_WIDTH - 80,
    },
    rejectBtn: {
      backgroundColor: theme.font,
      width: SCREEN_WIDTH - 80,
      marginTop: 16,
    },
    rejectButtonText: {
      color: 'white',
    },
    coinImageSize: {
      width: 20,
      height: 20,
      resizeMode: 'contain',
    },
    dropdownImageSize: {
      width: 16,
      height: 16,
      resizeMode: 'contain',
    },
    itemTitle: {
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
      fontSize: 14,
      color: theme.primary,
    },
    dropDownContainerStyle: {
      borderRadius: 8,
    },
    dropDownRowStyle: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    rowImageStyle: {
      height: 30,
      width: 30,
      resizeMode: 'contain',
      marginRight: 8,
    },
    itemView: {
      borderWidth: 1,
      marginTop: 20,
      borderRadius: 8,
      borderColor: theme.gray,
      width: '90%',
      paddingHorizontal: 12,
      flexDirection: 'row',
      paddingVertical: 8,
      height: 60,
      alignItems: 'center',
    },
    borderView: {
      height: 1.5,
      backgroundColor: theme.gray,
      width: '100%',
      // marginTop: 12,
    },
    centerItemView: {
      justifyContent: 'space-between',
      flex: 1,
      height: '100%',
    },
    button: {
      backgroundColor: theme.background,
      height: 60,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      width: '48%',
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
    },
    errorText: {
      marginTop: 2,
      marginBottom: 10,
      color: 'red',
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      fontWeight: '500',
      textAlign: 'center',
    },
    scrollView: {
      flex: 1,
      backgroundColor: '#F6F6F6',
      marginTop: 12,
      borderRadius: 8,
    },
    formInput: {
      width: '100%',
      paddingHorizontal: '5%',
    },
    amountTitle: {
      color: theme.font,
      fontSize: 32,
      textAlign: 'left',
      fontFamily: 'Roboto-bold',
      alignSelf: 'center',
    },
    boxBalance: {
      color: theme.gray,
      fontSize: 16,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
      alignSelf: 'center',
    },
    transferItemView: {
      flexDirection: 'row',
      height: 40,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    box: {
      backgroundColor: theme.whiteOutline,
      paddingHorizontal: 16,
      borderRadius: 8,
      overflow: 'hidden',
      marginTop: 24,
    },
    transferTitle: {
      color: theme.font,
      fontSize: 16,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
    },
  });

export default WalletConnectTransactionModal;
