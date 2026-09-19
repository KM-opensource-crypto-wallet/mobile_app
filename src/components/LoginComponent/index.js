import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Keyboard,
  TouchableWithoutFeedback,
  AppState,
} from 'react-native';
import {TextInput} from 'react-native-paper';
import {Formik} from 'formik';
import {useSelector, useDispatch} from 'react-redux';
import {
  logInSuccess,
  fingerprintAuthSuccess,
  loadingOff,
} from 'dok-wallet-blockchain-networks/redux/auth/authSlice';
import {validationSchemaLogin} from 'utils/validationSchema';
import ModalReset from 'components/ModalReset';
import {isFingerprint} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {ThemeContext} from 'theme/ThemeContext';
import {
  UNLOCK_ERROR_CODES,
  getBiometricUnlockState,
  isInvalidPassword,
  unlockWithBiometric,
  unlockWithPassword,
} from 'security/unlockFlow';
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
import {addBreadcrumb, captureError} from 'services/logger';

const LoginComponent = ({onClose, visible}) => {
  const navigation = useNavigation();
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const {consumePendingLoginRedirect} = useLocalNotification();

  const dispatch = useDispatch();
  const [hide, setHide] = useState(true);
  const [wrong, setWrong] = useState(false);
  const [modal, setModal] = useState(false);
  // One-line hint above the password field (biometrics need re-enabling) or a
  // blocking problem (wallets without keys) that must not be dismissed.
  const [notice, setNotice] = useState(null);
  const [blocked, setBlocked] = useState(null);
  const fingerprint = useSelector(isFingerprint);
  const allWallets = useSelector(selectAllWallets);
  const isNoAppUpdate = useSelector(isNoUpdateAvailable);
  const appState = useRef(AppState.currentState);
  const rateLimitCheck = useSelector(isWalletReset);

  const lastAttempt = useSelector(getLastAttempt);

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

  // Biometric unlock reads the DEK from the biometric-bound secure item; the
  // OS shows its own prompt. When the setting is on but the item is missing
  // (Android right after migration, or after an enrollment change) the user
  // types the password once and unlockFlow re-creates it.
  const handleFingerprintAuth = useCallback(async () => {
    if (!fingerprint || !isNoAppUpdate) {
      return;
    }
    const biometricState = await getBiometricUnlockState();
    if (biometricState === 'unavailable') {
      // No enrolled sensor (or a simulator): password only, no nagging.
      return;
    }
    if (biometricState === 'not_enrolled') {
      setNotice(
        `Enter your password once to enable ${WL_APP_NAME} biometric unlock.`,
      );
      return;
    }
    try {
      await dispatch(unlockWithBiometric());
      dispatch(fingerprintAuthSuccess(true));
      if (hasWallet()) {
        redirectSuccess();
      } else {
        navigation.reset({
          index: 0,
          routes: [{name: 'ResetWallet', params: {isFromOnBoarding: true}}],
        });
      }
    } catch (error) {
      switch (error?.code) {
        case UNLOCK_ERROR_CODES.BIOMETRIC_CANCELLED:
          break;
        case UNLOCK_ERROR_CODES.BIOMETRIC_INVALIDATED:
          setNotice(
            'Your device biometrics changed. Enter your password once to re-enable biometric unlock.',
          );
          break;
        case UNLOCK_ERROR_CODES.MISSING_SECRETS:
          setBlocked(error.message);
          break;
        default:
          captureError(error, {tags: {area: 'auth', op: 'unlock_biometric'}});
          setNotice('Biometric unlock failed. Enter your password.');
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
      let unlocked = false;
      try {
        // "Correct password" = the vault's DEK unwrapped; nothing is compared.
        await dispatch(unlockWithPassword(values.password));
        unlocked = true;
      } catch (error) {
        if (isInvalidPassword(error)) {
          // fall through to the wrong-password handling below
        } else if (error?.code === UNLOCK_ERROR_CODES.MISSING_SECRETS) {
          setBlocked(error.message);
          dispatch(loadingOff());
          return;
        } else {
          captureError(error, {tags: {area: 'auth', op: 'unlock_password'}});
          setBlocked(
            'Your wallet could not be unlocked because its secure storage is unavailable. Please restart the app.',
          );
          dispatch(loadingOff());
          return;
        }
      }
      if (unlocked) {
        if (rateLimitCheck) {
          dispatch(resetAttempts());
        }
        setNotice(null);
        dispatch(fingerprintAuthSuccess(true));
        dispatch(logInSuccess());
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
    [dispatch, hasWallet, navigation, onClose, rateLimitCheck, redirectSuccess],
  );
  return (
    <SafeAreaView style={styles.safeAreaView}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.formInput}>
            {theme.backgroundColor === '#121212' ? <LOGO_DARK /> : <LOGO />}
            <Text style={styles.title}>Sign in</Text>
            <Formik
              initialValues={{password: ''}}
              validationSchema={validationSchemaLogin}
              onSubmit={handleSubmit}>
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
              }) => (
                <View>
                  <TextInput
                    textColor={theme.font}
                    style={styles.input}
                    label="Password"
                    theme={{
                      colors: {
                        onSurfaceVariant: '#989898',
                        primary: errors.password ? 'red' : '#989898',
                      },
                    }}
                    outlineColor={errors.password ? 'red' : '#989898'}
                    activeOutlineColor={
                      errors.password ? 'red' : theme.borderActiveColor
                    }
                    autoCapitalize="none"
                    returnKeyType="next"
                    mode="outlined"
                    secureTextEntry={hide ? true : false}
                    blurOnSubmit={false}
                    right={
                      <TextInput.Icon
                        icon={hide ? 'eye' : 'eye-off'}
                        onPress={() => setHide(!hide)}
                      />
                    }
                    name="password"
                    autoFocus={!fingerprint && isNoAppUpdate}
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    value={values.password}
                  />
                  {errors.password && touched.password && (
                    <Text style={styles.textConfirm}>{errors.password}</Text>
                  )}
                  {wrong === true && (
                    <Text style={styles.textWarning}>
                      * You have entered an invalid password
                    </Text>
                  )}
                  {notice ? (
                    <Text style={styles.textWarning}>{notice}</Text>
                  ) : null}
                  {blocked ? (
                    <Text style={styles.textWarning}>{blocked}</Text>
                  ) : null}

                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleSubmit}>
                    <Text style={styles.buttonTitle}>Sign in</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
            {!onClose && (
              <View style={styles.reset}>
                <Text style={styles.resetTitle}>Forgot your password?</Text>
                <TouchableOpacity
                  // onPress={() => navigation.navigate('Registration')}
                  onPress={() => {
                    Keyboard.dismiss();
                    setModal(true);
                  }}>
                  <Text style={styles.resetText}>
                    Reset your wallet by using you seed phrase
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
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
    </SafeAreaView>
  );
};
export default LoginComponent;
