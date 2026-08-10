import React, {useState, useEffect, useContext, useCallback} from 'react';
import {View, Text, TouchableOpacity, ScrollView} from 'react-native';
import myStyles from './SettingsStyles';
import LocalCurrency from 'assets/images/settings/local-currency.svg';
import SetCurrency from 'assets/images/settings/set-currency.svg';
import Notifications from 'assets/images/settings/notifications.svg';
import Change from 'assets/images/settings/change-pass.svg';
import ShowPhrase from 'assets/images/settings/show-phrase.svg';
import Rate from 'assets/images/settings/rate.svg';
import Privacy from 'assets/images/settings/privacy.svg';
import Terms from 'assets/images/settings/mail.svg';
import {Switch} from 'react-native-paper';
import ModalFingerprint from 'components/ModalFingerprint';
import ModalFingerprintVerification from 'components/ModalFingerprintVerification';
import {useDispatch, useSelector} from 'react-redux';
import {
  getLocalCurrency,
  getLockTimeDisplay,
  isChatOptions,
  isFingerprint,
  isSearchInHomeScreen,
  isWalletReset,
} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {getTutorialVideos} from 'dok-wallet-blockchain-networks/redux/cryptoProviders/cryptoProvidersSelectors';
import {
  updateChatOptions,
  updateFingerprint,
  updateSearchInHomeScreen,
  setResetWallet,
} from 'dok-wallet-blockchain-networks/redux/settings/settingsSlice';
import FingerprintScanner from 'react-native-fingerprint-scanner';
import {fingerprintAuthOut} from 'dok-wallet-blockchain-networks/redux/auth/authSlice';
import {ThemeContext} from 'theme/ThemeContext';
import InAppReview from 'react-native-in-app-review';
import AddIcon from 'assets/images/sidebarIcons/Add.svg';
import IoniconsIcon from 'react-native-vector-icons/Ionicons';
import EntypeIcon from 'react-native-vector-icons/Entypo';
import ModalConfirmEnableChatModal from 'components/ModalConfirmEnableChatModal';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {getFingerprintName} from 'dok-wallet-blockchain-networks/helper';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome6';
import {inAppBrowserOptions} from 'utils/common';
import {openInAppBrowser} from 'utils/inAppBrowser';
import {URLData} from 'utils/wlData';

