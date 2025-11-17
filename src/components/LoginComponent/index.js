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
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRateLimit} from 'hooks/useRateLimit';
import {showToast} from 'utils/toast';
import ModalInfo from 'components/ModalInfo';
import {Constants} from 'utils/common';
import {resetWallet} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {resetCurrentTransferData} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSlice';
import {resetBatchTransactions} from 'dok-wallet-blockchain-networks/redux/batchTransaction/batchTransactionSlice';
import {logOutSuccess} from 'dok-wallet-blockchain-networks/redux/auth/authSlice';
import {isWalletReset} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';

const LoginComponent = ({navigation, onClose, visible}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const dispatch = useDispatch();
  const [hide, setHide] = useState(true);
  const [wrong, setWrong] = useState(false);
  const [modal, setModal] = useState(false);
  const [lastAttempt, setLastAttempt] = useState(false);
  const storePassword = useSelector(getUserPassword);
  const fingerprint = useSelector(isFingerprint);
  const allWallets = useSelector(selectAllWallets);
  const isNoAppUpdate = useSelector(isNoUpdateAvailable);
  const appState = useRef(AppState.currentState);
  const rateLimitCheck = useSelector(isWalletReset);
  const {attempts, recordFailure, maxAttempts, resetAttempts} = useRateLimit();
  const redirectSuccess = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      navigation.reset({
        index: 0,
        routes: [{name: 'Sidebar'}],
      });
      dispatch(loadingOff());
    }
  }, [dispatch, navigation, onClose]);

  const hasWallet = useCallback(() => {
    return allWallets?.length !== 0;
  }, [allWallets]);

  const handleFingerprintAuth = useCallback(async () => {
    if (fingerprint && isNoAppUpdate) {
      try {
        const isAuth = await FingerprintScanner.authenticate({
          description: `Unlock ${WL_APP_NAME} with your fingerprint`,
        });
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
  const handleSubmit = async values => {
    Keyboard.dismiss();
    if (storePassword === values.password) {
      if (rateLimitCheck) {
        await resetAttempts();
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
      }
    } else if (rateLimitCheck) {
      const threshold = maxAttempts - 1; // e.g. 3 when maxAttempts = 5
      const failureCount = await recordFailure(); // includes time-window cleanup
      const attemptsLeft = maxAttempts - failureCount;
      if (failureCount >= threshold) {
        if (attemptsLeft === 1) {
          // Show last-attempt warning modal
          setLastAttempt(true);
        } else if (attemptsLeft <= 0) {
          // Delete wallet on exhausting attempts
          showToast({
            type: 'warningToast',
            title: 'Wallet deleted',
            message: `Attempts left ${attemptsLeft}`,
          });
          await resetAttempts(); // clear client-side rate-limit state
          dispatch(resetWallet());
          dispatch(resetCurrentTransferData());
          dispatch(resetBatchTransactions());
          dispatch(logOutSuccess());
          setTimeout(() => {
            navigation?.reset({
              index: 0,
              routes: [{name: 'CarouselCards'}],
            });
          }, 200);
        }
        setWrong(true);
        dispatch(loadingOff());
      } else {
        setWrong(true);
        dispatch(loadingOff());
        showToast({
          type: 'warningToast',
          title: `${attemptsLeft}`,
          message: 'Attempts left',
        });
      }
    } else {
      setWrong(true);
      dispatch(loadingOff());
    }
  };

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
                <Text style={styles.resetTitle}>Forgot you password?</Text>
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
        requireConfirm
        handleClose={() => setLastAttempt(false)}
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
