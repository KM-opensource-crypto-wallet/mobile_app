import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
import IoniconsIcon from 'react-native-vector-icons/Ionicons';
import {getSdkError} from '@walletconnect/utils';
import {useDispatch, useSelector} from 'react-redux';
import {getWalletConnect} from 'dok-wallet-blockchain-networks/service/walletconnect';

import {
  setWalletConnectConnection,
  setWalletConnectRequestModal,
} from 'dok-wallet-blockchain-networks/redux/walletConnect/walletConnectSlice';
import {ThemeContext} from 'theme/ThemeContext';
import {selectWalletConnectRequestData} from 'dok-wallet-blockchain-networks/redux/walletConnect/walletConnectSelectors';
import {SCREEN_WIDTH} from 'utils/dimensions';
import {
  setWalletConnectWalletData,
  setWalletConnect,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {
  selectAllCoins,
  selectCurrentWallet,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import WalletConnect from 'assets/images/WalletConnect.png';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import {chainLogoMap} from 'assets/chain_logo';
import {
  getCustomizePublicAddress,
  isHederaUnactivated,
} from 'dok-wallet-blockchain-networks/helper';
import {
  BTC_VARIANT_CHAIN_NAMES,
  buildSessionNamespaces,
  collectProposalChains,
  getSessionAccountAddress,
  getUnsupportedRequiredChains,
  resolveSessionChainData,
  toSessionAccountsData,
} from 'dok-wallet-blockchain-networks/helper/walletConnectSession';
import {showToast} from 'utils/toast';

const getTonSessionProperties = privateKey => {
  const {
    TonChain,
  } = require('dok-wallet-blockchain-networks/cryptoChain/chains/TonChain');
  return TonChain().getSessionProperties({privateKey});
};
const HEDERA_UNACTIVATED_SESSION_MESSAGE =
  'Hedera native requests need a funded account (deposit HBAR to your address first). EVM requests on Hedera still work.';
const BTC_VARIANT_LABELS = {
  bitcoin: 'Native SegWit',
  bitcoin_segwit: 'SegWit',
  bitcoin_legacy: 'Legacy',
  bitcoin_taproot: 'Taproot',
};

// Middle-ellipsis for the per-type address preview: keeps the prefix that
// identifies the address type (bc1q / bc1p / 3 / 1) and the checksum tail.
const shortenAddress = (address, head = 8, tail = 6) => {
  if (typeof address !== 'string') {
    return '';
  }
  return address.length <= head + tail + 1
    ? address
    : `${address.slice(0, head)}…${address.slice(-tail)}`;
};

const WalletConnectRequestModal = props => {
  const requestData = useSelector(selectWalletConnectRequestData);
  const allCoins = useSelector(selectAllCoins);
  const currentWallet = useSelector(selectCurrentWallet);
  const [chainData, setChainData] = useState([]);
  const [unsupportedRequiredChains, setUnsupportedRequiredChains] = useState(
    [],
  );
  const [bitcoinAddressType, setBitcoinAddressType] = useState('bitcoin');
  const dispatch = useDispatch();
  const image = requestData?.icons?.[0] || null;
  const title = requestData?.name || '';
  const url = requestData?.url || '';
  const id = requestData?.id || '';
  const sessionId = requestData?.sessionId || '';
  const relays = requestData?.relays || {};
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      dispatch(setWalletConnectRequestModal(false));
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

  // One entry per proposed CAIP-2 chain id we can serve. A coin may answer for
  // several ids (Hedera: `hedera:<net>` and `eip155:<chain_id>`).
  useEffect(() => {
    if (requestData?.requiredNamespaces && allCoins.length) {
      const {requiredChains, optionalChains} =
        collectProposalChains(requestData);
      setChainData(
        resolveSessionChainData({
          requiredChains,
          optionalChains,
          allCoins,
          bitcoinAddressType,
        }),
      );
      setUnsupportedRequiredChains(
        getUnsupportedRequiredChains(requiredChains),
      );
    }
  }, [requestData, allCoins, bitcoinAddressType]);

  // What the session will actually carry: the namespace's account form
  // (Hedera `0.0.N` on `hedera:*`, the address elsewhere), minus native Hedera
  // entries whose ledger account does not exist yet.
  const sessionChainData = useMemo(
    () => toSessionAccountsData(chainData),
    [chainData],
  );
  const {namespaces, missingRequired} = useMemo(
    () =>
      buildSessionNamespaces({
        requiredNamespaces: requestData?.requiredNamespaces,
        optionalNamespaces: requestData?.optionalNamespaces,
        sessionChainData,
      }),
    [requestData, sessionChainData],
  );
  const unactivatedHederaKey = chainData.find(
    item => item.namespace === 'hedera' && isHederaUnactivated(item),
  )?.key;
  const canApprove =
    unsupportedRequiredChains.length === 0 &&
    missingRequired.length === 0 &&
    Object.keys(namespaces).length > 0;
  let errorText = '';
  if (unsupportedRequiredChains.length) {
    errorText = `The dApp requires ${unsupportedRequiredChains.join(
      ', ',
    )}, which this wallet does not support.`;
  } else if (missingRequired.length) {
    errorText = `The dApp requires ${missingRequired.join(
      ', ',
    )}, but this wallet has no account for it yet.`;
  }

  useEffect(() => {
    if (unactivatedHederaKey) {
      showToast({
        type: 'warningToast',
        title: 'Hedera account not active',
        message: HEDERA_UNACTIVATED_SESSION_MESSAGE,
      });
    }
  }, [unactivatedHederaKey]);

  const btcVariantCoins = allCoins.filter(
    item =>
      item.symbol === 'BTC' &&
      BTC_VARIANT_CHAIN_NAMES.includes(item.chain_name),
  );
  const hasBitcoinRequest = chainData.some(item =>
    BTC_VARIANT_CHAIN_NAMES.includes(item.chain_name),
  );

  const onPressApprove = async () => {
    try {
      navigation.pop();
      const connector = getWalletConnect();
      if (!connector) {
        return;
      }
      if (!canApprove) {
        await connector.rejectSession({
          id,
          reason: getSdkError(
            missingRequired.length
              ? 'UNSUPPORTED_ACCOUNTS'
              : 'UNSUPPORTED_CHAINS',
          ),
        });
        return;
      }
      const hasTon = Boolean(namespaces.ton);
      let tonSessionProperties = {};
      if (hasTon) {
        const tonCoinData = sessionChainData.find(
          item => item.chain_name === 'ton',
        );
        if (tonCoinData?.privateKey) {
          tonSessionProperties = getTonSessionProperties(
            tonCoinData.privateKey,
          );
        }
      }
      const session = await connector.approveSession({
        id,
        namespaces,
        relayProtocol: relays[0].protocol,
        ...(hasTon && {sessionProperties: tonSessionProperties}),
      });

      dispatch(
        setWalletConnect({
          [sessionId]: session,
        }),
      );
      dispatch(setWalletConnectConnection(true));

      // The per-session walletData is what the transaction modal and the
      // signer check read back, keyed by CAIP-2 id.
      sessionId &&
        dispatch(setWalletConnectWalletData({[sessionId]: sessionChainData}));
    } catch (e) {
      console.error('Error in approve request', e);
    }
  };

  const onPressReject = useCallback(() => {
    navigation.pop();
    const connector = getWalletConnect();
    if (connector) {
      connector.rejectSession({
        id,
        reason: getSdkError('USER_REJECTED_CHAINS'),
      });
    }
  }, [id, navigation]);

  const {theme} = useContext(ThemeContext);

  const styles = myStyles(theme);

  const renderItem = (item, index) => {
    return (
      <View style={styles.itemView} key={item.key + index}>
        <FastImage
          source={
            chainLogoMap[item?.chain_name?.toLowerCase()] ||
            (item?.icon ? {uri: item.icon} : undefined)
          }
          style={styles.rowImageStyle}
        />
        <View style={styles.centerItemView}>
          <Text style={styles.itemTitle}>
            {`${item?.chain_display_name} (${currentWallet.walletName})`}
          </Text>
          <Text numberOfLines={1} style={styles.url}>
            {getCustomizePublicAddress(getSessionAccountAddress(item)) ||
              'Account not active yet'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <DokSafeAreaView style={styles.modalStyle}>
      <ScrollView
        style={styles.mainView}
        contentContainerStyle={styles.contentContainerStyle}
        bounces={false}>
        <FastImage source={WalletConnect} style={styles.mainImageStyle} />
        <View style={styles.borderView} />
        {image && <FastImage source={{uri: image}} style={styles.imageStyle} />}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.url}>{url}</Text>
        <View style={[styles.borderView, {marginTop: 12}]} />
        <Text style={styles.chainTitle}>{'Chains'}</Text>
        {chainData.map((item, index) => renderItem(item, index))}
        {hasBitcoinRequest && btcVariantCoins.length > 1 && (
          <View style={styles.addressTypeView}>
            <Text style={styles.chainTitle}>{'Bitcoin address type'}</Text>
            <View style={styles.addressTypeGrid}>
              {btcVariantCoins.map(coin => {
                const selected = bitcoinAddressType === coin.chain_name;
                return (
                  <TouchableOpacity
                    key={coin.chain_name}
                    accessibilityRole="radio"
                    accessibilityState={{selected}}
                    activeOpacity={0.7}
                    style={[
                      styles.addressTypeCard,
                      selected && styles.addressTypeCardSelected,
                    ]}
                    onPress={() => setBitcoinAddressType(coin.chain_name)}>
                    <View style={styles.addressTypeCardHeader}>
                      <Text numberOfLines={1} style={styles.addressTypeLabel}>
                        {BTC_VARIANT_LABELS[coin.chain_name] || coin.chain_name}
                      </Text>
                      <View style={styles.addressTypeCheckSlot}>
                        {selected && (
                          <IoniconsIcon
                            name={'checkmark-circle'}
                            size={18}
                            color={theme.background}
                          />
                        )}
                      </View>
                    </View>
                    <Text numberOfLines={1} style={styles.addressTypeAddress}>
                      {shortenAddress(coin.address)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
        <View style={styles.bottomView}>
          {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}
          <View style={styles.rowView}>
            <TouchableOpacity style={[styles.button]} onPress={onPressReject}>
              <Text style={styles.buttonTitle}>{'Reject'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!canApprove}
              style={[
                styles.button,
                {
                  backgroundColor: !canApprove ? theme.gray : theme.background,
                },
              ]}
              onPress={onPressApprove}>
              <Text style={styles.buttonTitle}>{'Accept'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </DokSafeAreaView>
    // </Modal>
  );
};
export default WalletConnectRequestModal;

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
    addressTypeView: {
      width: '90%',
    },
    addressTypeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 12,
      marginTop: 12,
    },
    addressTypeCard: {
      width: '48%',
      borderWidth: 1,
      borderColor: theme.gray,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    addressTypeCardSelected: {
      borderColor: theme.background,
      backgroundColor: theme.walletItemColor,
    },
    addressTypeCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    addressTypeLabel: {
      flex: 1,
      color: theme.font,
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Roboto-Regular',
    },
    // Fixed slot so the label does not shift when the check appears.
    addressTypeCheckSlot: {
      width: 18,
      height: 18,
      marginLeft: 6,
    },
    addressTypeAddress: {
      marginTop: 4,
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
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
  });
