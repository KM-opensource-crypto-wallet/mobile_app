import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from 'react';
import {
  View,
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
  AppState,
} from 'react-native';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import Animated, {
  LayoutAnimationConfig,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
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
import {
  AppButton,
  AppText,
  BiometricButton,
  CollapsibleView,
  controlHeight,
  GradientBackground,
  PasswordInput,
  spacing,
  useKeyboardCollapse,
} from 'components/ui';

// The wordmark is 210x85 in both white-label variants.
const LOGO_RATIO = 210 / 85;
const LOGO_HEIGHT = 56;
// Everything below is expressed as "value at rest" -> "value with the keyboard
// up", interpolated by the `collapse` shared value.
const LOGO_SCALE_COMPACT = 0.78;
const LOGO_MARGIN = {rest: 48, compact: spacing.xl};
const HERO_MARGIN = {rest: 84, compact: spacing.xxl};
const HERO_GAP = spacing.xl;
const HEADING_SCALE_COMPACT = 0.92;
const COMPACT_BIO_GAP = spacing.md;

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
  // The device's real biometry, so a Touch ID phone never shows a Face ID glyph.
  const [bioType, setBioType] = useState('faceid');
  const storePassword = useSelector(getUserPassword);
  const fingerprint = useSelector(isFingerprint);
  const allWallets = useSelector(selectAllWallets);
  const isNoAppUpdate = useSelector(isNoUpdateAvailable);
  const appState = useRef(AppState.currentState);
  const rateLimitCheck = useSelector(isWalletReset);
  const lastAttempt = useSelector(getLastAttempt);

  // Tracks the keyboard, except while a modal layered over this screen owns it -
  // the reset sheet and the last-attempt dialog both have their own fields, and
  // their keyboards must not reshape the screen behind them.
  const {collapse} = useKeyboardCollapse({suppressed: modal || lastAttempt});

  const showBio = fingerprint && isNoAppUpdate;

  // 1 = hidden. The hero tile folds away as the keyboard rises; the compact one
  // beside the field does the opposite.
  const heroCollapsed = useDerivedValue(() => collapse.value);
  const compactCollapsed = useDerivedValue(() => 1 - collapse.value);

  const logoStyle = useAnimatedStyle(() => ({
    marginTop:
      LOGO_MARGIN.rest +
      (LOGO_MARGIN.compact - LOGO_MARGIN.rest) * collapse.value,
    transform: [{scale: 1 - (1 - LOGO_SCALE_COMPACT) * collapse.value}],
  }));

  const heroStyle = useAnimatedStyle(() => ({
    marginTop:
      HERO_MARGIN.rest +
      (HERO_MARGIN.compact - HERO_MARGIN.rest) * collapse.value,
  }));

  // The gap belongs to the tile, not the hero container, so the copy sits flush
  // under the heading once the tile has folded away.
  const heroTileStyle = useAnimatedStyle(() => ({
    marginBottom: HERO_GAP * (1 - collapse.value),
  }));

  const headingStyle = useAnimatedStyle(() => ({
    transform: [{scale: 1 - (1 - HEADING_SCALE_COMPACT) * collapse.value}],
  }));

  const compactBioStyle = useAnimatedStyle(() => ({
    marginLeft: COMPACT_BIO_GAP * collapse.value,
  }));

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
    let cancelled = false;
    FingerprintScanner.isSensorAvailable()
      .then(biometry => {
        // iOS reports 'Face ID' / 'Touch ID'; Android reports 'Biometrics',
        // where a fingerprint glyph is the safer default.
        if (!cancelled) {
          setBioType(biometry === 'Face ID' ? 'faceid' : 'touchid');
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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

  const bioLabel = bioType === 'faceid' ? 'Face ID' : 'Touch ID';

  const bioCopy = {
    scanning: {
      title: bioType === 'faceid' ? 'Scanning face…' : 'Checking fingerprint…',
      subtitle: 'Hold still for a moment',
    },
    success: {title: 'Unlocked', subtitle: 'Opening your wallet…'},
    idle: {
      title: `Unlock with ${bioLabel}`,
      subtitle: 'Tap the icon, or use your password',
    },
  }[bioState];

  const heading = showBio
    ? bioCopy
    : {
        title: 'Welcome back',
        subtitle: 'Enter your password to unlock your wallet',
      };

  const Logo = isDarkMode ? LOGO_DARK : LOGO;

  return (
    <LayoutAnimationConfig skipEntering>
      <GradientBackground progress={collapse}>
        <SafeAreaView style={styles.safeAreaView}>
          <KeyboardAvoidingView behavior="padding" style={styles.scroll}>
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}>
              <TouchableWithoutFeedback
                onPress={Keyboard.dismiss}
                accessible={false}>
                <View style={styles.container}>
                  <Animated.View style={logoStyle}>
                    <Logo
                      width={Math.round(LOGO_HEIGHT * LOGO_RATIO)}
                      height={LOGO_HEIGHT}
                    />
                  </Animated.View>

                  <Animated.View style={[styles.hero, heroStyle]}>
                    {showBio && (
                      <CollapsibleView
                        collapsed={heroCollapsed}
                        style={heroTileStyle}>
                        <BiometricButton
                          type={bioType}
                          state={bioState}
                          onPress={handleFingerprintAuth}
                        />
                      </CollapsibleView>
                    )}
                    <Animated.View style={[styles.heroCopy, headingStyle]}>
                      <AppText variant="h1" style={styles.title}>
                        {heading.title}
                      </AppText>
                      <AppText
                        variant="body"
                        tone="muted"
                        style={styles.subtitle}>
                        {heading.subtitle}
                      </AppText>
                    </Animated.View>
                  </Animated.View>

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
                          {showBio && (
                            <CollapsibleView
                              collapsed={compactCollapsed}
                              axis="width"
                              size={controlHeight}
                              style={compactBioStyle}>
                              <BiometricButton
                                size="compact"
                                type={bioType}
                                state={bioState}
                                onPress={handleFingerprintAuth}
                              />
                            </CollapsibleView>
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

                        <CollapsibleView collapsed={heroCollapsed}>
                          <View style={styles.footer}>
                            <View style={styles.footerNote}>
                              <Icon
                                name="lock-outline"
                                size={13}
                                color={theme.textFaint}
                              />
                              <AppText variant="caption" tone="faint">
                                Non-custodial · your keys never leave this
                                device
                              </AppText>
                            </View>
                            <View style={styles.homeIndicator} />
                          </View>
                        </CollapsibleView>
                      </View>
                    )}
                  </Formik>
                </View>
              </TouchableWithoutFeedback>
            </ScrollView>
          </KeyboardAvoidingView>
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
    </LayoutAnimationConfig>
  );
};
export default LoginComponent;
