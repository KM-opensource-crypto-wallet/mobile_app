import React, {useContext} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {useSelector} from 'react-redux';
import {IS_IOS, SCREEN_WIDTH} from 'utils/dimensions';

const Stack = createNativeStackNavigator();
import {RegistrationScreen} from 'screens/auth/RegistrationScreen';
import {LoginScreen} from 'screens/auth/LoginScreen';
import {CarouselCards} from 'components/CarouselCards';
import {Learn} from 'components/VerifyInfo/Learn';
import {VerifyCreate} from 'components/VerifyCreate';
import {Verify} from 'components/Verify';
import Sidebar from 'components/Sidebar';
import Scanner from 'screens/main/Scanner';
import {StyleSheet, TouchableOpacity} from 'react-native';
import Back from 'assets/images/sidebarIcons/Back.svg';
import ShareIcon from 'assets/images/icons/share.svg';
import CreateWallet from 'screens/main/Wallets/CreateWallet';
import SelectCoins from 'screens/main/Wallets/SelectCoins';
import ManageCoins from 'screens/main/Home/ManageCoins';
import CoinSyncScreen from 'screens/main/CoinSyncScreen';
// ////////////////////////reset////////////////////////////////////////
import ResetWallet from 'screens/main/ResetWallet';
import LearnReset from 'screens/main/ResetWallet/LearnReset';
import ImportWallet from 'screens/main/ResetWallet/ImportWallet';
// ////////////////////////send////////////////////////////////////////
import SendScreen from 'screens/main/Home/SendScreen';
import SelectUTXOsScreen from 'screens/main/Home/SelectUTXOsScreen';
import SortTransactions from 'components/SortTransactions';
import RecieveFunds from 'screens/main/Home/RecieveFunds';
import SendFunds from 'screens/main/Home/SendFunds';
///////////////////////////////////////////////////////////////
// import CryptoInfo from 'screens/main/BuyCrypto/CryptoInfo';
// import CryptoOptions from 'screens/main/BuyCrypto/CryptoProviders';
import LocalCurrency from 'screens/main/Settings/LocalCurrency';
import Notifications from 'screens/main/Settings/Notifications';
import Check from 'assets/images/settings/check.svg';
import ChangePassword from 'screens/auth/ChangePassword';
import {LogBox} from 'react-native';
import AboutApp from 'screens/main/About/AboutApp';
import TermsConditions from 'screens/main/About/TermsConditions';
import PrivacyPolicy from 'screens/main/About/PrivacyPolicy';
import {ThemeContext} from 'theme/ThemeContext';
import {VerifyLoginScreen} from 'screens/auth/VerifyLoginScreen';
import Transfer from 'screens/main/Home/Transfer';
import {OTCScreen} from 'screens/main/BuyCrypto/OTCScreen';
import {OTC2Screen} from 'screens/main/BuyCrypto/OTC2Screen';
import {selectCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import DisplayTheme from 'screens/main/Settings/DisplayTheme';
import WalletConnectRequestModal from 'components/WalletConnectRequestModal';
import WalletConnectTransactionModal from 'components/WalletConnectTransactionModal';
import AutoLock from 'screens/main/Settings/AutoLock';
import SendNFT from 'screens/main/Home/SendNFT';
import ImportWalletByPrivateKey from 'screens/main/ResetWallet/ImportWalletByPrivateKey';
import EVMWalletDerivation from 'screens/main/Settings/EVMWalletDerivation';
import TransactionList from 'screens/main/Home/TransactionList';
import StakingList from 'screens/main/Home/StakingList';
import CreateStaking from 'screens/main/Home/CreateStaking';
import WithdrawStaking from 'screens/main/Home/WithdrawStaking';
import BuyCrypto from 'screens/main/BuyCrypto';
import MessageList from 'screens/main/Home/MessageList';
import NewMessage from 'screens/main/Home/NewMessage';
import Message from 'screens/main/Home/Message';
import {CustomDerivation} from 'screens/main/Home/CustomDerivation';
import VoteStaking from 'screens/main/Home/VoteStaking';
import BlockedConversations from 'screens/main/Settings/BlockedConvervastions';
import BackupWallets from 'screens/main/Settings/BackupRestore/BackupWallets';
import RestoreWallets from 'screens/main/Settings/BackupRestore/RestoreWallets';
import UpdateTransaction from 'screens/main/Home/UpdateTransaction';
import EditConversation from 'screens/main/Home/EditConversation';
import ForwardMessage from 'components/ForwardMessage';
import PrivacyMode from 'screens/main/Settings/PrivacyMode';
import SellCrypto from 'screens/main/SellCrypto';
import AddAddress from 'screens/main/Settings/AddressBook/AddAddress';
import AddCustomRPC from 'screens/main/Settings/AddCustomRPC';
import AddressBook from 'components/AddressBook';
import Ionicons from 'react-native-vector-icons/Ionicons';
import NotificationAlerts from 'screens/main/Settings/NotificationAlerts';
import TutorialVideos from 'screens/main/Settings/TutorialVideos';
import AddNotificationAlert from 'screens/main/Settings/AddNotificationAlert';
import AddNotificationAlertCoins from 'screens/main/Settings/AddNotificationAlert/Step2SelectCoins';
import AddNotificationAlertAddresses from 'screens/main/Settings/AddNotificationAlert/Step3SelectAddresses';
import AddNotificationAlertConfig from 'screens/main/Settings/AddNotificationAlert/Step4ConfigureAlert';
import CustomRPC from 'components/CustomRPC';
import TransactionDetails from 'components/TransactionDetails';
import {isAndroid} from 'react-native-draggable-flatlist/lib/typescript/constants';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Setting a timer for a long period of time',
  'VirtualizedLists should never be nested inside plain ScrollViews with the same orientation',
  'ViewPropTypes will be removed',
  'AsyncStorage has been extracted from react-native',
  'EventEmitter.removeListener',
]);

