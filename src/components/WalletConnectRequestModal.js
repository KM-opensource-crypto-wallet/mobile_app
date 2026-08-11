import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
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
import {config} from 'dok-wallet-blockchain-networks/config/config';
import {
  selectAllCoins,
  selectCurrentWallet,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import WalletConnect from 'assets/images/WalletConnect.png';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import {getTonSessionProperties} from 'dok-wallet-blockchain-networks/service/walletConnect/tonWalletConnect';
import {chainLogoMap} from 'assets/chain_logo';

const WalletConnectRequestModal = props => {
  const requestData = useSelector(selectWalletConnectRequestData);
  const allCoins = useSelector(selectAllCoins);
  const currentWallet = useSelector(selectCurrentWallet);
  const [chainData, setChainData] = useState([]);
  const [isValidChain, setIsValidChain] = useState(false);
  const dispatch = useDispatch();
  const image = requestData?.icons[0] || null;
  const title = requestData?.name || '';
  const url = requestData?.url || '';
  const id = requestData?.id || '';
  const sessionId = requestData?.sessionId || '';
  const requiredNamespaces = requestData?.requiredNamespaces || {};
  const optionalNamespaces = requestData?.optionalNamespaces || {};
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

  useEffect(() => {
    if (requestData?.requiredNamespaces && allCoins.length) {
      const requireNamespace = requestData?.requiredNamespaces;
      const optionalNamespacesLocal = requestData?.optionalNamespaces;
      // const appImage = requestData?.icons[0] || null;
      // const appTitle = requestData?.name || '';
      // const appUrl = requestData?.url || '';
      const requiredNamespaceValue = Object.values(requireNamespace);
      const optionalNamespacesValue = Object.values(optionalNamespacesLocal);
      let allChain = [];
      requiredNamespaceValue.forEach(
        item => (allChain = allChain.concat(item.chains)),
      );
      let chainDetails = [];
      let isValidChainLocal = true;
      allChain.forEach(item => {
        if (config.WALLET_CONNECT_SUPPORTED_CHAIN[item]) {
          chainDetails.push({
            key: item,
            ...config.WALLET_CONNECT_SUPPORTED_CHAIN[item],
          });
        } else {
          isValidChainLocal = false;
        }
      });
      let optionalChain = [];
      optionalNamespacesValue.forEach(
        item => (optionalChain = optionalChain.concat(item.chains)),
      );
      optionalChain.forEach(item => {
        if (config.WALLET_CONNECT_SUPPORTED_CHAIN[item]) {
          chainDetails.push({
            key: item,
            ...config.WALLET_CONNECT_SUPPORTED_CHAIN[item],
          });
        }
      });
      let finalData = [];
      chainDetails.forEach(chain => {
        if (
          !finalData.find(
            item =>
              item.symbol === chain.symbol &&
              item.chain_name === chain.chain_name,
          )
        ) {
          const foundCoin = allCoins.find(
            item =>
              item.symbol === chain.symbol &&
              item.chain_name === chain.chain_name,
          );
          if (foundCoin) {
            finalData.push({...chain, ...foundCoin});
          }
        }
      });
      setChainData(finalData);
      setIsValidChain(isValidChainLocal);
    }
  }, [requestData, allCoins]);

  const onPressApprove = async () => {
    try {
      navigation.pop();
      const connector = getWalletConnect();
      if (connector) {
        let namespaces = {};
        const requiredNamespacesKeys = Object.keys(requiredNamespaces);
        const optionalNamespacesKeys = Object.keys(optionalNamespaces);
        const allKeys = [
          ...new Set([...requiredNamespacesKeys, ...optionalNamespacesKeys]),
        ];
        allKeys.forEach(key => {
          let accounts = [];
          requiredNamespaces[key]?.chains?.map(chain => {
            const foundCoin = chainData?.find(item => item.key === chain);
            if (foundCoin?.address) {
              accounts.push(`${chain}:${foundCoin?.address}`);
            }
          });
          optionalNamespaces[key]?.chains?.map(chain => {
            const foundCoin = chainData?.find(item => item.key === chain);
            if (foundCoin?.address) {
              accounts.push(`${chain}:${foundCoin?.address}`);
            }
          });

          accounts = [...new Set(accounts)];
          const requiredMethods = Array.isArray(
            requiredNamespaces[key]?.methods,
          )
            ? requiredNamespaces[key]?.methods
            : [];
          const optionalMethods = Array.isArray(
            optionalNamespaces[key]?.methods,
          )
            ? optionalNamespaces[key]?.methods
            : [];
          const allMethods = [
            ...new Set([...requiredMethods, ...optionalMethods]),
          ];
          const requiredEvents = Array.isArray(requiredNamespaces[key]?.events)
            ? requiredNamespaces[key]?.events
            : [];
          const optionalEvents = Array.isArray(optionalNamespaces[key]?.events)
            ? optionalNamespaces[key]?.events
            : [];
          const allEvents = [
            ...new Set([...requiredEvents, ...optionalEvents]),
          ];
          namespaces[key] = {
            accounts,
            methods: allMethods,
            events: allEvents,
          };
        });
        const hasTon = allKeys.includes('ton');
        let tonSessionProperties = {};
        if (hasTon) {
          const tonCoinData = chainData.find(item => item.chain_name === 'ton');
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

        sessionId &&
          dispatch(setWalletConnectWalletData({[sessionId]: chainData}));
      }
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

  // const onChangeChain = useCallback(
  //     (item: any) => {
  //         setSelectedChain(item);
  //         //@ts-ignore
  //         setWalletAddresses(getData[item.name.toLowerCase()]);
  //         //@ts-ignore
  //         setSelectedWalletAddess(getData[item.name.toLowerCase()][0]);
  //     },
  //     [getData],
  // );
  //
  // const onChangeAddress = useCallback((item: any) => {
  //     setSelectedWalletAddess(item);
  // }, []);
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
            {item?.address}
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
        <View style={styles.bottomView}>
          {!isValidChain && (
            <Text style={styles.errorText}>
              {
                'You can only accept requests originating from ETH, BNB, SOL, MATIC, TRX, TON, XLM and/or XRP.'
              }
            </Text>
          )}
          <View style={styles.rowView}>
            <TouchableOpacity style={[styles.button]} onPress={onPressReject}>
              <Text style={styles.buttonTitle}>{'Reject'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!isValidChain}
              style={[
                styles.button,
                {
                  backgroundColor: !isValidChain
                    ? theme.gray
                    : theme.background,
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
