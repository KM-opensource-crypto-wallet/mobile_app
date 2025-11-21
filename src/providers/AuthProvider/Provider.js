import { useThemeContext } from "hooks/useThemeContext";
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createContext } from "react"
import { CarouselCards } from "components/CarouselCards";
import { RegistrationScreen } from "screens/auth/RegistrationScreen";
import { LoginScreen } from "screens/auth/LoginScreen";
import { Learn } from "components/VerifyInfo/Learn";
import { VerifyCreate } from "components/VerifyCreate";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Icons } from '../../assets/images'
import { SCREEN_WIDTH } from "utils/dimensions";
import Scanner from "screens/main/Scanner";
import ForwardMessage from "components/ForwardMessage";
import WalletConnectTransactionModal from "components/WalletConnectTransactionModal";
import WalletConnectRequestModal from "components/WalletConnectRequestModal";
import ImportWalletByPrivateKey from "screens/main/ResetWallet/ImportWalletByPrivateKey";
import ImportWallet from "screens/main/ResetWallet/ImportWallet";
import LearnReset from "screens/main/ResetWallet/LearnReset";
import ResetWallet from "screens/main/ResetWallet";
import SortTransactions from "components/SortTransactions";
import RecieveFunds from "screens/main/Home/RecieveFunds";
import Transfer from "screens/main/Home/Transfer";
import SendFunds from "screens/main/Home/SendFunds";
import SendNFT from "screens/main/Home/SendNFT";
import WithdrawStaking from "screens/main/Home/WithdrawStaking";
import VoteStaking from "screens/main/Home/VoteStaking";
import CreateStaking from "screens/main/Home/CreateStaking";
import StakingList from "screens/main/Home/StakingList";
import UpdateTransaction from "screens/main/Home/UpdateTransaction";
import TransactionList from "screens/main/Home/TransactionList";
import { CustomDerivation } from "screens/main/Home/CustomDerivation";
import SelectUTXOsScreen from "screens/main/Home/SelectUTXOsScreen";
import SendScreen from "screens/main/Home/SendScreen";
import EditConversation from "screens/main/Home/EditConversation";
import NewMessage from "screens/main/Home/NewMessage";
import Message from "screens/main/Home/Message";
import MessageList from "screens/main/Home/MessageList";
import ManageCoins from "screens/main/Home/ManageCoins";
import BlockedConversations from "screens/main/Settings/BlockedConvervastions";
import PrivacyMode from "screens/main/Settings/PrivacyMode";
import EVMWalletDerivation from "screens/main/Settings/EVMWalletDerivation";
import { VerifyLoginScreen } from "screens/auth/VerifyLoginScreen";
import ChangePassword from "screens/auth/ChangePassword";
import Notifications from "screens/main/Settings/Notifications";
import AddAddress from "screens/main/Settings/AddressBook/AddAddress";
import AddressBook from "components/AddressBook";
import AutoLock from "screens/main/Settings/AutoLock";
import DisplayTheme from "screens/main/Settings/DisplayTheme";
import LocalCurrency from "screens/main/Settings/LocalCurrency";
import { OTC2Screen } from "screens/main/BuyCrypto/OTC2Screen";
import { OTCScreen } from "screens/main/BuyCrypto/OTCScreen";
import SellCrypto from "screens/main/SellCrypto";
import BuyCrypto from "screens/main/BuyCrypto";
import PrivacyPolicy from "screens/main/About/PrivacyPolicy";
import TermsConditions from "screens/main/About/TermsConditions";
import AboutApp from "screens/main/About/AboutApp";
import Sidebar from "components/Sidebar";
import CreateWallet from "screens/main/Wallets/CreateWallet";
import { Verify } from "components/Verify";

const Stack = createStackNavigator();
export const AuthContext = createContext();