export const useRoute = isAuth => {
  const currentCoin = useSelector(selectCurrentCoin);

  const {theme} = useContext(ThemeContext);

  return (
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
      <Stack.Group screenOptions={{headerShown: false}}>
        {!isAuth && (
          <>
            <Stack.Screen name="CarouselCards" component={CarouselCards} />
            <Stack.Screen name="Registration" component={RegistrationScreen} />
          </>
        )}
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Group>
      {/* Modal screens */}
      {/* {!hasWallet && ( */}
      <Stack.Group>
        <Stack.Screen
          name="Learn"
          component={Learn}
          options={({navigation}) => ({
            title: 'Learn more',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        {/* ////////////////////////////////////////////////// */}
        <Stack.Screen
          name="VerifyCreate"
          component={VerifyCreate}
          options={({navigation}) => ({
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
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="Verify"
          component={Verify}
          options={({navigation}) => ({
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),

            animation: 'fade',
          })}
        />
      </Stack.Group>
      {/* )} */}
      {/* ///////////////////It is used/////////////////////////////////////////// */}
      {/* <Stack.Screen
        name="Temp"
        component={Temp}
        options={{headerShown: false}}
      /> */}
      <Stack.Screen
        name="Sidebar"
        component={Sidebar}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="CreateWallet"
        component={CreateWallet}
        options={({navigation}) => ({
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
              <Back width="22" height="18" fill={theme.borderActiveColor} />
            </TouchableOpacity>
          ),
          animation: 'fade',
        })}
      />
      <Stack.Screen
        name="SelectCoins"
        component={SelectCoins}
        options={({navigation}) => ({
          headerStyle: {
            borderBottomColor: theme.headerBorder,
            borderBottomWidth: 1,
            backgroundColor: theme.backgroundColor,
          },
          headerTitleStyle: {
            color: theme.borderActiveColor,
          },
          title: 'Select Coins',
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerLeftStyle}
              onPress={() => navigation.goBack()}>
              <Back width="22" height="18" fill={theme.borderActiveColor} />
            </TouchableOpacity>
          ),
          animation: 'fade',
        })}
      />
      <Stack.Group>
        <Stack.Screen
          name="About App"
          component={AboutApp}
          options={({navigation}) => ({
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="Terms & Conditions"
          component={TermsConditions}
          options={({navigation}) => ({
            title: 'Terms of Use',

            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="Privacy Policy"
          component={PrivacyPolicy}
          options={({navigation}) => ({
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
      </Stack.Group>
      {/* ///////////////////////////////not needed now///////////////////////////////////// */}
      {/* <Stack.Screen
        name="CryptoInfo"
        component={CryptoInfo}
        options={({navigation}) => ({title: 'Buy Crypto',
          headerStyle: {
            height: floatingHeight > 400 ? 100 :80,
            borderBottomColor: theme.headerBorder,
              borderBottomWidth: 1,
              backgroundColor: theme.backgroundColor,
          },
           headerTitleStyle: {
            color: theme.borderActiveColor,
          },


          headerLeft: () => (
            <TouchableOpacity
              style={{

                  paddingLeft: isIpad ? 50 : 11,
                }}
              onPress={() => navigation.goBack()}>
              <Back  width="22" height="18" fill={theme.borderActiveColor}/>
            </TouchableOpacity>
          ),
          animation: 'fade',
        })}
      />  */}
      {/* <Stack.Screen
        name="CryptoOptions"
        component={CryptoOptions}
        options={({navigation}) => ({title: 'Buy Crypto',
          headerStyle: {
          height: floatingHeight > 400 ? 100 :80,
            borderBottomColor: theme.headerBorder,
              borderBottomWidth: 1,
              backgroundColor: theme.backgroundColor,
          },
           headerTitleStyle: {
            color: theme.borderActiveColor,
          },


          headerLeft: () => (style={{

                  paddingLeft: isIpad ? 50 : 11,
                }} style={{padding:isIpad ? 50 :  11}}
              onPress={() => navigation.goBack()}>
              <Back  width="22" height="18" fill={theme.borderActiveColor} />
            </TouchableOpacity>
          ),
          animation: 'fade',
        })}
      />  */}
      {/* ///////////////////////////////not needed now///////////////////////////////////// */}
      <Stack.Screen
        name="iOSBuyCrypto"
        component={BuyCrypto}
        options={({navigation}) => ({
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
              <Back width="22" height="18" fill={theme.borderActiveColor} />
            </TouchableOpacity>
          ),
          animation: 'fade',
        })}
      />
      <Stack.Screen
        name="SellCrypto"
        component={SellCrypto}
        options={({navigation}) => ({
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
              <Back width="22" height="18" fill={theme.borderActiveColor} />
            </TouchableOpacity>
          ),
          animation: 'fade',
        })}
      />
      <Stack.Screen
        name="OTC"
        component={OTCScreen}
        options={({navigation}) => ({
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
              <Back width="22" height="18" fill={theme.borderActiveColor} />
            </TouchableOpacity>
          ),
          animation: 'fade',
        })}
      />
      <Stack.Screen
        name="OTC2"
        component={OTC2Screen}
        options={({navigation}) => ({
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
              <Back width="22" height="18" fill={theme.borderActiveColor} />
            </TouchableOpacity>
          ),
          animation: 'fade',
        })}
      />
      <Stack.Group>
        <Stack.Screen
          name="LocalCurrency"
          component={LocalCurrency}
          options={({navigation}) => ({
            title: 'Local Currency',

            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="DisplayTheme"
          component={DisplayTheme}
          options={({navigation}) => ({
            title: 'Theme',

            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="AutoLock"
          component={AutoLock}
          options={({navigation}) => ({
            title: 'Auto Lock',

            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="AddressBook"
          component={AddressBook}
          options={({navigation}) => ({
            title: 'Address Book',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity
                style={styles.headerRightStyle}
                hitSlop={{left: 4, right: 4, top: 4, bottom: 4}}
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
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="CustomRPC"
          component={CustomRPC}
          options={({navigation}) => ({
            title: 'Custom RPC',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity
                style={styles.headerRightStyle}
                hitSlop={{left: 4, right: 4, top: 4, bottom: 4}}
                onPress={() => {
                  navigation.navigate('AddCustomRPC');
                }}>
                <Ionicons
                  name={'person-add'}
                  resizeMode={'contain'}
                  size={24}
                  color={theme.font}
                />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="AddAddress"
          component={AddAddress}
          options={({navigation}) => ({
            title: 'Add Address',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="AddCustomRPC"
          component={AddCustomRPC}
          options={({navigation}) => ({
            title: 'Add Custom RPC',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="Notifications"
          component={Notifications}
          options={({navigation}) => ({
            title: 'Push Notifications',

            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity
                style={styles.headerRightStyle}
                onPress={() => navigation.navigate('Home')}>
                <Check width="25" height="25" fill={theme.font} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="NotificationAlerts"
          component={NotificationAlerts}
          options={({navigation}) => ({
            title: 'Notification Alerts',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="AddNotificationAlert"
          component={AddNotificationAlert}
          options={({navigation}) => ({
            title: 'Select Wallet',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="AddNotificationAlertCoins"
          component={AddNotificationAlertCoins}
          options={({navigation}) => ({
            title: 'Select Coins',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen
          name="AddNotificationAlertAddresses"
          component={AddNotificationAlertAddresses}
          options={({navigation}) => ({
            title: 'Select Addresses',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen
          name="AddNotificationAlertConfig"
          component={AddNotificationAlertConfig}
          options={({navigation, route}) => ({
            title: route?.params?.alert ? 'Edit Alert' : 'Configure Alert',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
          })}
        />

        <Stack.Screen
          name="ChangePassword"
          component={ChangePassword}
          options={({navigation}) => ({
            title: 'Change Password',

            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="VerifyLogin"
          component={VerifyLoginScreen}
          options={({navigation}) => ({
            title: 'Verify Password',

            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="EVMWalletDerivation"
          component={EVMWalletDerivation}
          options={({navigation}) => ({
            title: 'EVM, SOL & TRX Addresses',

            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="TutorialVideos"
          component={TutorialVideos}
          options={({navigation}) => ({
            title: 'Tutorial Videos',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="PrivacyMode"
          component={PrivacyMode}
          options={({navigation}) => ({
            title: 'Privacy Mode',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="BlockedConversations"
          component={BlockedConversations}
          options={({navigation}) => ({
            title: 'Blockchain Chat Blocked',

            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="BackupWallets"
          component={BackupWallets}
          options={({navigation}) => ({
            title: 'Backup Wallets',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="RestoreWallets"
          component={RestoreWallets}
          options={({navigation}) => ({
            title: 'Restore Wallets',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
      </Stack.Group>
      <Stack.Screen
        name="ManageCoins"
        component={ManageCoins}
        options={({navigation}) => ({
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
              <Back width="22" height="18" fill={theme.borderActiveColor} />
            </TouchableOpacity>
          ),
          animation: 'fade',
        })}
      />
      <Stack.Screen
        name="CoinSyncScreen"
        component={CoinSyncScreen}
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="MessageList"
        component={MessageList}
        options={({navigation}) => ({
          title: 'Messages',
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerLeftStyle}
              onPress={() => navigation.goBack()}>
              <Back width="22" height="18" fill={theme.borderActiveColor} />
            </TouchableOpacity>
          ),
          animation: 'fade',
        })}
      />
      <Stack.Screen
        name="Message"
        component={Message}
        options={({navigation}) => ({
          headerShown: false,
          animation: 'fade',
        })}
      />
      <Stack.Screen
        name="NewMessage"
        component={NewMessage}
        options={({navigation}) => ({
          title: 'New Message',
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerLeftStyle}
              onPress={() => navigation.goBack()}>
              <Back width="22" height="18" fill={theme.borderActiveColor} />
            </TouchableOpacity>
          ),
          animation: 'fade',
        })}
      />
      <Stack.Screen
        name="EditConversation"
        component={EditConversation}
        options={({navigation}) => ({
          title: 'Edit',
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerLeftStyle}
              onPress={() => navigation.goBack()}>
              <Back width="22" height="18" fill={theme.borderActiveColor} />
            </TouchableOpacity>
          ),
          animation: 'fade',
        })}
      />
      {/* /////////////send////////////////////////////////////////// */}
      <Stack.Group>
        <Stack.Screen
          name="SendScreen"
          component={SendScreen}
          options={({navigation}) => ({
            title: currentCoin?.name || '--',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="SelectUTXOsScreen"
          component={SelectUTXOsScreen}
          options={({navigation}) => ({
            title: 'Select UTXOs',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="CustomDerivation"
          component={CustomDerivation}
          options={({navigation}) => ({
            title: 'Custom Derivation',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="TransactionList"
          component={TransactionList}
          options={({navigation}) => ({
            title: `${currentCoin?.name || ''} Transactions`,
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="TransactionDetails"
          component={TransactionDetails}
          options={({navigation}) => ({
            title: `${currentCoin?.name || ''} Transaction`,
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="UpdateTransaction"
          component={UpdateTransaction}
          options={({navigation}) => ({
            title: 'Update Transaction',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="StakingList"
          component={StakingList}
          options={({navigation}) => ({
            title: 'Staking',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="CreateStaking"
          component={CreateStaking}
          options={({navigation}) => ({
            title: 'Create Staking',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="VoteStaking"
          component={VoteStaking}
          options={({navigation}) => ({
            title: 'Select Validator',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="WithdrawStaking"
          component={WithdrawStaking}
          options={({navigation}) => ({
            title: 'Withdraw Staking',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />

        <Stack.Screen
          name="SendNFT"
          component={SendNFT}
          options={({navigation}) => ({
            title: 'Send NFT',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="SendFunds"
          component={SendFunds}
          options={({navigation}) => ({
            title: 'Send Funds',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />

        <Stack.Screen
          name="Transfer"
          component={Transfer}
          options={({navigation}) => ({
            title: 'Transfer',
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.goBack()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
            animation: 'fade',
          })}
        />
        <Stack.Screen
          name="RecieveFunds"
          component={RecieveFunds}
          options={({route, navigation}) => ({
            title: 'Recieve Funds',
            animation: 'fade',
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
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
          })}
        />
        {/* <Stack.Screen
          name="Transactions"
          component={Transactions}
          options={{headerShown: false}}
        /> */}
        <Stack.Screen
          name="SortTransactions"
          component={SortTransactions}
          options={{headerShown: false}}
        />
      </Stack.Group>
      {/* /////////////reset////////////////////////////////////////// */}
      <Stack.Group>
        <Stack.Screen
          name="ResetWallet"
          component={ResetWallet}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="LearnReset"
          component={LearnReset}
          options={({navigation}) => ({
            title: 'What is a seed phrase?',

            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() =>
                  navigation.navigate('ResetWallet', {isFromOnBoarding: true})
                }>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen
          name="ImportWallet"
          component={ImportWallet}
          options={({navigation}) => ({
            title: 'Import',

            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.pop()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen
          name="ImportWalletByPrivateKey"
          component={ImportWalletByPrivateKey}
          options={({navigation}) => ({
            title: 'Import Wallet By Private Key',

            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerLeftStyle}
                onPress={() => navigation.pop()}>
                <Back width="22" height="18" fill={theme.borderActiveColor} />
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
          animation: 'slide_from_bottom',
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
        options={({navigation}) => ({
          title: 'Point at QR Code to Scan',
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerLeftStyle}
              onPress={() => navigation.goBack()}>
              <Back width="22" height="18" fill={theme.borderActiveColor} />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
};

const isIpad = SCREEN_WIDTH >= 768;

const styles = StyleSheet.create({
  headerLeftStyle: {
    paddingLeft: isIpad ? 50 : IS_IOS ? 0 : 11,
  },
  headerRightStyle: {
    paddingRight: isIpad ? 50 : IS_IOS ? 0 : 11,
  },
});
