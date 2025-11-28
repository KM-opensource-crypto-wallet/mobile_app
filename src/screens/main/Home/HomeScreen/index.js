import React, {useState, useEffect, useContext, useRef} from 'react';
import {TouchableOpacity, View, Text} from 'react-native';
import myStyles from './HomeScreenStyles';
import {Portal, Provider} from 'react-native-paper';
import {ModalQR} from 'components/ModalQR';
import {useSelector, useDispatch, shallowEqual} from 'react-redux';
import isJson from 'dok-wallet-blockchain-networks/service/isJson';

import {ErrorBoundary} from 'react-error-boundary';
import {ThemeContext} from 'theme/ThemeContext';

import {
  foundCoinInCurrentWallet,
  getEthereumCoin,
  selectCurrentWallet,
  selectIsBackedUp,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {setCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {VerifyInfoModal} from 'components/VerifyInfo';
import {
  getNewsMessage,
  isAskedBackedUpModal,
} from 'dok-wallet-blockchain-networks/redux/currency/currencySelectors';
import {
  setIsAskedBackupModal,
  setNewsMessage,
  searchAndAddCoins,
} from 'dok-wallet-blockchain-networks/redux/currency/currencySlice';
import {
  selectRequestedModalVisible,
  selectTransactionModalVisible,
} from 'dok-wallet-blockchain-networks/redux/walletConnect/walletConnectSelectors';
import {
  triggerHapticFeedbackHeavy,
  triggerHapticFeedbackLight,
} from 'utils/hapticFeedback';
import QRCodeIcon from 'assets/images/sidebarIcons/QRCode.svg';
import BurgerMenuIcon from 'assets/images/sidebarIcons/BurgerMenu.svg';
import {MainNavigation} from 'utils/navigation';
import {TabView, TabBar, SceneMap} from 'react-native-tab-view';
import {IS_IOS, SCREEN_WIDTH} from 'utils/dimensions';
import Coins from 'components/Coins';
import NFTList from 'components/NFTList';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import NewsBottomSheet from 'components/NewsBottomSheet';
import MessageBubble from 'components/MessageBubble';
import {
  addConversation,
  addMessagesToConversation,
  getConversation,
  setSelectedConversation,
} from 'dok-wallet-blockchain-networks/redux/messages/messageSlice';
import {XMTP} from 'utils/xmtp';
import {showToast} from 'utils/toast';
import {getCustomizePublicAddress} from 'dok-wallet-blockchain-networks/helper';
import {
  getConversationName,
  getConversations,
  getSelectedConversations,
} from 'dok-wallet-blockchain-networks/redux/messages/messageSelector';
import {setPaymentData} from 'dok-wallet-blockchain-networks/redux/extraData/extraDataSlice';
import {
  getIsWalletConnectInitialized,
  getPaymentData,
  getWCUri,
} from 'dok-wallet-blockchain-networks/redux/extraData/extraSelectors';
import {isChatOptions} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import {createWalletConnection} from 'dok-wallet-blockchain-networks/service/walletconnect';
import {IS_KIML_WALLET, LOGO_SINGLE, LOGO_SINGLE_DARK} from 'utils/wlData';
import AddCoins from 'components/AddCoins';

const renderScene = SceneMap({
  coins: Coins,
  nftlist: NFTList,
});

const RenderTabBar = props => {
  const {styles} = props;
  return (
    <TabBar
      {...props}
      indicatorStyle={styles.indicatorStyle}
      style={styles.tabBarStyle}
      labelStyle={styles.tabBarFontStyle}
    />
  );
};

const HomeScreen = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();
  const [modalVisible, setmodalVisible] = useState(false);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [addCoinModalVisible, setAddCoinModalVisible] = useState(false);
  // const allCoins = useSelector(getAllCoins);
  const requestedModalVisible = useSelector(selectRequestedModalVisible);
  const transactionModalVisible = useSelector(selectTransactionModalVisible);
  const selectedConversation = useSelector(
    getSelectedConversations,
    shallowEqual,
  );
  const conversations = useSelector(getConversations, shallowEqual);
  const ethereumCoin = useSelector(getEthereumCoin, shallowEqual);
  const isBackup = useSelector(selectIsBackedUp);
  const isChatOptionsEnabled = useSelector(isChatOptions);
  const currentWallet = useSelector(selectCurrentWallet);
  const isAskedBackup = useSelector(isAskedBackedUpModal);
  const newsMessage = useSelector(getNewsMessage);
  const paymentData = useSelector(getPaymentData);
  const isWalletConnectInitialized = useSelector(getIsWalletConnectInitialized);
  const wcUri = useSelector(getWCUri);
  const conversationName = useSelector(getConversationName);

  const newsBottomSheetRef = useRef();
  const selectedTopicRef = useRef();
  const conversationsRef = useRef([]);
  const showModal = route.params?.showModal;
  const qrAddress = route.params?.qrAddress;
  const qrScheme = route.params?.qrScheme;
  const qrAmount = route.params?.qrAmount;
  const newDateToString = route.params?.newDateToString;
  const [routes] = React.useState(
    IS_IOS && IS_KIML_WALLET
      ? [{key: 'coins', title: 'Coins'}]
      : [
          {key: 'coins', title: 'Coins'},
          {key: 'nftlist', title: 'NFT'},
        ],
  );
  const [index, setIndex] = React.useState(0);
  const currentEthereumAddress = useRef(null);
  const messageProccessed = useRef({});
  const conversationNameRef = useRef(conversationName);

  useEffect(() => {
    selectedTopicRef.current = selectedConversation?.topic;
  }, [selectedConversation?.topic]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    conversationNameRef.current = conversationName;
  }, [conversationName]);

  useEffect(() => {
    if (wcUri && isWalletConnectInitialized) {
      createWalletConnection({uri: wcUri});
    }
  }, [wcUri, isWalletConnectInitialized]);

  useEffect(() => {
    setAddCoinModalVisible(false);
    if (paymentData?.address && paymentData?.currency) {
      setAddCoinModalVisible(true);
      dispatch(searchAndAddCoins({currency: paymentData?.currency}))
        .unwrap()
        .then(data => {
          if (data?.coinId) {
            dispatch(setCurrentCoin(data?.coinId));
          }
          setAddCoinModalVisible(false);
          setTimeout(() => {
            navigation.navigate('SendFunds', {
              ...paymentData,
              amount: paymentData?.amount,
              address: paymentData?.address,
              memo: paymentData?.memo,
              date: new Date().toISOString(),
            });
            dispatch(setPaymentData(null));
          }, 0);
        })
        .catch(err => {
          console.error('Failed to searchAndAddCoins:', err);
          setAddCoinModalVisible(true);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentData]);

  useEffect(() => {
    if (requestedModalVisible) {
      triggerHapticFeedbackHeavy();
      navigation.navigate('WalletConnectRequestModal');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedModalVisible]);
  useEffect(() => {
    if (transactionModalVisible) {
      triggerHapticFeedbackHeavy();
      navigation.navigate('WalletConnectTransactionModal');
    } else if (
      !transactionModalVisible &&
      MainNavigation?.getCurrentRouteName() === 'WalletConnectTransactionModal'
    ) {
      navigation.goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionModalVisible]);

  useEffect(() => {
    if (!isChatOptionsEnabled && ethereumCoin?.address) {
      XMTP.unSubscribeStream();
    }
    currentEthereumAddress.current = ethereumCoin?.address;

    if (isChatOptionsEnabled && ethereumCoin?.address) {
      dispatch(getConversation())
        .unwrap()
        .then(async () => {
          const client = XMTP.getClient();

          const onMessageReceived = message => {
            if (messageProccessed.current[message?.id]) {
              return;
            }
            messageProccessed.current[message?.id] = true;
            const topic = message.topic;
            const address = currentEthereumAddress.current;
            const formattedMessages = XMTP.formatMessage([message]);
            dispatch(
              addMessagesToConversation({
                topic,
                messages: formattedMessages,
                address,
              }),
            );
            if (
              address !== message.senderAddress &&
              !!conversationsRef.current?.find(
                item =>
                  item?.topic === topic && item?.consentState !== 'denied',
              ) &&
              (MainNavigation?.getCurrentRouteName() !== 'Message' ||
                (MainNavigation?.getCurrentRouteName() === 'Message' &&
                  selectedTopicRef.current !== topic))
            ) {
              const peerAddress = message.senderAddress;
              const title =
                conversationNameRef.current &&
                Object.prototype.hasOwnProperty.call(
                  conversationNameRef.current,
                  peerAddress,
                )
                  ? conversationNameRef.current[peerAddress]
                  : getCustomizePublicAddress(peerAddress);
              showToast({
                type: 'messageToast',
                title,
                message: message.content(),
                position: 'top',
                onPress: () => {
                  dispatch(
                    setSelectedConversation({
                      address: address,
                      topic: topic,
                    }),
                  );
                  navigation.navigate('Message');
                },
              });
            }
          };
          const onNewConversation = async conversation => {
            const topic = conversation.topic;
            const address = currentEthereumAddress.current;
            const formattedConversation = await XMTP.formatConversation([
              conversation,
            ]);
            dispatch(
              addConversation({
                topic,
                conversationData: formattedConversation[0],
                address,
              }),
            );
          };
          await client.conversations.streamAllMessages(onMessageReceived);
          await client.conversations.stream(onNewConversation);
        });
    }
    return () => {
      if (isChatOptionsEnabled) {
        XMTP.unSubscribeStream();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChatOptionsEnabled, ethereumCoin?.address]);

  useEffect(() => {
    if (!isBackup && !isAskedBackup[currentWallet?.walletName]) {
      setTimeout(() => setBackupModalVisible(true), 1000);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setmodalVisible(showModal || false);
  }, [newDateToString, showModal]);

  useEffect(() => {
    if (qrAddress && qrScheme) {
      const foundCoin = foundCoinInCurrentWallet(currentWallet, qrScheme);
      if (foundCoin !== null) {
        dispatch(setCurrentCoin(foundCoin?._id));
        setTimeout(() => {
          navigation.navigate('SendFunds', {qrAddress, qrAmount});
        }, 500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newDateToString, qrAddress, qrScheme, qrAmount]);

  return (
    <>
      <ErrorBoundary
        fallbackRender={() => (
          <View>
            <Text>Something went wrong in HomeScreen</Text>
            {/* <Button title="Try again" onPress={resetErrorBoundary} /> */}
          </View>
        )}>
        <Provider>
          <Portal>
            <DokSafeAreaView style={styles.container}>
              <View style={styles.container}>
                {!!ethereumCoin?.address && isChatOptionsEnabled && (
                  <MessageBubble />
                )}
                <View style={styles.navigationHeader}>
                  <TouchableOpacity
                    activeOpacity={1}
                    hitSlop={{top: 12, left: 12, right: 12, bottom: 12}}
                    onPress={() => {
                      navigation.toggleDrawer();
                    }}>
                    <BurgerMenuIcon
                      width="22"
                      height="18"
                      fill={theme.borderActiveColor}
                    />
                  </TouchableOpacity>
                  <View style={styles.rowFlex}>
                    {theme.backgroundColor === '#121212' ? (
                      <LOGO_SINGLE_DARK width={40} height={40} />
                    ) : (
                      <LOGO_SINGLE width={40} height={40} />
                    )}
                    <TouchableOpacity
                      onPress={() => {
                        Clipboard.setString(currentWallet?.walletName);
                        triggerHapticFeedbackLight();
                        Toast.show({
                          type: 'successToast',
                          text1: 'copied',
                        });
                      }}
                      activeOpacity={0.6}>
                      <Text style={styles.mainTitle} numberOfLines={1}>
                        {currentWallet?.walletName}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    hitSlop={{top: 12, left: 12, right: 12, bottom: 12}}
                    activeOpacity={1}
                    onPress={() =>
                      navigation.navigate('Scanner', {
                        page: 'Home',
                        walletConnect: true,
                      })
                    }>
                    <QRCodeIcon fill={theme.background} />
                  </TouchableOpacity>
                </View>
                {!!newsMessage && (
                  <View style={styles.syncView}>
                    <Text style={styles.syncTitle} numberOfLines={2}>
                      {'Important News!'}
                    </Text>
                    <TouchableOpacity
                      style={styles.syncButton}
                      onPress={() => {
                        newsBottomSheetRef?.current?.close();
                        newsBottomSheetRef?.current?.present();
                      }}>
                      <Text style={styles.syncButtonTitle}>{'View'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        dispatch(setNewsMessage(''));
                      }}>
                      <MaterialCommunityIcons
                        name={'close'}
                        size={24}
                        color={theme.font}
                      />
                    </TouchableOpacity>
                  </View>
                )}
                <TabView
                  navigationState={{index, routes}}
                  renderScene={renderScene}
                  onIndexChange={setIndex}
                  initialLayout={{width: SCREEN_WIDTH}}
                  renderTabBar={props => (
                    <RenderTabBar {...props} styles={styles} />
                  )}
                  lazy={true}
                />
              </View>
            </DokSafeAreaView>
            <ModalQR
              visible={modalVisible}
              hideModal={setmodalVisible}
              data={
                route?.params?.data
                  ? isJson(route?.params?.data)
                    ? JSON.parse(route?.params?.data).address
                    : ''
                  : route?.params?.data
              }
              qrScheme={qrScheme}
            />
            <NewsBottomSheet
              onDismiss={() => {
                newsBottomSheetRef?.current?.close();
              }}
              bottomSheetRef={ref => (newsBottomSheetRef.current = ref)}
              message={newsMessage}
            />
            {addCoinModalVisible && (
              <AddCoins
                visible={addCoinModalVisible}
                hideModal={setAddCoinModalVisible}
              />
            )}
          </Portal>
        </Provider>
      </ErrorBoundary>
      {!requestedModalVisible && !transactionModalVisible && (
        <VerifyInfoModal
          visible={backupModalVisible}
          onClose={() => {
            setBackupModalVisible(false);
            dispatch(setIsAskedBackupModal(currentWallet?.walletName));
          }}
        />
      )}
    </>
  );
};
export default HomeScreen;
