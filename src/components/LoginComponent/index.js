import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from 'react';
import {View, Keyboard, TouchableWithoutFeedback, AppState} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Formik} from 'formik';
import {useSelector, useDispatch} from 'react-redux';
import {
  logInSuccess,
  fingerprintAuthSuccess,
  loadingOff,
} from 'dok-wallet-blockchain-networks/redux/auth/authSlice';
import {getUserPassword} from 'dok-wallet-blockchain-networks/redux/auth/authSelectors';
import {validationSchemaLogin} from 'utils/validationSchema';
import ModalReset from 'components/ModalReset';
import {isFingerprint} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import FingerprintScanner from 'react-native-fingerprint-scanner';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './LoginScreenStyles';
import {selectAllWallets} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {isNoUpdateAvailable} from 'dok-wallet-blockchain-networks/redux/extraData/extraSelectors';
import {LOGO, LOGO_DARK, WL_APP_NAME} from 'utils/wlData';
import ModalInfo from 'components/ModalInfo';
import {Constants} from 'utils/common';
import {isWalletReset} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {
  resetAttempts,
  handleAttempts,
  setLastAttempt,
} from 'dok-wallet-blockchain-networks/redux/auth/authSlice';
import {getLastAttempt} from 'dok-wallet-blockchain-networks/redux/auth/authSelectors';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useLocalNotification} from 'providers/hooks/useLocalNotification';
import {addBreadcrumb} from 'services/logger';
import {useKeyboardHeight} from 'hooks/useKeyboardHeight';
import {
  AppButton,
  AppText,
  BiometricButton,
  GradientBackground,
  PasswordInput,
} from 'components/ui';

// The wordmark is 210x85 in both white-label variants.
const LOGO_RATIO = 210 / 85;

