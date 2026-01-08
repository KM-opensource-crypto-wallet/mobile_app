import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer';
import {View, Text, Button, Image, StyleSheet} from 'react-native';
import React, {useState, useEffect, useContext, useMemo} from 'react';

import BuyCrypto from 'screens/main/BuyCrypto';
import ResetWallet from 'screens/main/ResetWallet';
import Settings from 'screens/main/Settings';
import {TouchableOpacity} from 'react-native-gesture-handler';
import BackIcon from 'assets/images/sidebarIcons/Back.svg';
import HomeIcon from 'assets/images/sidebarIcons/Home.svg';
import BuyCryptoIcon from 'assets/images/sidebarIcons/BuyCrypto.svg';
import SettingsIcon from 'assets/images/sidebarIcons/Settings.svg';
import InfoIcon from 'assets/images/sidebarIcons/Info.svg';
import ResetWalletIcon from 'assets/images/sidebarIcons/ResetWallet.svg';
import WallestIcon from 'assets/images/sidebarIcons/Wallet.svg';
import WalletConnectIcon from 'assets/images/sidebarIcons/WalletConnect.svg';
import ContactUsIcon from 'assets/images/sidebarIcons/contact_us.svg';
import AddIcon from 'assets/images/sidebarIcons/Add.svg';
import ConvertIcon from 'assets/images/sidebarIcons/CryptoConvert.svg';
import Home from 'screens/main/Home';
import Wallets from 'screens/main/Wallets';
import {useSelector, useDispatch} from 'react-redux';
import ModalReset from 'components/ModalReset';
import {useFocusEffect} from '@react-navigation/native';
import {DrawerActions} from '@react-navigation/native';
import Exchange from 'screens/main/Exchange';
import LogOutIcon from 'assets/images/sidebarIcons/Logout.svg';
import LogOutIconDark from 'assets/images/sidebarIcons/Logout_dark.svg';
import AboutScreen from 'screens/main/About/AboutScreen';
import HomeScreen from 'screens/main/Home/HomeScreen';
import {IS_ANDROID, IS_IOS, useFloatingHeight} from 'utils/dimensions';
import {ThemeContext} from 'theme/ThemeContext';
import {useFloatingWidth} from 'hooks/useFloatingWidth';
import {selectCurrentWallet} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import WalletConnect from 'screens/main/WalletConnect';
import ContactUs from 'screens/main/ContactUs';
import SelectCountry from 'screens/main/BuyCrypto/SelectCountry';
import ReceivePaymentUrl from 'screens/main/ReceivePaymentUrl';
import Entypo from 'react-native-vector-icons/Entypo';
import {getCountry} from 'react-native-localize';
import {IS_DOK_WALLET} from 'utils/wlData';

const Drawer = createDrawerNavigator();

const HIDE_SWAP_COUNTRIES = ['US'];

