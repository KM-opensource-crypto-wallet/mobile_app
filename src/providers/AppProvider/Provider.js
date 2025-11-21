import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { NavigationContainer } from "@react-navigation/native";
import axios from "axios";
import DisableComponent from "components/DisableComponent";
import ModalApkDownload from "components/ModalApkDownload";
import ModalAppUpdate from "components/ModalAppUpdates";
import Spinner from "components/Spinner";
import { getLoading } from "dok-wallet-blockchain-networks/redux/auth/authSelectors";
import { getLastUpdateCheckTimestamp } from "dok-wallet-blockchain-networks/redux/auth/authSelectors";
import { getUserPassword } from "dok-wallet-blockchain-networks/redux/auth/authSelectors";
import { setLastUpdateCheckTimestamp } from "dok-wallet-blockchain-networks/redux/auth/authSlice";
import { getAndroidLatestVersion } from "dok-wallet-blockchain-networks/redux/cryptoProviders/cryptoProvidersSelectors";
import { getDisableMessage } from "dok-wallet-blockchain-networks/redux/cryptoProviders/cryptoProvidersSelectors";
import { setIsUpdateAvailable } from "dok-wallet-blockchain-networks/redux/extraData/extraDataSlice";
import { useThemeContext } from "hooks/useThemeContext";
import { createContext } from "react";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MenuProvider } from "react-native-popup-menu";
import { isTestFlight } from "react-native-test-flight";
import { useSelector } from "react-redux";
import { IS_ANDROID, IS_IOS } from "utils/dimensions";
import { MainNavigation } from "utils/navigation";
import { IS_KIML_WALLET } from "utils/wlData";

export const AppContext = createContext();
export const AppProvider = ({ children }) => {
    let lastCallTimeStamp;
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const navigationRef = React.useRef();
    const dispatch = useDispatch();
    const routing = useRoute(storePassword);
    const { theme } = useThemeContext();

    const barStyle = theme.backgroundColor === '#121212' ? 'light-content' : 'dark-content';
    const {
        storePassword,
        kimlWalletLatestVersion,
        isLoading,
        disableMessage,
        lastUpdateCheckTimestamp,
    } = useSelector(
        state => ({
            storePassword: getUserPassword(state),
            // lockTime: getLockTime(state),
            // isReduxStoreLoad: isReduxStoreLoaded(state),
            kimlWalletLatestVersion: getAndroidLatestVersion(state),
            // walletConnectSessions: selectWalletConnectSessions(state),
            isLoading: getLoading(state),
            disableMessage: getDisableMessage(state),
            lastUpdateCheckTimestamp: getLastUpdateCheckTimestamp(state)
        }),
        shallowEqual
    );

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
    return (
        <AppContext.Provider value={{}}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <StatusBar
                    backgroundColor={theme.backgroundColor}
                    barStyle={barStyle}
                />
                {disableMessage ? (
                    <DisableComponent />
                ) : (
                    <NavigationContainer
                        ref={navigationRef}
                        onReady={() => {
                            MainNavigation.setNavigationObject(navigationRef.current);
                        }}>
                        <MenuProvider>
                            <BottomSheetModalProvider>{routing}</BottomSheetModalProvider>
                            {(!IS_KIML_WALLET || !IS_ANDROID) && (
                                <ModalAppUpdate visible={showUpdateModal} />
                            )}
                            {IS_KIML_WALLET && IS_ANDROID && (
                                <ModalApkDownload visible={showUpdateModal} />
                            )}
                        </MenuProvider>
                        {children}
                    </NavigationContainer>
                )}
                {isLoading && <Spinner />}
            </GestureHandlerRootView>
        </AppContext.Provider>
    );
}