const LoginComponent = ({onClose, visible}) => {
  const navigation = useNavigation();
  const {theme, isDarkMode} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const {consumePendingLoginRedirect} = useLocalNotification();

  const dispatch = useDispatch();
  const [wrong, setWrong] = useState(false);
  const [modal, setModal] = useState(false);
  // 'idle' | 'scanning' | 'success' - drives the biometric tile and its copy.
  const [bioState, setBioState] = useState('idle');
  const storePassword = useSelector(getUserPassword);
  const fingerprint = useSelector(isFingerprint);
  const allWallets = useSelector(selectAllWallets);
  const isNoAppUpdate = useSelector(isNoUpdateAvailable);
  const appState = useRef(AppState.currentState);
  const rateLimitCheck = useSelector(isWalletReset);
  const keyboardHeight = useKeyboardHeight();

  const lastAttempt = useSelector(getLastAttempt);

  const keyboardOpen = keyboardHeight > 0;
  const showBio = fingerprint && isNoAppUpdate;

  const redirectSuccess = useCallback(() => {
    addBreadcrumb('auth', 'unlock', {via: onClose ? 'modal' : 'screen'});
    // Cold start with a pending notification mounts two of these at once
    // (this base Login screen instance and LoginModal on top of it) - only
    // whichever one calls this first actually redirects for it.
    const handledPendingNotification = consumePendingLoginRedirect();
    if (onClose) {
      onClose();
    } else if (!handledPendingNotification) {
      navigation.reset({
        index: 0,
        routes: [{name: 'Sidebar'}],
      });
      dispatch(loadingOff());
    }
  }, [consumePendingLoginRedirect, dispatch, navigation, onClose]);

  const hasWallet = useCallback(() => {
    return allWallets?.length !== 0;
  }, [allWallets]);

  const handleFingerprintAuth = useCallback(async () => {
    if (fingerprint && isNoAppUpdate) {
      try {
        setBioState('scanning');
        const isAuth = await FingerprintScanner.authenticate({
          description: `Unlock ${WL_APP_NAME} with your fingerprint`,
        });
        setBioState('success');
        dispatch(fingerprintAuthSuccess(isAuth));
        if (hasWallet()) {
          redirectSuccess();
        } else {
          navigation.reset({
            index: 0,
            routes: [{name: 'ResetWallet', params: {isFromOnBoarding: true}}],
          });
        }
      } catch (error) {
        setBioState('idle');
        if (error.name === 'SystemCancel') {
          console.error('Authentication was canceled by the system');
        } else {
          console.error('Error checking fingerprint settings:', error);
        }
      } finally {
        FingerprintScanner.release();
      }
    }
  }, [
    fingerprint,
    isNoAppUpdate,
    dispatch,
    hasWallet,
    redirectSuccess,
    navigation,
  ]);

  useEffect(() => {
    dispatch(loadingOff());
    if (isNoAppUpdate) {
      handleFingerprintAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNoAppUpdate]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/background/) && nextAppState === 'active') {
        handleFingerprintAuth();
      }
      appState.current = nextAppState;
    });
    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleSubmit = useCallback(
    async values => {
      Keyboard.dismiss();
      if (storePassword === values.password) {
        if (rateLimitCheck) {
          dispatch(resetAttempts());
        }
        dispatch(fingerprintAuthSuccess(true));
        dispatch(logInSuccess(values.password));
        dispatch(loadingOff());
        if (hasWallet()) {
          redirectSuccess();
        } else {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'ResetWallet',
                params: {isFromOnBoarding: true},
              },
            ],
          });
          onClose?.();
        }
      } else if (rateLimitCheck) {
        const resp = await dispatch(handleAttempts({navigation})).unwrap();
        if (resp?.successful_deleted) {
          onClose?.();
        }
        setWrong(true);
        dispatch(loadingOff());
      } else {
        setWrong(true);
        dispatch(loadingOff());
      }
    },
    [
      dispatch,
      hasWallet,
      navigation,
      onClose,
      rateLimitCheck,
      redirectSuccess,
      storePassword,
    ],
  );

  const bioCopy = {
    scanning: {title: 'Scanning…', subtitle: 'Hold still for a moment'},
    success: {title: 'Unlocked', subtitle: 'Opening your wallet…'},
    idle: {
      title: 'Unlock to continue',
      subtitle: 'Tap the icon, or use your password',
    },
  }[bioState];

  const heading = showBio
    ? bioCopy
    : {
        title: 'Welcome back',
        subtitle: 'Enter your password to unlock your wallet',
      };

  const logoHeight = keyboardOpen ? 40 : 46;
  const Logo = isDarkMode ? LOGO_DARK : LOGO;

  return (
    <GradientBackground glowTop={keyboardOpen ? 60 : 140}>
      <SafeAreaView style={styles.safeAreaView}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.container}>
            <Logo
              width={Math.round(logoHeight * LOGO_RATIO)}
              height={logoHeight}
              style={keyboardOpen ? styles.logoCompact : styles.logo}
            />

            <View
              style={[
                styles.hero,
                keyboardOpen ? styles.heroSpacingCompact : styles.heroSpacing,
              ]}>
              {showBio && !keyboardOpen && (
                <BiometricButton
                  state={bioState}
                  onPress={handleFingerprintAuth}
                />
              )}
              <View style={styles.heroCopy}>
                <AppText
                  variant={keyboardOpen ? 'title' : 'h1'}
                  style={styles.title}>
                  {heading.title}
                </AppText>
                <AppText variant="body" tone="muted" style={styles.subtitle}>
                  {heading.subtitle}
                </AppText>
              </View>
            </View>

            <Formik
              initialValues={{password: ''}}
              validationSchema={validationSchemaLogin}
              onSubmit={handleSubmit}>
              {({
                handleChange,
                handleBlur,
                handleSubmit: submitForm,
                values,
                errors,
                touched,
                isSubmitting,
              }) => (
                <View style={styles.bottom}>
                  <View style={styles.fieldRow}>
                    <PasswordInput
                      containerStyle={styles.field}
                      error={
                        errors.password && touched.password
                          ? errors.password
                          : undefined
                      }
                      returnKeyType="go"
                      autoFocus={!fingerprint && isNoAppUpdate}
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                      onSubmitEditing={submitForm}
                      value={values.password}
                    />
                    {showBio && keyboardOpen && (
                      <BiometricButton
                        size="compact"
                        state={bioState}
                        onPress={handleFingerprintAuth}
                      />
                    )}
                  </View>

                  {wrong && (
                    <AppText
                      variant="label"
                      tone="danger"
                      style={styles.warning}>
                      You have entered an invalid password
                    </AppText>
                  )}

                  <AppButton
                    title={isSubmitting ? 'Unlocking…' : 'Sign in'}
                    loading={isSubmitting}
                    onPress={submitForm}
                  />

                  {!onClose && (
                    <AppButton
                      variant="link"
                      title="Forgot password? Reset all wallets & start over"
                      onPress={() => {
                        Keyboard.dismiss();
                        setModal(true);
                      }}
                    />
                  )}

                  {!keyboardOpen && (
                    <View style={styles.footer}>
                      <View style={styles.footerNote}>
                        <Icon
                          name="lock-outline"
                          size={13}
                          color={theme.textFaint}
                        />
                        <AppText variant="caption" tone="faint">
                          Non-custodial · your keys never leave this device
                        </AppText>
                      </View>
                      <View style={styles.homeIndicator} />
                    </View>
                  )}
                </View>
              )}
            </Formik>
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>

      <ModalInfo
        visible={lastAttempt}
        title={Constants.lastAttempt.title}
        message={Constants.lastAttempt.subTitle}
        handleClose={() => dispatch(setLastAttempt(false))}
        showTextInput={true}
        confirmPrompt={'Confirm'}
      />
      <ModalReset
        visible={modal}
        hideModal={setModal}
        navigation={navigation}
        page={'Forgot'}
      />
    </GradientBackground>
  );
};
export default LoginComponent;
