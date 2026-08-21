import React, {
  useCallback,
  useContext,
  useMemo,
  useEffect,
  useState,
} from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import Clipboard from '@react-native-clipboard/clipboard';
import IoniconIcon from 'react-native-vector-icons/Ionicons';
import {getWalletConnect} from 'dok-wallet-blockchain-networks/service/walletconnect';

import {ThemeContext} from 'theme/ThemeContext';
import {selectWalletConnectTransactionData} from 'dok-wallet-blockchain-networks/redux/walletConnect/walletConnectSelectors';
import {SCREEN_WIDTH} from 'utils/dimensions';
import {selectWalletConnectData} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import WalletConnect from 'assets/images/WalletConnect.png';
import {
  convertHexToUtf8IfPossible,
  decodeSolMessage,
  getCustomizePublicAddress,
  isValidBigInt,
  parseBalance,
  safelyJsonParse,
  safelyJsonStringify,
} from 'dok-wallet-blockchain-networks/helper';
import {currencySymbol} from 'data/currency';
import BigNumber from 'bignumber.js';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {setWalletConnectTransactionModal} from 'dok-wallet-blockchain-networks/redux/walletConnect/walletConnectSlice';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import {showToast} from 'utils/toast';
import {
  EVM_SIGN_REQUEST_HANDLERS,
  isNonEVMChain,
  NON_EVM_METHOD_HANDLERS,
} from 'dok-wallet-blockchain-networks/config/config';
import {walletConnect} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';

export const ETH_SEND_TRANSACTION = 'eth_sendTransaction';
export const ETH_SIGN_TRANSACTION = 'eth_signTransaction';
const transactionType = [ETH_SEND_TRANSACTION, ETH_SIGN_TRANSACTION];
const isWalletConnectTransaction = method => transactionType.includes(method);
function parseSolanaSignTransaction(txData) {
  // Default values for summary properties
  let sender = 'N/A';
  let data = 'N/A';

  try {
    if (!txData || typeof txData !== 'object') {
      throw new Error('Invalid transaction data provided');
    }
    sender = txData.feePayer || txData.pubkey || sender;
    data = txData?.transaction
      ? txData?.transaction
      : Array.isArray(txData?.transactions)
      ? JSON.stringify(txData?.transactions)
      : data;
  } catch (error) {
    console.error('Error parsing transaction:', error);
  }
  return {
    sender,
    data,
  };
}
const getMessageData = (method, message) => {
  switch (method) {
    case 'personal_sign':
    case 'eth_sign':
      return {type: 'text', value: convertHexToUtf8IfPossible(message)};
    case 'solana_signMessage':
      return {type: 'text', value: decodeSolMessage(message)};
    case 'solana_signTransaction':
    case 'solana_signAndSendTransaction':
      return {type: 'json', value: parseSolanaSignTransaction(message)};
    case 'xrpl_signMessage':
    case 'polkadot_signMessage':
      return {type: 'text', value: convertHexToUtf8IfPossible(message)};
    case 'stellar_signMessage':
      return {type: 'text', value: message};
    default:
      return {
        type: 'json',
        value: typeof message === 'string' ? safelyJsonParse(message) : message,
      };
  }
};

const formatKeyLabel = key => {
  if (typeof key !== 'string') {
    return String(key);
  }
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ');
  return spaced.replace(/\b\w/g, char => char.toUpperCase());
};