const Settings = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const isSwitchOn = useSelector(isFingerprint);
  const [showModalPass, setShowModalPass] = useState(false);
  const [showModalVarify, setShowModalVarify] = useState(false);
  const [isChatModalVisible, setIsChatModalVisible] = useState(false);
  const dispatch = useDispatch();
  const [isFingerprintEnabled, setIsFingerprintEnabled] = useState(null);
  const localCurrency = useSelector(getLocalCurrency);
  const lockTimeDisplay = useSelector(getLockTimeDisplay);
  const chatOptions = useSelector(isChatOptions);
  const searchInHomeScreen = useSelector(isSearchInHomeScreen);
  const rateLimitCheck = useSelector(isWalletReset);
  const tutorialVideos = useSelector(getTutorialVideos);

  const onToggleSwitch = () => {
    if (isFingerprintEnabled) {
      if (!isSwitchOn) {
        setShowModalPass(!showModalPass);
      } else {
        dispatch(updateFingerprint(!isSwitchOn));
        dispatch(fingerprintAuthOut());
      }
    } else {
      setShowModalVarify(true);
    }
  };

  const onChangeChatOptions = value => {
    if (value) {
      setIsChatModalVisible(true);
    } else {
      dispatch(updateChatOptions(value));
    }
  };

  const onChangeSearchOptionsHomeScreen = value => {
    dispatch(updateSearchInHomeScreen(value));
  };
  const onChangeApplyRateLimit = value => {
    dispatch(setResetWallet(value));
  };

  const onPressRateApp = useCallback(async () => {
    try {
      if (InAppReview.isAvailable()) {
        await InAppReview.RequestInAppReview();
      } else {
        console.error('In app review not available');
      }
    } catch (e) {
      console.error('Error in in app review popup');
    }
  }, []);

  useEffect(() => {
    const checkFingerprintSettings = async () => {
      try {
        const isAvailable = await FingerprintScanner.isSensorAvailable(
          FingerprintScanner.authenticate,
        );
        setIsFingerprintEnabled(isAvailable);
      } catch (error) {
        console.error('Error checking fingerprint settings:', error);
      }
    };

    checkFingerprintSettings();

    FingerprintScanner.release();
  }, []);

  return (
    <DokSafeAreaView style={styles.container}>
      <View style={styles.container}>
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.contentContainerStyle}>
          <Text style={styles.title}>Account settings</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('LocalCurrency')}
            style={{
              ...styles.btn,
              borderBottomWidth: 0.5,
              borderBottomColor: theme.gray,
            }}>
            <LocalCurrency width="24" height="22" fill={theme.font} />
            <View style={styles.box}>
              <Text style={styles.btnTitle}>Local Currency</Text>
              <Text style={styles.btnText}>{localCurrency}</Text>
            </View>
          </TouchableOpacity>
          {/* /////////////////////////////// */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ManageCoins')}
            style={{
              ...styles.btn,
              borderBottomWidth: 0.5,
              borderBottomColor: theme.gray,
            }}>
            <SetCurrency width="24" height="22" fill={theme.font} />
            <View style={styles.box}>
              <Text style={styles.btnTitle}>Coin List</Text>
              <Text style={styles.btnText}>Manage your coin list</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('DisplayTheme')}
            style={styles.btn}>
            <SetCurrency width="24" height="22" fill={theme.font} />
            <View style={styles.box}>
              <Text style={styles.btnTitle}>Theme</Text>
              <Text style={styles.btnText}>Manage your app theme</Text>
            </View>
          </TouchableOpacity>
          {/* /////////////////////////////// */}
          {/*<Text style={styles.title}>Notifications settings</Text>*/}
          {/*<TouchableOpacity*/}
          {/*  onPress={() => navigation.navigate('Notifications')}*/}
          {/*  style={styles.btn}>*/}
          {/*  <Notifications width="24" height="22" fill={theme.font} />*/}
          {/*  <View style={styles.box}>*/}
          {/*    <Text style={styles.btnTitle}>Push Notifications</Text>*/}
          {/*    <Text style={styles.btnText}>Manage push notifications</Text>*/}
          {/*  </View>*/}
          {/*</TouchableOpacity>*/}
          {/* /////////////////////////////// */}
          <Text style={styles.title}>Security</Text>
          <TouchableOpacity
            onPress={() => navigation.push('ChangePassword')}
            style={{
              ...styles.btn,
              borderBottomWidth: 0.5,
              borderBottomColor: theme.gray,
            }}>
            <MaterialIcons name={'password'} color={theme.font} size={25} />
            <View style={styles.box}>
              <Text style={styles.btnTitle}>Change Password</Text>
              <Text style={styles.btnText}>Change or reset your password</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.push('AutoLock')}
            style={{
              ...styles.btn,
              borderBottomWidth: 0.5,
              borderBottomColor: theme.gray,
            }}>
            <Change width="24" height="22" fill={theme.font} />
            <View style={styles.box}>
              <Text style={styles.btnTitle}>Auto Lock</Text>
              <Text style={styles.btnText}>{lockTimeDisplay}</Text>
            </View>
          </TouchableOpacity>
          {/* /////////////////////////////// */}
          <TouchableOpacity
            onPress={() => navigation.push('VerifyLogin')}
            style={{
              ...styles.btn,
              borderBottomWidth: 0.5,
              borderBottomColor: theme.gray,
            }}>
            <ShowPhrase width="24" height="22" fill={theme.font} />
            <View style={styles.box}>
              <Text style={styles.btnTitle}>Show seed phrase</Text>
              <Text style={styles.btnText}>Manage your seed phrase</Text>
            </View>
          </TouchableOpacity>
          {/* /////////////////////////////// */}
          <View
            style={{
              ...styles.btn,
              justifyContent: 'space-between',
            }}
            // onPress={onToggleSwitch}
          >
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Change width="24" height="22" fill={theme.font} />
              <View style={styles.box}>
                <Text style={styles.btnTitle}>{`Login with ${getFingerprintName(
                  isFingerprintEnabled,
                )}`}</Text>
                <Text style={styles.btnText}>
                  {isSwitchOn === false ? 'No set' : 'Set'}
                </Text>
              </View>
            </View>
            <View>
              <Switch
                value={isSwitchOn}
                onValueChange={onToggleSwitch}
                trackColor={{false: 'gray', true: '#E8E8E8'}}
                thumbColor={isSwitchOn ? theme.background : 'white'}
                ios_backgroundColor="#E8E8E8"
              />
            </View>
          </View>

          {/* /////////////////////////////// */}
          <Text style={styles.title}>General</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('NotificationAlerts')}
            style={{
              ...styles.btn,
              borderBottomWidth: 0.5,
              borderBottomColor: theme.gray,
            }}>
            <Notifications width="24" height="22" fill={theme.font} />
            <View style={styles.box}>
              <Text style={styles.btnTitle}>Notifications</Text>
              <Text style={styles.btnText}>Manage notification alerts</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onPressRateApp}
            style={{
              ...styles.btn,
              borderBottomWidth: 0.5,
              borderBottomColor: theme.gray,
            }}>
            <Rate width="25" height="25" fill={theme.font} />
            <View style={styles.box}>
              <Text style={styles.btnTitle}>Rate our App</Text>
              <Text style={styles.btnText}>Rate & Review us</Text>
            </View>
          </TouchableOpacity>
          {tutorialVideos?.length > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('TutorialVideos')}
              style={{
                ...styles.btn,
                borderBottomWidth: 0.5,
                borderBottomColor: theme.gray,
              }}>
              <IoniconsIcon
                name={'play-circle-outline'}
                size={24}
                color={theme.font}
              />
              <View style={styles.box}>
                <Text style={styles.btnTitle}>Tutorial Videos</Text>
                <Text style={styles.btnText} numberOfLines={2}>
                  Learn how to use wallet features
                </Text>
              </View>
            </TouchableOpacity>
          )}
          {/* /////////////////////////////// */}
          <TouchableOpacity
            onPress={() =>
              openInAppBrowser(URLData.terms, inAppBrowserOptions).then()
            }
            style={{
              ...styles.btn,
              borderBottomWidth: 0.5,
              borderBottomColor: theme.gray,
            }}>
            <Terms width="25" height="25" fill={theme.font} />
            <View style={styles.box}>
              <Text style={styles.btnTitle}>Terms & Conditions</Text>
            </View>
          </TouchableOpacity>
          {/* /////////////////////////////// */}
          <TouchableOpacity
            onPress={() =>
              openInAppBrowser(
                URLData.privacyPolicy,
                inAppBrowserOptions,
              ).then()
            }
            style={styles.btn}>
            <Privacy width="25" height="25" fill={theme.font} />
            <View style={styles.box}>
              <Text style={styles.btnTitle}>Privacy Policy</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.title}>Wallet Settings</Text>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('CustomRPC');
            }}
            style={{
              ...styles.btn,
              borderBottomWidth: 0.5,
              borderBottomColor: theme.gray,
            }}>
            <IoniconsIcon
              name={'link-outline'}
              resizeMode={'contain'}
              size={24}
              color={theme.font}
            />
            <View style={[{...styles.box, flex: 1}]}>
              <Text style={styles.btnTitle}>Custom RPC</Text>
              <Text style={styles.btnText} numberOfLines={2}>
                Add your custom RPC URLs.
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('AddressBook');
            }}
            style={{
              ...styles.btn,
              borderBottomWidth: 0.5,
              borderBottomColor: theme.gray,
            }}>
            <FontAwesomeIcon
              name={'address-book'}
              size={24}
              color={theme.font}
            />
            <View style={[{...styles.box, flex: 1}]}>
              <Text style={styles.btnTitle}>Address Book</Text>
              <Text style={styles.btnText} numberOfLines={2}>
                Save your address and use while sending crypto's
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('BackupWallets');
            }}
            style={{
              ...styles.btn,
              borderBottomWidth: 0.5,
              borderBottomColor: theme.gray,
            }}>
            <MaterialCommunityIcons
              name={'cloud-upload'}
              size={24}
              color={theme.font}
            />
            <View style={[{...styles.box, flex: 1}]}>
              <Text style={styles.btnTitle}>Backup Wallets</Text>
              <Text style={styles.btnText} numberOfLines={2}>
                Backup your wallets to Google Drive
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('RestoreWallets');
            }}
            style={{
              ...styles.btn,
              borderBottomWidth: 0.5,
              borderBottomColor: theme.gray,
            }}>
            <MaterialCommunityIcons
              name={'cloud-download'}
              size={24}
              color={theme.font}
            />
            <View style={[{...styles.box, flex: 1}]}>
              <Text style={styles.btnTitle}>Restore Wallets</Text>
              <Text style={styles.btnText} numberOfLines={2}>
                Restore your wallets from Google Drive
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              navigation.navigate('EVMWalletDerivation');
            }}
            style={{
              ...styles.btn,
              borderBottomWidth: 0.5,
              borderBottomColor: theme.gray,
              marginTop: 12,
            }}>
            <AddIcon width="25" height="25" stroke={theme.font} />
            <View style={[{...styles.box, flex: 1}]}>
              <Text style={styles.btnTitle}>EVM, SOL & TRX Addresses</Text>
              <Text style={styles.btnText} numberOfLines={2}>
                Manage multiple addresses for EVM, SOL and TRX
              </Text>
            </View>
          </TouchableOpacity>
          <View
            style={{
              ...styles.btn,
              justifyContent: 'space-between',
              marginTop: 12,
              borderBottomWidth: 0.5,
              borderBottomColor: theme.gray,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
              }}>
              <IoniconsIcon
                name={'chatbox-outline'}
                size={24}
                color={theme.font}
              />
              <View style={styles.box}>
                <Text style={styles.btnTitle}>{'Blockchain Chat'}</Text>
                <Text style={styles.btnText}>
                  {'Messaging services with ethereum address'}
                </Text>
              </View>
            </View>
            <Switch
              value={chatOptions}
              onValueChange={onChangeChatOptions}
              trackColor={{false: 'gray', true: '#E8E8E8'}}
              thumbColor={chatOptions ? theme.background : 'white'}
              ios_backgroundColor="#E8E8E8"
            />
          </View>
          <View
            style={{
              ...styles.btn,
              justifyContent: 'space-between',
              marginTop: 12,
              borderBottomWidth: 0.5,
              borderBottomColor: theme.gray,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
              }}>
              <IoniconsIcon name={'search'} size={24} color={theme.font} />
              <View style={styles.box}>
                <Text style={styles.btnTitle}>
                  {'Search bar in Home screen'}
                </Text>
                <Text style={styles.btnText}>
                  {'Show or Hide Search bar in Home screen'}
                </Text>
              </View>
            </View>
            <Switch
              value={searchInHomeScreen}
              onValueChange={onChangeSearchOptionsHomeScreen}
              trackColor={{false: 'gray', true: '#E8E8E8'}}
              thumbColor={searchInHomeScreen ? theme.background : 'white'}
              ios_backgroundColor="#E8E8E8"
            />
          </View>
          <View
            style={{
              ...styles.btn,
              justifyContent: 'space-between',
              marginTop: 12,
              borderBottomWidth: 0.5,
              borderBottomColor: theme.gray,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
              }}>
              <MaterialCommunityIcons
                name={'security'}
                color={theme.font}
                size={25}
              />
              <View style={styles.box}>
                <Text style={styles.btnTitle}>{'Wallet Reset on Failure'}</Text>
                <Text style={styles.btnText}>
                  {
                    'The wallet resets automatically after 5 failed password attempts.'
                  }
                </Text>
              </View>
            </View>
            <Switch
              value={rateLimitCheck}
              onValueChange={onChangeApplyRateLimit}
              trackColor={{false: 'gray', true: '#E8E8E8'}}
              thumbColor={rateLimitCheck ? theme.background : 'white'}
              ios_backgroundColor="#E8E8E8"
            />
          </View>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('BlockedConversations');
            }}
            style={{
              ...styles.btn,
              borderBottomWidth: 0.5,
              borderBottomColor: theme.gray,
              marginTop: 12,
            }}>
            <EntypeIcon name={'block'} size={24} color={theme.font} />
            <View style={[{...styles.box, flex: 1}]}>
              <Text style={styles.btnTitle}>Blockchain Chat Blocked</Text>
              <Text style={styles.btnText} numberOfLines={2}>
                Manage blocked addresses for blockchain chat
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('PrivacyMode');
            }}
            style={{
              ...styles.btn,
              marginTop: 12,
            }}>
            <MaterialCommunityIcons
              name={'security'}
              color={theme.font}
              size={25}
            />
            <View style={[{...styles.box, flex: 1}]}>
              <Text style={styles.btnTitle}>Privacy Mode</Text>
              <Text style={styles.btnText} numberOfLines={2}>
                Enhance privacy by auto-resetting addresses on app restart
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
        <ModalFingerprint
          visible={showModalVarify}
          hideModal={setShowModalVarify}
          fingerprintEnabled={isFingerprintEnabled}
        />
        <ModalFingerprintVerification
          visible={showModalPass}
          hideModal={setShowModalPass}
          fingerprintEnabled={isFingerprintEnabled}
        />
        <ModalConfirmEnableChatModal
          visible={isChatModalVisible}
          onPressNo={() => {
            setIsChatModalVisible(false);
          }}
          onPressYes={() => {
            setIsChatModalVisible(false);
            dispatch(updateChatOptions(true));
          }}
        />
      </View>
    </DokSafeAreaView>
  );
};

export default Settings;
