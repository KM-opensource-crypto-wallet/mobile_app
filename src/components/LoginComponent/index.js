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
import {BIOMETRIC_OUTCOMES, biometricGate} from 'security/biometricPromptGate';

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
  // True once the vault reports a usable biometric copy: shows the manual
  // "use fingerprint" affordance for after a cancelled/failed prompt.
  const [biometricReady, setBiometricReady] = useState(false);
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
  // One OS prompt at a time, shared across LoginScreen + LoginModal, and no
  // automatic re-prompt after a cancel or a terminal failure: the OS prompt
  // (and Android's lockout-recovery PIN screen) pause/resume the activity, so
  // an unguarded foreground trigger looped prompt → PIN → prompt.
  const handleFingerprintAuth = useCallback(async () => {
    if (!fingerprint || !isNoAppUpdate) {
      return;
    }
    if (!biometricGate.begin()) {
      return;
    }
    let outcome = BIOMETRIC_OUTCOMES.SKIPPED;
    try {
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
      setBiometricReady(true);
      try {
        await dispatch(unlockWithBiometric());
        outcome = BIOMETRIC_OUTCOMES.SUCCESS;
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
        outcome = BIOMETRIC_OUTCOMES.TERMINAL;
        switch (error?.code) {
          case UNLOCK_ERROR_CODES.BIOMETRIC_CANCELLED:
            outcome = BIOMETRIC_OUTCOMES.CANCELLED;
            break;
          case UNLOCK_ERROR_CODES.BIOMETRIC_INVALIDATED:
            setNotice(
              'Your device biometrics changed. Enter your password once to re-enable biometric unlock.',
            );
            break;
          case UNLOCK_ERROR_CODES.BIOMETRIC_LOCKED_OUT:
            // OS lockout after repeated failures: expected user state, not a defect.
            setNotice(
              'Too many attempts. Biometric unlock is locked for now, enter your password.',
            );
            break;
          case UNLOCK_ERROR_CODES.MISSING_SECRETS:
            setBlocked(error.message);
            break;
          default:
            // e.g. the OS completed the prompt with the device PIN during
            // sensor recovery and the biometric-only key refused the cipher.
            captureError(error, {
              level: 'warning',
              tags: {area: 'auth', op: 'unlock_biometric'},
            });
            setNotice(
              'Biometric unlock is not available right now. Enter your password.',
            );
        }
      }
    } finally {
      biometricGate.end(outcome);
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
      // A fresh Login mount is a user-visible moment: lift any suppression
      // left by an earlier cancel/failure and prompt once.
      biometricGate.reset();
      handleFingerprintAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNoAppUpdate]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/background/) &&
        nextAppState === 'active' &&
        biometricGate.shouldAutoPrompt()
      ) {
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
                  {fingerprint && biometricReady && !blocked ? (
                    <TouchableOpacity
                      style={styles.reset}
                      onPress={() => {
                        Keyboard.dismiss();
                        // Explicit user action lifts the post-cancel/failure
                        // suppression; the gate still refuses a second prompt
                        // while one is open.
                        biometricGate.reset();
                        handleFingerprintAuth();
                      }}>
                      <Text style={styles.resetText}>
                        Use fingerprint / face unlock
                      </Text>
                    </TouchableOpacity>
                  ) : null}
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
