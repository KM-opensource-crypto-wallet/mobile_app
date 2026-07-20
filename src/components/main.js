import BootSplash from 'react-native-bootsplash';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {Platform, Linking, Text, TextInput, StatusBar} from 'react-native';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {useRoute} from 'routers/router';
import {
  getLoading,
  getUserPassword,
} from 'dok-wallet-blockchain-networks/redux/auth/authSelectors';
import Spinner from 'components/Spinner';
import {MainNavigation} from 'utils/navigation';
import {
  checkNewsAvailable,
  fetchCurrencies,
} from 'dok-wallet-blockchain-networks/redux/currency/currencySlice';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {initWalletConnect} from 'dok-wallet-blockchain-networks/service/walletconnect';
import {AppLifecycle} from 'react-native-applifecycle';
import {
  addMinutes,
  isAfterCurrentDate,
  isNewerVersion,
  safelyJsonParse,
} from 'dok-wallet-blockchain-networks/helper';
import {getLockTime} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {
  createClientIdIfNotExist,
  createIfNotExistsMasterClientId,
  rehideWalletsOnBackground,
  reassignCurrentWalletIfHidden,
  resetCoinsToDefaultAddressForPrivacyMode,
  resetNfts,
  setCurrentCoin,
  setCurrentWalletIndex,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {
  _currentWalletIndexSelector,
  isWalletHiddenAndLocked,
  selectAllWallets,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {store} from 'redux/store';
import {
  setupOneSignal,
  initOneSignal,
  addNotificationClickListener,
  removeNotificationClickListener,
} from 'utils/onesignal';
import {isReduxStoreLoaded} from 'dok-wallet-blockchain-networks/redux/walletConnect/walletConnectSelectors';
import {selectWalletConnectSessions} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {clearWalletConnectStorageCache} from 'utils/asyncStorage';
import LoginModal from 'components/LoginModal';
import {fetchRPCUrl} from 'dok-wallet-blockchain-networks/rpcUrls/rpcUrls';
import {
  fetchSupportedBuyCryptoCurrency,
  setCountry,
} from 'dok-wallet-blockchain-networks/redux/cryptoProviders/cryptoProviderSlice';
import {
  getBuildNumber,
  getBundleId,
  getVersion,
} from 'react-native-device-info';
import {IS_ANDROID, IS_IOS} from 'utils/dimensions';
import {consumeExpectedBackground} from 'utils/expectedBackground';
import {isInAppBrowserSessionActive} from 'utils/inAppBrowser';
import {getCountry} from 'react-native-localize';
import {MenuProvider} from 'react-native-popup-menu';
import {
  getQueryParams,
  parseUrlQS,
  validatePaymentUrl,
  validateWCUrl,
} from 'utils/common';
import {
  setIsUpdateAvailable,
  setIsWalletConnectInitialized,
  setPaymentData,
  setRouteStateData,
  setWcUri,
} from 'dok-wallet-blockchain-networks/redux/extraData/extraDataSlice';
import {checkNotifications, RESULTS} from 'react-native-permissions';
import ModalAppUpdate from 'components/ModalAppUpdates';
import dayjs from 'dayjs';
import axios from 'axios';
import {isTestFlight} from 'react-native-test-flight';
import {setAdjustPan} from 'rn-android-keyboard-adjust';
import {
  getAndroidLatestVersion,
  getDisableMessage,
} from 'dok-wallet-blockchain-networks/redux/cryptoProviders/cryptoProvidersSelectors';
import DisableComponent from 'components/DisableComponent';
import {getLastUpdateCheckTimestamp} from 'dok-wallet-blockchain-networks/redux/auth/authSelectors';
import {setLastUpdateCheckTimestamp} from 'dok-wallet-blockchain-networks/redux/auth/authSlice';
import {getFeesInfo} from 'dok-wallet-blockchain-networks/feesInfo/feesInfo';
import {IS_KIML_WALLET, WALLET_CONNECT_DATA} from 'utils/wlData';
import {ThemeContext} from 'theme/ThemeContext';
import ModalApkDownload from 'components/ModalApkDownload';
import {SafeAreaView} from 'react-native-safe-area-context';
import CoinSyncWidget from 'components/CoinSyncWidget';

// Only truly pre-auth screens belong here. Screens whose buttons redirect
// outside the app (in-app browser, Linking, permission dialogs) are handled
// by the click-driven self-initiated-background suppression in the AppState
// listener instead of a blanket route exclusion, so a genuine background on
// them still locks the app.
const unsecureRoute = ['CarouselCards', 'Registration'];

let lastCallTimeStamp;

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;

const Main = () => {
  // persistor.purge();
  // const localCurrency = useSelector(getLocalCurrency);
  // const newKey = useSelector(getNewKey);
  // const totalWallets = useSelector(getTotalWallets);
  // const currentWallet = useSelector(getCurrentWallet);
  // const allCoins = useSelector(getAllCoins);
  // const allWallets = useSelector(getWallets);
  // const currentWalletName = useSelector(getWalletName);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const navigationRef = React.useRef();
  const isLoading = useSelector(getLoading);
  const dispatch = useDispatch();
  const storePassword = useSelector(getUserPassword);
  const lockTime = useSelector(getLockTime);
  const isReduxStoreLoad = useSelector(isReduxStoreLoaded);
  const kimlWalletLatestVersion = useSelector(getAndroidLatestVersion);
  const walletConnectSessions = useSelector(
    selectWalletConnectSessions,
    shallowEqual,
  );
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  // const phrase = useSelector(getWalletPhrase);
  const routing = useRoute(storePassword);
  const appState = useRef(AppLifecycle.currentState);
  const lockTimeSet = useRef(null);
  const lockTimeRef = useRef(lockTime);
  const lastBackgroundSelfInitiated = useRef(false);
  const compareRpcUrlsIntervalRef = useRef(null);
  const disableMessage = useSelector(getDisableMessage);
  const lastUpdateCheckTimestamp = useSelector(getLastUpdateCheckTimestamp);
  const [pendingNotificationData, setPendingNotificationData] = useState(null);

  const fetchAndCompareRpcUrls = useCallback(() => {
    fetchRPCUrl();
    compareRpcUrlsIntervalRef.current = setInterval(() => {
      fetchRPCUrl();
    }, 1000 * 60 * 10);
  }, []);

  const fetchFeesInfo = useCallback(() => {
    getFeesInfo().then(_ => {});
  }, []);

  const initializeWalletConnect = useCallback(async () => {
    try {
      if (!Object.keys(walletConnectSessions).length) {
        await clearWalletConnectStorageCache();
      }
      await initWalletConnect(WALLET_CONNECT_DATA);
      dispatch(setIsWalletConnectInitialized(true));
    } catch (e) {
      console.error('Error in initialize WalletConnect');
    }
  }, [dispatch, walletConnectSessions]);

  const getInitialUrlLink = async () => {
    try {
      const url = await Linking.getInitialURL();
      const qsObj = parseUrlQS(url);
      if (validateWCUrl(url, qsObj)) {
        dispatch(setWcUri(decodeURIComponent(qsObj?.uri)));
      } else if (validatePaymentUrl(url, qsObj)) {
        const currentDate = new Date().toISOString();
        const data = getQueryParams(url);
        dispatch(
          setPaymentData({
            ...data,
            meta: safelyJsonParse(data?.meta) || null,
            date: currentDate,
          }),
        );
      }
    } catch (e) {
      console.warn('error in getInitialUrlLink', e);
    }
  };

  const getLiveVersion = useCallback(async () => {
    try {
      let latestVersion = '';
      if (IS_IOS) {
        const resp = await axios.get(
          `https://itunes.apple.com/lookup?bundleId=${getBundleId()}`,
        );
        latestVersion = resp.data?.results?.[0]?.version;
      } else if (IS_ANDROID) {
        const playstore = await axios.get(
          `https://play.google.com/store/apps/details?id=${getBundleId()}&hl=en`,
        );
        const data = playstore.data;
        latestVersion = data.match(/Current Version.+?>([\d.-]+)<\/span>/);
        if (!latestVersion) {
          const matchNewLayout = data.match(/\[\[\["([\d-.]+?)"]]/);
          latestVersion = matchNewLayout[1].trim();
        }
      }
      return latestVersion;
    } catch (e) {
      console.error('Error in fetching latest version', e);
      throw e;
    }
  }, []);
  const checkInAppUpdates = async isAppLaunched => {
    const isDevelopmentOrTestFlight = __DEV__ || isTestFlight;
    const hasRecentUpdateCheck =
      lastUpdateCheckTimestamp &&
      dayjs().diff(dayjs(lastUpdateCheckTimestamp), 'minutes') <= 10;
    const hasRecentCallWhenNotLaunched =
      lastCallTimeStamp &&
      dayjs().diff(dayjs(lastCallTimeStamp), 'minutes') <= 60;

    if (
      !isDevelopmentOrTestFlight &&
      ((isAppLaunched && !hasRecentUpdateCheck) ||
        (!isAppLaunched && !hasRecentCallWhenNotLaunched))
    ) {
      console.log('checking');
      try {
        lastCallTimeStamp = new Date();
        if (isAppLaunched) {
          dispatch(setLastUpdateCheckTimestamp(new Date()));
        }
        const liveVersion =
          IS_ANDROID && IS_KIML_WALLET
            ? kimlWalletLatestVersion
            : await getLiveVersion();
        if (!liveVersion) {
          dispatch(setIsUpdateAvailable('no'));
          return;
        }
        const currentVersion = getVersion();
        if (isNewerVersion(liveVersion, currentVersion)) {
          setShowUpdateModal(true);
        } else {
          dispatch(setIsUpdateAvailable('no'));
        }
      } catch (e) {
        console.error('Error in check in app updates', e);
      }
    } else {
      dispatch(setIsUpdateAvailable('no'));
    }
  };

  useEffect(() => {
    if (IS_KIML_WALLET && IS_ANDROID && kimlWalletLatestVersion) {
      checkInAppUpdates(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kimlWalletLatestVersion]);

  useEffect(() => {
    let unsubscribe = null;
    if (IS_ANDROID) {
      setAdjustPan();
    }
    if (isReduxStoreLoad) {
      BootSplash.hide({fade: true});
      if (!IS_KIML_WALLET || !IS_ANDROID) {
        checkInAppUpdates(true);
      }
      getInitialUrlLink();
      dispatch(createIfNotExistsMasterClientId());
      dispatch(createClientIdIfNotExist());
      dispatch(resetCoinsToDefaultAddressForPrivacyMode());
      dispatch(reassignCurrentWalletIfHidden());
      const onUrlGet = event => {
        try {
          const url = event.url;
          const qsObj = parseUrlQS(url);
          if (validateWCUrl(url, qsObj)) {
            dispatch(setWcUri(decodeURIComponent(qsObj?.uri)));
          } else if (validatePaymentUrl(url, qsObj)) {
            const currentDate = new Date().toISOString();
            const data = getQueryParams(url);
            navigationRef.current?.navigate('Home');
            dispatch(
              setPaymentData({
                ...data,
                meta: safelyJsonParse(data?.meta) || null,
                date: currentDate,
              }),
            );
          }
        } catch (e) {
          console.warn('error in getInitialUrlLink', e);
        }
      };
      unsubscribe = Linking.addEventListener('url', onUrlGet);
      const key = `${
        IS_IOS ? 'ios' : 'android'
      }_${getVersion()}_${getBuildNumber()}`;
      dispatch(checkNewsAvailable({key}));
      initializeWalletConnect();
    }
    return () => {
      unsubscribe?.remove && unsubscribe.remove();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReduxStoreLoad]);

  useEffect(() => {
    const fromDevice = Platform.OS;
    const country = getCountry();
    dispatch(setCountry(country));
    dispatch(fetchSupportedBuyCryptoCurrency({fromDevice, country}));
    fetchAndCompareRpcUrls();
    fetchFeesInfo();
    dispatch(fetchCurrencies({checkNewCoins: true, ignoreLimit: true}));
    setTimeout(() => {
      dispatch(resetNfts({}));
    }, 2000);
    return () => {
      clearInterval(compareRpcUrlsIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    lockTimeRef.current = lockTime;
  }, [lockTime]);

  useEffect(() => {
    const subscription = AppLifecycle.addEventListener(
      'change',
      nextAppState => {
        const currentRouteName =
          navigationRef?.current?.getCurrentRoute?.()?.name || '';
        console.log('current  state ->', appState.current);
        console.log('current app state ->', currentRouteName, nextAppState);
        if (appState.current.match(/background/) && nextAppState === 'active') {
          if (
            currentRouteName !== 'Login' &&
            !unsecureRoute.includes(currentRouteName) &&
            !lastBackgroundSelfInitiated.current &&
            isAfterCurrentDate(lockTimeSet.current)
          ) {
            setLoginModalVisible(true);
          }
          // One-shot: the next background decides again.
          lastBackgroundSelfInitiated.current = false;
          checkInAppUpdates();
          fetchRPCUrl();
          fetchFeesInfo();
        } else if (nextAppState === 'background') {
          // consumeExpectedBackground() must run unconditionally so a
          // one-shot mark (Linking flows) is always cleared here.
          const isSelfInitiatedBackground =
            consumeExpectedBackground() || isInAppBrowserSessionActive();
          lastBackgroundSelfInitiated.current = isSelfInitiatedBackground;
          if (!isSelfInitiatedBackground) {
            const walletIndexBeforeRehide = _currentWalletIndexSelector(
              store.getState(),
            );
            dispatch(rehideWalletsOnBackground());
            const walletIndexAfterRehide = _currentWalletIndexSelector(
              store.getState(),
            );

            if (walletIndexAfterRehide !== walletIndexBeforeRehide) {
              MainNavigation.reset({
                index: 0,
                routes: [{name: 'Sidebar'}],
              });
            }
          }
          // Arming the login modal here (while still backgrounding) used to
          // race the in-app browser's own native modal presentation/dismissal,
          // leaving the app unresponsive to touches after returning from it
          // (most visible from TransactionDetails' "View on Explorer"). The
          // `active` branch's isAfterCurrentDate check already re-arms it
          // safely once the transition is fully settled, so lockTime === 0
          // doesn't need a separate pre-arm here.
          lockTimeSet.current = addMinutes(lockTimeRef.current).toISOString();
        }
        appState.current = nextAppState;
      },
    );
    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleNotificationData = useCallback(
    data => {
      if (!data?.chainName || !data?.coin) {
        return;
      }
      const wallets = selectAllWallets(store.getState());
      const walletIndex = data.walletId
        ? wallets.findIndex(w => w.clientId === data.walletId)
        : wallets.findIndex(w =>
            w.coins?.some(
              c =>
                c.chain_name === data.chainName &&
                c.symbol === data.coin &&
                c.isInWallet,
            ),
          );
      if (walletIndex === -1) {
        return;
      }
      if (isWalletHiddenAndLocked(wallets[walletIndex])) {
        return;
      }
      const coin = wallets[walletIndex].coins?.find(
        c =>
          c.chain_name === data.chainName &&
          c.symbol === data.coin &&
          c.isInWallet,
      );
      if (!coin) {
        return;
      }
      dispatch(setCurrentWalletIndex(walletIndex));
      dispatch(setCurrentCoin(coin._id));
      dispatch(setRouteStateData({navigateToTransactionList: true}));
      MainNavigation.reset({
        index: 0,
        routes: [{name: 'Sidebar'}],
      });
    },
    [dispatch],
  );

  const onNotificationClick = useCallback(event => {
    const data = event?.notification?.additionalData;
    if (!data?.chainName || !data?.coin) {
      return;
    }
    // Store notification data and show login modal
    setPendingNotificationData(data);
    setLoginModalVisible(true);
  }, []);

  const handleNotificationLoginSuccess = useCallback(() => {
    if (pendingNotificationData) {
      handleNotificationData(pendingNotificationData);
      setPendingNotificationData(null);
    }
    setLoginModalVisible(false);
  }, [pendingNotificationData, handleNotificationData]);

  useEffect(() => {
    setupOneSignal();
    checkNotifications().then(({status}) => {
      if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
        initOneSignal();
      }
    });
    addNotificationClickListener(onNotificationClick);
    return () => {
      removeNotificationClickListener(onNotificationClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {theme} = useContext(ThemeContext);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <StatusBar
        backgroundColor={theme.backgroundColor}
        barStyle={
          theme.backgroundColor === '#121212' ? 'light-content' : 'dark-content'
        }
      />
      {disableMessage ? (
        <DisableComponent />
      ) : (
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            MainNavigation.setNavigationObject(navigationRef.current);
          }}>
          <MenuProvider SafeAreaComponent={SafeAreaView}>
            <BottomSheetModalProvider>{routing}</BottomSheetModalProvider>
            {(!IS_KIML_WALLET || !IS_ANDROID) && (
              <ModalAppUpdate visible={showUpdateModal} />
            )}
            {IS_KIML_WALLET && IS_ANDROID && (
              <ModalApkDownload visible={showUpdateModal} />
            )}
          </MenuProvider>
          <LoginModal
            visible={loginModalVisible}
            onClose={() => {
              if (pendingNotificationData) {
                handleNotificationLoginSuccess();
              } else {
                setLoginModalVisible(false);
              }
            }}
          />
        </NavigationContainer>
      )}
      {/*<Delete />*/}
      <CoinSyncWidget />
      {isLoading && <Spinner />}
    </GestureHandlerRootView>
  );
};

export default Main;