const stringifyPrimitive = value => {
  if (value === null || value === undefined) {
    return '—';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
};

const MessageValueRow = ({label, value, styles, theme}) => {
  const stringValue = stringifyPrimitive(value);
  const isCopyable = typeof value === 'string' && value.length > 0;
  const isLong = stringValue.length > 18;

  const onCopy = () => {
    if (!isCopyable) {
      return;
    }
    Clipboard.setString(stringValue);
    showToast({type: 'successToast', title: 'Copied to clipboard'});
  };

  return (
    <TouchableOpacity
      style={styles.msgRow}
      activeOpacity={isCopyable ? 0.6 : 1}
      disabled={!isCopyable}
      onPress={onCopy}>
      {!!label && (
        <Text style={styles.msgRowLabel} numberOfLines={1}>
          {label}
        </Text>
      )}
      <View style={styles.msgRowValueWrap}>
        <Text
          style={styles.msgRowValue}
          numberOfLines={isLong ? 1 : undefined}
          ellipsizeMode="middle">
          {stringValue}
        </Text>
        {isCopyable && (
          <IoniconIcon
            name="copy-outline"
            size={14}
            color={theme.gray}
            style={styles.msgCopyIcon}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const MessageNode = ({label, value, styles, theme, depth = 0}) => {
  const [expanded, setExpanded] = useState(true);
  const isArray = Array.isArray(value);
  const isObject = !isArray && value !== null && typeof value === 'object';

  if (!isArray && !isObject) {
    return (
      <MessageValueRow
        label={label}
        value={value}
        styles={styles}
        theme={theme}
      />
    );
  }

  const entries = isArray
    ? value.map((item, index) => [`#${index + 1}`, item])
    : Object.entries(value);
  const count = entries.length;
  const countLabel = isArray
    ? `${count} item${count === 1 ? '' : 's'}`
    : `${count} field${count === 1 ? '' : 's'}`;
  const isRoot = label == null;

  const children = (
    <View style={isRoot ? null : styles.msgNestedContainer}>
      {entries.map(([key, val], index) => (
        <React.Fragment key={key}>
          {index > 0 && <View style={styles.msgDivider} />}
          <MessageNode
            label={isArray ? key : formatKeyLabel(key)}
            value={val}
            styles={styles}
            theme={theme}
            depth={depth + 1}
          />
        </React.Fragment>
      ))}
      {count === 0 && <Text style={styles.msgEmptyText}>{'Empty'}</Text>}
    </View>
  );

  if (isRoot) {
    return children;
  }

  return (
    <View style={styles.msgSection}>
      <TouchableOpacity
        style={styles.msgSectionHeader}
        activeOpacity={0.6}
        onPress={() => setExpanded(prev => !prev)}>
        <Text style={styles.msgRowLabel} numberOfLines={1}>
          {label}
        </Text>
        <View style={styles.msgRowValueWrap}>
          <Text style={styles.msgSectionCount}>{countLabel}</Text>
          <IoniconIcon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={theme.gray}
          />
        </View>
      </TouchableOpacity>
      {expanded && children}
    </View>
  );
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
    if (isNonEVMChain(transactionData?.chainId)) {
      const {finaltransactionData, signTypeData, expectedSignerAddress} =
        NON_EVM_METHOD_HANDLERS[transactionData?.method](
          transactionData?.params,
        );
      return {finaltransactionData, signTypeData, expectedSignerAddress};
    } else {
      if (transactionData?.method?.includes('wallet_sendCalls')) {
        const batchCalls = (transactionData?.params?.[0]?.calls || []).map(
          call => ({
            ...call,
            etherValue: call?.value ? parseBalance(call.value, 18) : '',
          }),
        );
        return {
          finaltransactionData: {
            batchCalls,
            from: transactionData?.from,
          },
          expectedSignerAddress: transactionData?.params?.[0]?.from,
        };
      }
      const finaltransactionData = transactionData?.params[0] || {};
      const {signTypeData, expectedSignerAddress} = EVM_SIGN_REQUEST_HANDLERS[
        transactionData?.method
      ]?.(transactionData?.params) || {
        signTypeData: transactionData?.params[1],
        expectedSignerAddress: undefined,
      };
      if (finaltransactionData?.value) {
        const etherAmount = finaltransactionData?.value
          ? parseBalance(finaltransactionData?.value, 18)
          : '';
        const gasPrice =
          isValidBigInt(finaltransactionData?.gasPrice) || BigInt(0);
        const gasLimit =
          isValidBigInt(finaltransactionData?.gasLimit) || BigInt(0);
        const transactionFees = parseBalance(gasPrice * gasLimit, 18);
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
          expectedSignerAddress,
          transactionFees,
          fiatTransactionFees,
          toAddress,
        };
      }
      return {
        finaltransactionData,
        signTypeData,
        expectedSignerAddress,
      };
    }
  }, [transactionData, walletData]);

  const onPressApprove = async () => {
    try {
      navigation.pop();
      dispatch(
        walletConnect({
          transactionData: {
            ...getTransactionRequestData?.finaltransactionData,
            batchCalls: transactionData?.params?.[0]?.calls,
            from: transactionData?.from,
          },
          isBatchTransaction: transactionData?.isBatchTransaction,
          chain_name: walletData?.chain_name?.toLowerCase(),
          privateKey: walletData?.privateKey,
          walletAddress: walletData?.address,
          expectedSignerAddress:
            getTransactionRequestData?.expectedSignerAddress,
          id,
          topic,
          method,
          signTypeData: getTransactionRequestData?.signTypeData,
          domain: transactionData?.peerMeta?.url,
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
      connector.respondSessionRequest({topic, response});
    }
  }, [id, navigation, topic]);

  const {theme} = useContext(ThemeContext);

  const styles = myStyles(theme);

  const BatchCallsView = () => {
    const calls =
      getTransactionRequestData?.finaltransactionData?.batchCalls || [];
    return (
      <View style={{flex: 1, width: '100%', paddingHorizontal: '5%'}}>
        <Text style={[styles.chainTitle, {marginLeft: 0}]}>
          {`Batch Calls (${calls.length})`}
        </Text>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainerStyle}>
          {calls.map((call, index) => (
            <View
              key={index}
              style={[styles.box, {width: '100%', marginTop: 12}]}>
              <View style={styles.transferItemView}>
                <Text style={styles.transferTitle}>{'Call'}</Text>
                <Text style={styles.boxBalance}>{`#${index + 1}`}</Text>
              </View>
              <View style={styles.transferItemView}>
                <Text style={styles.transferTitle}>{'To'}</Text>
                <Text style={styles.boxBalance}>
                  {getCustomizePublicAddress(call?.to)}
                </Text>
              </View>
              {!!call?.etherValue && (
                <View style={styles.transferItemView}>
                  <Text style={styles.transferTitle}>{'Value'}</Text>
                  <Text style={styles.boxBalance}>
                    {call.etherValue} {walletData?.symbol}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const MessageView = () => {
    const signTypeData = getTransactionRequestData?.signTypeData;
    const messageData = getMessageData(method, signTypeData);
    const isStructured =
      messageData.type === 'json' &&
      messageData.value !== null &&
      typeof messageData.value === 'object';

    const onCopyAll = () => {
      const text = isStructured
        ? safelyJsonStringify(messageData.value)
        : stringifyPrimitive(messageData.value);
      Clipboard.setString(text || '');
      showToast({type: 'successToast', title: 'Copied to clipboard'});
    };

    return (
      <View style={{flex: 1, width: '100%', paddingHorizontal: '5%'}}>
        <View style={styles.msgHeaderRow}>
          <Text style={[styles.chainTitle, {marginLeft: 0, marginTop: 0}]}>
            {'Message'}
          </Text>
          <TouchableOpacity style={styles.msgCopyAllBtn} onPress={onCopyAll}>
            <IoniconIcon name="copy-outline" size={14} color={theme.gray} />
            <Text style={styles.msgCopyAllText}>{'Copy'}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.contentContainerStyle,
            {alignItems: 'stretch', padding: 12},
          ]}>
          {isStructured ? (
            <MessageNode
              value={messageData.value}
              styles={styles}
              theme={theme}
              depth={0}
            />
          ) : (
            <Text style={styles.messageStyle}>
              {messageData.type === 'text'
                ? messageData.value
                : stringifyPrimitive(messageData.value)}
            </Text>
          )}
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
        {image && <FastImage source={{uri: image}} style={styles.imageStyle} />}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.url}>{url}</Text>
        <View style={[styles.borderView, {marginTop: 12}]} />
        {method?.includes('wallet_sendCalls') ? (
          BatchCallsView()
        ) : isWalletConnectTransaction(method) ? (
          <View style={styles.formInput}>
            <Text style={styles.amountTitle}>{`-${amount || 0} ${
              walletData?.symbol || ''
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
                <Text style={styles.boxBalance}>{`${
                  currencySymbol[localCurrency]
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
      backgroundColor: theme.whiteOutline,
      marginTop: 12,
      borderRadius: 12,
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
    messageStyle: {
      color: theme.font,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
    },
    msgHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 12,
    },
    msgCopyAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    msgCopyAllText: {
      fontSize: 13,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
    },
    msgSection: {
      width: '100%',
    },
    msgSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      gap: 12,
    },
    msgSectionCount: {
      fontSize: 12,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
    },
    msgNestedContainer: {
      width: '100%',
      marginTop: 4,
      marginBottom: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: theme.backgroundColor,
    },
    msgRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      gap: 12,
    },
    msgRowLabel: {
      fontSize: 14,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
      flexShrink: 0,
      maxWidth: '40%',
    },
    msgRowValueWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 1,
    },
    msgRowValue: {
      fontSize: 14,
      color: theme.font,
      fontFamily: 'Roboto-Regular',
      textAlign: 'right',
      flexShrink: 1,
    },
    msgCopyIcon: {
      flexShrink: 0,
    },
    msgDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.backgroundColor,
    },
    msgEmptyText: {
      fontSize: 13,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
      fontStyle: 'italic',
      paddingVertical: 8,
    },
  });

export default WalletConnectTransactionModal;