const forFade = ({ current }) => ({
    cardStyle: {
        opacity: current.progress,
    },
});
// isAuth comes from StoredPassword
export const AuthProvider = ({ children }) => {
    const {
        storePassword,
        currentCoin,
    } = useSelector(
        state => ({
            storePassword: getUserPassword(state),
            currentCoin: selectCurrentCoin(state)
        }),
        shallowEqual
    );
    const isAuth = storePassword;
    const { theme } = useThemeContext();
    // {children}
    return (
        <AuthContext.Provider value={{}}>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        borderBottomColor: theme.headerBorder,
                        borderBottomWidth: 1,
                        backgroundColor: theme.backgroundColor,
                    },
                    headerTitleStyle: {
                        color: theme.borderActiveColor,
                    },
                    headerTitleAlign: 'center',
                }}>
                <Stack.Group screenOptions={{ headerShown: false }}>
                    {!isAuth && (
                        <>
                            <Stack.Screen name="CarouselCards" component={CarouselCards} />
                            <Stack.Screen name="Registration" component={RegistrationScreen} />
                        </>
                    )}
                    <Stack.Screen name="Login" component={LoginScreen} />
                </Stack.Group>
                <Stack.Group>
                    <Stack.Screen
                        name="Learn"
                        component={Learn}
                        options={({ navigation }) => ({
                            title: 'Learn more',
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="VerifyCreate"
                        component={VerifyCreate}
                        options={({ navigation }) => ({
                            title: 'Create',
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => {
                                        const routes = navigation.getState().routes?.length;
                                        if (routes === 3) {
                                            navigation.pop();
                                        }
                                        navigation.goBack();
                                    }}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="Verify"
                        component={Verify}
                        options={({ navigation }) => ({
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),

                            cardStyleInterpolator: forFade,
                        })}
                    />
                </Stack.Group>
                <Stack.Screen
                    name="Sidebar"
                    component={Sidebar}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="CreateWallet"
                    component={CreateWallet}
                    options={({ navigation }) => ({
                        headerStyle: {
                            borderBottomColor: theme.headerBorder,
                            borderBottomWidth: 1,
                            backgroundColor: theme.backgroundColor,
                        },
                        headerTitleStyle: {
                            color: theme.borderActiveColor,
                        },
                        title: 'Create Wallet',
                        headerLeft: () => (
                            <TouchableOpacity
                                style={styles.headerLeftStyle}
                                onPress={() => navigation.goBack()}>
                                <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                            </TouchableOpacity>
                        ),
                        cardStyleInterpolator: forFade,
                    })}
                />
                <Stack.Group>
                    <Stack.Screen
                        name="About App"
                        component={AboutApp}
                        options={({ navigation }) => ({
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="Terms & Conditions"
                        component={TermsConditions}
                        options={({ navigation }) => ({
                            title: 'Terms of Use',

                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="Privacy Policy"
                        component={PrivacyPolicy}
                        options={({ navigation }) => ({
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                </Stack.Group>
                <Stack.Screen
                    name="iOSBuyCrypto"
                    component={BuyCrypto}
                    options={({ navigation }) => ({
                        title: 'Buy Crypto',
                        headerStyle: {
                            borderBottomColor: theme.headerBorder,
                            borderBottomWidth: 1,
                            backgroundColor: theme.backgroundColor,
                        },
                        headerTitleStyle: {
                            color: theme.borderActiveColor,
                        },

                        headerLeft: () => (
                            <TouchableOpacity
                                style={styles.headerLeftStyle}
                                onPress={() => navigation.goBack()}>
                                <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                            </TouchableOpacity>
                        ),
                        cardStyleInterpolator: forFade,
                    })}
                />
                <Stack.Screen
                    name="SellCrypto"
                    component={SellCrypto}
                    options={({ navigation }) => ({
                        title: 'Sell Crypto',
                        headerStyle: {
                            borderBottomColor: theme.headerBorder,
                            borderBottomWidth: 1,
                            backgroundColor: theme.backgroundColor,
                        },
                        headerTitleStyle: {
                            color: theme.borderActiveColor,
                        },

                        headerLeft: () => (
                            <TouchableOpacity
                                style={styles.headerLeftStyle}
                                onPress={() => navigation.goBack()}>
                                <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                            </TouchableOpacity>
                        ),
                        cardStyleInterpolator: forFade,
                    })}
                />
                <Stack.Screen
                    name="OTC"
                    component={OTCScreen}
                    options={({ navigation }) => ({
                        title: 'Buy Crypto',
                        headerStyle: {
                            borderBottomColor: theme.headerBorder,
                            borderBottomWidth: 1,
                            backgroundColor: theme.backgroundColor,
                        },
                        headerTitleStyle: {
                            color: theme.borderActiveColor,
                        },

                        headerLeft: () => (
                            <TouchableOpacity
                                style={styles.headerLeftStyle}
                                onPress={() => navigation.goBack()}>
                                <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                            </TouchableOpacity>
                        ),
                        cardStyleInterpolator: forFade,
                    })}
                />
                <Stack.Screen
                    name="OTC2"
                    component={OTC2Screen}
                    options={({ navigation }) => ({
                        title: 'Buy Crypto',
                        headerStyle: {
                            borderBottomColor: theme.headerBorder,
                            borderBottomWidth: 1,
                            backgroundColor: theme.backgroundColor,
                        },
                        headerTitleStyle: {
                            color: theme.borderActiveColor,
                        },

                        headerLeft: () => (
                            <TouchableOpacity
                                style={styles.headerLeftStyle}
                                onPress={() => navigation.goBack()}>
                                <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                            </TouchableOpacity>
                        ),
                        cardStyleInterpolator: forFade,
                    })}
                />
                <Stack.Group>
                    <Stack.Screen
                        name="LocalCurrency"
                        component={LocalCurrency}
                        options={({ navigation }) => ({
                            title: 'Local Currency',

                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="DisplayTheme"
                        component={DisplayTheme}
                        options={({ navigation }) => ({
                            title: 'Theme',

                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="AutoLock"
                        component={AutoLock}
                        options={({ navigation }) => ({
                            title: 'Auto Lock',

                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="AddressBook"
                        component={AddressBook}
                        options={({ navigation }) => ({
                            title: 'Address Book',
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            headerRight: () => (
                                <TouchableOpacity
                                    style={styles.headerRightStyle}
                                    hitSlop={{ left: 4, right: 4, top: 4, bottom: 4 }}
                                    onPress={() => {
                                        navigation.navigate('AddAddress');
                                    }}>
                                    <Ionicons
                                        name={'person-add'}
                                        resizeMode={'contain'}
                                        size={24}
                                        color={theme.font}
                                    />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="AddAddress"
                        component={AddAddress}
                        options={({ navigation }) => ({
                            title: 'Add Address',
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="Notifications"
                        component={Notifications}
                        options={({ navigation }) => ({
                            title: 'Push Notifications',

                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            headerRight: () => (
                                <TouchableOpacity
                                    style={styles.headerRightStyle}
                                    onPress={() => navigation.navigate('Home')}>
                                    <Icons.Check width="25" height="25" fill={theme.font} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />

                    <Stack.Screen
                        name="ChangePassword"
                        component={ChangePassword}
                        options={({ navigation }) => ({
                            title: 'Change Password',

                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="VerifyLogin"
                        component={VerifyLoginScreen}
                        options={({ navigation }) => ({
                            title: 'Verify Password',

                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="EVMWalletDerivation"
                        component={EVMWalletDerivation}
                        options={({ navigation }) => ({
                            title: 'EVM, SOL & TRX Addresses',

                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="PrivacyMode"
                        component={PrivacyMode}
                        options={({ navigation }) => ({
                            title: 'Privacy Mode',
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="BlockedConversations"
                        component={BlockedConversations}
                        options={({ navigation }) => ({
                            title: 'Blockchain Chat Blocked',

                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                </Stack.Group>
                <Stack.Screen
                    name="ManageCoins"
                    component={ManageCoins}
                    options={({ navigation }) => ({
                        headerStyle: {
                            borderBottomColor: theme.headerBorder,
                            borderBottomWidth: 1,
                            backgroundColor: theme.backgroundColor,
                        },
                        headerTitleStyle: {
                            color: theme.borderActiveColor,
                        },
                        title: 'Manage Coins',

                        headerLeft: () => (
                            <TouchableOpacity
                                style={styles.headerLeftStyle}
                                onPress={() => navigation.goBack()}>
                                <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                            </TouchableOpacity>
                        ),
                        cardStyleInterpolator: forFade,
                    })}
                />
                <Stack.Screen
                    name="MessageList"
                    component={MessageList}
                    options={({ navigation }) => ({
                        title: 'Messages',
                        headerLeft: () => (
                            <TouchableOpacity
                                style={styles.headerLeftStyle}
                                onPress={() => navigation.goBack()}>
                                <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                            </TouchableOpacity>
                        ),
                        cardStyleInterpolator: forFade,
                    })}
                />
                <Stack.Screen
                    name="Message"
                    component={Message}
                    options={({ navigation }) => ({
                        headerShown: false,
                        cardStyleInterpolator: forFade,
                    })}
                />
                <Stack.Screen
                    name="NewMessage"
                    component={NewMessage}
                    options={({ navigation }) => ({
                        title: 'New Message',
                        headerLeft: () => (
                            <TouchableOpacity
                                style={styles.headerLeftStyle}
                                onPress={() => navigation.goBack()}>
                                <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                            </TouchableOpacity>
                        ),
                        cardStyleInterpolator: forFade,
                    })}
                />
                <Stack.Screen
                    name="EditConversation"
                    component={EditConversation}
                    options={({ navigation }) => ({
                        title: 'Edit',
                        headerLeft: () => (
                            <TouchableOpacity
                                style={styles.headerLeftStyle}
                                onPress={() => navigation.goBack()}>
                                <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                            </TouchableOpacity>
                        ),
                        cardStyleInterpolator: forFade,
                    })}
                />
                <Stack.Group>
                    <Stack.Screen
                        name="SendScreen"
                        component={SendScreen}
                        options={({ navigation }) => ({
                            title: currentCoin?.name || '--',
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="SelectUTXOsScreen"
                        component={SelectUTXOsScreen}
                        options={({ navigation }) => ({
                            title: 'Select UTXOs',
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="CustomDerivation"
                        component={CustomDerivation}
                        options={({ navigation }) => ({
                            title: 'Custom Derivation',
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="TransactionList"
                        component={TransactionList}
                        options={({ navigation }) => ({
                            title: `${currentCoin?.name || ''} Transactions`,
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="UpdateTransaction"
                        component={UpdateTransaction}
                        options={({ navigation }) => ({
                            title: 'Update Transaction',
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="StakingList"
                        component={StakingList}
                        options={({ navigation }) => ({
                            title: 'Staking',
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="CreateStaking"
                        component={CreateStaking}
                        options={({ navigation }) => ({
                            title: 'Create Staking',
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="VoteStaking"
                        component={VoteStaking}
                        options={({ navigation }) => ({
                            title: 'Select Validator',
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="WithdrawStaking"
                        component={WithdrawStaking}
                        options={({ navigation }) => ({
                            title: 'Withdraw Staking',
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />

                    <Stack.Screen
                        name="SendNFT"
                        component={SendNFT}
                        options={({ navigation }) => ({
                            title: 'Send NFT',
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="SendFunds"
                        component={SendFunds}
                        options={({ navigation }) => ({
                            title: 'Send Funds',
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />

                    <Stack.Screen
                        name="Transfer"
                        component={Transfer}
                        options={({ navigation }) => ({
                            title: 'Transfer',
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                            cardStyleInterpolator: forFade,
                        })}
                    />
                    <Stack.Screen
                        name="RecieveFunds"
                        component={RecieveFunds}
                        options={({ route, navigation }) => ({
                            title: 'Recieve Funds',

                            headerBackImage: () => (
                                <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                            ),
                            cardStyleInterpolator: forFade,
                            headerRight: () => (
                                <TouchableOpacity
                                    style={styles.headerRightStyle}
                                    onPress={() => route.params.shareQR()}>
                                    <ShareIcon width={24} height={24} fill={theme.background} />
                                </TouchableOpacity>
                            ),
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.goBack()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                        })}
                    />
                    <Stack.Screen
                        name="SortTransactions"
                        component={SortTransactions}
                        options={{ headerShown: false }}
                    />
                </Stack.Group>
                <Stack.Group>
                    <Stack.Screen
                        name="ResetWallet"
                        component={ResetWallet}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="LearnReset"
                        component={LearnReset}
                        options={({ navigation }) => ({
                            title: 'What is a seed phrase?',

                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() =>
                                        navigation.navigate('ResetWallet', { isFromOnBoarding: true })
                                    }>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                        })}
                    />
                    <Stack.Screen
                        name="ImportWallet"
                        component={ImportWallet}
                        options={({ navigation }) => ({
                            title: 'Import',

                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.pop()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                        })}
                    />
                    <Stack.Screen
                        name="ImportWalletByPrivateKey"
                        component={ImportWalletByPrivateKey}
                        options={({ navigation }) => ({
                            title: 'Import Wallet By Private Key',

                            headerLeft: () => (
                                <TouchableOpacity
                                    style={styles.headerLeftStyle}
                                    onPress={() => navigation.pop()}>
                                    <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                                </TouchableOpacity>
                            ),
                        })}
                    />
                </Stack.Group>
                <Stack.Group
                    screenOptions={{
                        presentation: 'modal',
                        headerShown: false,
                        gestureEnabled: false,
                        ...(IS_IOS
                            ? TransitionPresets.ModalPresentationIOS
                            : TransitionPresets.RevealFromBottomAndroid),
                    }}>
                    <Stack.Screen
                        name="WalletConnectRequestModal"
                        component={WalletConnectRequestModal}
                    />
                    <Stack.Screen
                        name="WalletConnectTransactionModal"
                        component={WalletConnectTransactionModal}
                    />
                    <Stack.Screen name="ForwardMessage" component={ForwardMessage} />
                </Stack.Group>
                <Stack.Screen
                    name="Scanner"
                    component={Scanner}
                    options={({ navigation }) => ({
                        title: 'Point at QR Code to Scan',
                        headerLeft: () => (
                            <TouchableOpacity
                                style={styles.headerLeftStyle}
                                onPress={() => navigation.goBack()}>
                                <Icons.Back width="22" height="18" fill={theme.borderActiveColor} />
                            </TouchableOpacity>
                        ),
                    })}
                />
            </Stack.Navigator>
        </AuthContext.Provider>
    )
}
const isIpad = SCREEN_WIDTH >= 768;

const styles = StyleSheet.create({
    headerLeftStyle: {
        paddingLeft: isIpad ? 50 : 11,
    },
    headerRightStyle: {
        paddingRight: isIpad ? 50 : 11,
    },
});