export default function Sidebar({navigation, route}) {
  const userWalletName = useSelector(selectCurrentWallet)?.walletName;
  const {theme} = useContext(ThemeContext);
  const [modal, setModal] = useState(false);
  const [modalList, setModalList] = useState('');
  const floatingHeight = useFloatingHeight();
  const isIpad = useFloatingWidth();
  const dispatch = useDispatch();
  const deviceCountry = useMemo(() => {
    return getCountry()?.toUpperCase();
  }, []);

  useEffect(() => {
    const parent = navigation.getParent();

    if (modal === false) {
      parent?.dispatch(DrawerActions.closeDrawer());
    }
    if (modal === true) {
      parent?.dispatch(DrawerActions.openDrawer());
    }
  }, [modal, navigation]);

  function CustomDrawerContent(props) {
    return (
      <>
        <DrawerContentScrollView {...props}>
          <DrawerItemList {...props} />
          {/* Delete Account */}
          <DrawerItem
            icon={({focused}) => (
              <ResetWalletIcon
                fill={focused ? theme.background : theme.sidebarIcon}
                style={{marginVertical: -4}}
              />
            )}
            label={() => (
              <Text
                style={{
                  color:
                    theme.backgroundColor === '#121212' ? '#FFFFFF' : '#989898',

                  fontFamily: 'Roboto-Regular',
                  fontSize: 16,
                  marginVertical: -4,
                }}>
                Delete Account
              </Text>
            )}
            onPress={() => {
              setModalList('Delete Account');
              setModal(true);
            }}
          />
          {/* Logout */}
          <DrawerItem
            icon={({focused}) =>
              theme.backgroundColor === '#121212' ? (
                <LogOutIconDark
                  width="25"
                  height="26"
                  // style={{marginVertical: -4, marginLeft: -4}}
                />
              ) : (
                <LogOutIcon
                  width="25"
                  height="26"
                  // fill={focused ? theme.background : theme.sidebarIcon}
                  // style={{marginVertical: -4, marginLeft: -4}}
                />
              )
            }
            label={() => (
              <Text
                style={{
                  color:
                    theme.backgroundColor === '#121212' ? '#FFFFFF' : '#989898',
                  // color: '#989898',
                  fontFamily: 'Roboto-Regular',
                  fontSize: 16,
                  marginVertical: -4,
                  marginLeft: -2,
                }}>
                Logout
              </Text>
            )}
            onPress={() => {
              setModalList('Logout');
              setModal(true);
            }}
          />
        </DrawerContentScrollView>
      </>
    );
  }

  return (
    <>
      <Drawer.Navigator
        drawerContent={props => <CustomDrawerContent {...props} />}
        drawerHideStatusBarOnOpen={true}
        screenOptions={{
          drawerActiveBackgroundColor: 'transparent',
          headerStyle: {
            borderBottomColor: theme.headerBorder,
            borderBottomWidth: 1,
            backgroundColor: theme.backgroundColor,
          },
          headerTitleStyle: {
            color: theme.borderActiveColor,
          },
          drawerStyle: {
            paddingTop: 45,
            paddingLeft: 20,
            backgroundColor: theme.secondaryBackgroundColor,
          },
          drawerItemStyle: {
            marginBottom: -2,
          },
          drawerActiveTintColor: theme.background,
          drawerInactiveTintColor:
            theme.backgroundColor === '#121212' ? '#FFFFFF' : '#989898',
          drawerLabelStyle: {
            fontFamily: 'Roboto-Regular',
            fontSize: 16,
          },
        }}
        initialRouteName="Home">
        <Drawer.Screen
          name="Home"
          component={HomeScreen}
          options={({navigation}) => ({
            headerTitleAlign: 'center',
            headerShown: false,
            drawerLabel: 'Home',
            drawerIcon: ({focused}) => (
              <HomeIcon fill={focused ? theme.background : theme.font} />
            ),
          })}
        />
        {IS_IOS && IS_DOK_WALLET ? (
          <Drawer.Screen
            name="SelectCountry"
            component={SelectCountry}
            options={({navigation}) => ({
              title: 'Buy Crypto',
              headerLeft: () => (
                <TouchableOpacity
                  style={{
                    padding: 11,
                    paddingLeft: isIpad ? 50 : 11,
                  }}
                  onPress={() => navigation.navigate('Home')}>
                  <BackIcon
                    width="22"
                    height="18"
                    fill={theme.borderActiveColor}
                  />
                </TouchableOpacity>
              ),
              headerTitleAlign: 'center',
              // headerTitleStyle: {
              //   color: theme.borderActiveColor,
              // },
              drawerIcon: ({focused}) => (
                <BuyCryptoIcon
                  width="25"
                  height="26"
                  fill={focused ? theme.background : theme.sidebarIcon}
                />
              ),
            })}
          />
        ) : IS_DOK_WALLET || IS_ANDROID ? (
          <Drawer.Screen
            name="BuyCrypto"
            component={BuyCrypto}
            options={({navigation}) => ({
              title: 'Buy Crypto',
              headerLeft: () => (
                <TouchableOpacity
                  style={{
                    padding: 11,
                    paddingLeft: isIpad ? 50 : 11,
                  }}
                  onPress={() => navigation.navigate('Home')}>
                  <BackIcon
                    width="22"
                    height="18"
                    fill={theme.borderActiveColor}
                  />
                </TouchableOpacity>
              ),
              headerTitleAlign: 'center',
              // headerTitleStyle: {
              //   color: theme.borderActiveColor,
              // },
              drawerIcon: ({focused}) => (
                <BuyCryptoIcon
                  width="25"
                  height="26"
                  fill={focused ? theme.background : theme.sidebarIcon}
                />
              ),
            })}
          />
        ) : null}
        {!HIDE_SWAP_COUNTRIES.includes(deviceCountry) &&
          (IS_ANDROID || IS_DOK_WALLET) && (
            <Drawer.Screen
              name="Exchange"
              component={Exchange}
              options={({navigation}) => ({
                unmountOnBlur: true,
                headerLeft: () => (
                  <TouchableOpacity
                    style={{
                      padding: 11,
                      paddingLeft: isIpad ? 50 : 11,
                    }}
                    onPress={() => navigation.navigate('Home')}>
                    <BackIcon
                      width="22"
                      height="18"
                      fill={theme.borderActiveColor}
                    />
                  </TouchableOpacity>
                ),
                headerTitleAlign: 'center',
                headerTitle: 'Swap',
                title: 'Swap',
                drawerIcon: ({focused}) => (
                  <ConvertIcon
                    width="25"
                    height="26"
                    fill={focused ? theme.background : theme.sidebarIcon}
                  />
                ),
              })}
            />
          )}
        {(IS_ANDROID || IS_DOK_WALLET) && (
          <Drawer.Screen
            name="SelectCountrySellCrypto"
            component={SelectCountry}
            initialParams={{isSellCrypto: true}}
            options={({navigation}) => ({
              title: 'Sell Crypto',
              headerLeft: () => (
                <TouchableOpacity
                  style={{
                    padding: 11,
                    paddingLeft: isIpad ? 50 : 11,
                  }}
                  onPress={() => navigation.navigate('Home')}>
                  <BackIcon
                    width="22"
                    height="18"
                    fill={theme.borderActiveColor}
                  />
                </TouchableOpacity>
              ),
              headerTitleAlign: 'center',
              drawerIcon: ({focused}) => (
                <BuyCryptoIcon
                  width="25"
                  height="26"
                  fill={focused ? theme.background : theme.sidebarIcon}
                />
              ),
            })}
          />
        )}
        <Drawer.Screen
          name="Wallets"
          component={Wallets}
          options={({navigation}) => ({
            headerLeft: () => (
              <TouchableOpacity
                style={{
                  padding: 11,
                  paddingLeft: isIpad ? 50 : 11,
                }}
                onPress={() => navigation.navigate('Home')}>
                <BackIcon
                  width="22"
                  height="18"
                  fill={theme.borderActiveColor}
                />
              </TouchableOpacity>
            ),
            headerTitleAlign: 'center',
            drawerIcon: ({focused}) => (
              <WallestIcon
                fill={focused ? theme.background : theme.sidebarIcon}
              />
            ),
          })}
        />
        <Drawer.Screen
          name="WalletConnect"
          label="WalletConnect"
          component={WalletConnect}
          options={({navigation}) => ({
            headerLeft: () => (
              <TouchableOpacity
                style={{
                  padding: 11,
                  paddingLeft: isIpad ? 50 : 11,
                }}
                onPress={() => navigation.navigate('Home')}>
                <BackIcon
                  width="22"
                  height="18"
                  fill={theme.borderActiveColor}
                />
              </TouchableOpacity>
            ),
            headerTitle: 'WalletConnect',
            headerTitleAlign: 'center',
            drawerIcon: ({focused}) => (
              <WalletConnectIcon
                fill={focused ? theme.background : theme.sidebarIcon}
              />
            ),
          })}
        />
        <Drawer.Screen
          name="ReceivePaymentUrl"
          component={ReceivePaymentUrl}
          options={({navigation}) => ({
            headerTitleAlign: 'center',
            headerTitle: 'Request Crypto',
            drawerLabel: 'Request Crypto',
            headerLeft: () => (
              <TouchableOpacity
                style={{
                  padding: 11,
                  paddingLeft: isIpad ? 50 : 11,
                }}
                onPress={() => navigation.navigate('Home')}>
                <BackIcon
                  width="22"
                  height="18"
                  fill={theme.borderActiveColor}
                />
              </TouchableOpacity>
            ),
            drawerIcon: ({focused}) => (
              <Entypo
                name={'link'}
                size={24}
                color={focused ? theme.background : theme.sidebarIcon}
              />
            ),
          })}
        />
        <Drawer.Screen
          name="About"
          component={AboutScreen}
          options={({navigation}) => ({
            headerTitleAlign: 'center',
            headerLeft: () => (
              <TouchableOpacity
                style={{
                  padding: 11,
                  paddingLeft: isIpad ? 50 : 11,
                }}
                onPress={() => navigation.navigate('Home')}>
                <BackIcon
                  width="22"
                  height="18"
                  fill={theme.borderActiveColor}
                />
              </TouchableOpacity>
            ),
            drawerIcon: ({focused}) => (
              <InfoIcon fill={focused ? theme.background : theme.sidebarIcon} />
            ),
          })}
        />
        <Drawer.Screen
          name="ContactUs"
          component={ContactUs}
          options={({navigation}) => ({
            headerLeft: () => (
              <TouchableOpacity
                style={{
                  padding: 11,
                  paddingLeft: isIpad ? 50 : 11,
                }}
                onPress={() => navigation.navigate('Home')}>
                <BackIcon
                  width="22"
                  height="18"
                  fill={theme.borderActiveColor}
                />
              </TouchableOpacity>
            ),
            drawerLabel: 'Contact Us',
            headerTitle: 'Contact Us',
            headerTitleAlign: 'center',
            drawerIcon: ({focused}) => (
              <ContactUsIcon
                fill={focused ? theme.background : theme.sidebarIcon}
              />
            ),
          })}
        />
        <Drawer.Screen
          name="Settings"
          component={Settings}
          options={({navigation}) => ({
            headerTitleAlign: 'center',
            headerLeft: () => (
              <TouchableOpacity
                style={{
                  padding: 11,
                  paddingLeft: isIpad ? 50 : 11,
                }}
                onPress={() => navigation.navigate('Home')}>
                <BackIcon
                  width="22"
                  height="18"
                  fill={theme.borderActiveColor}
                />
              </TouchableOpacity>
            ),
            drawerIcon: ({focused}) => (
              <SettingsIcon
                fill={focused ? theme.background : theme.sidebarIcon}
              />
            ),
          })}
        />
      </Drawer.Navigator>
      <ModalReset
        visible={modal}
        hideModal={setModal}
        navigation={navigation}
        page={modalList}
      />
    </>
  );
}
