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
    SafeAreaView,
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
import {IS_IOS, useFloatingHeight} from 'utils/dimensions';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './LoginScreenStyles';
import {selectAllWallets} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {isNoUpdateAvailable} from 'dok-wallet-blockchain-networks/redux/extraData/extraSelectors';
import {LOGO, LOGO_DARK, WL_APP_NAME} from 'utils/wlData';

const LoginComponent = ({navigation, onClose, visible}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const dispatch = useDispatch();
  const [hide, setHide] = useState(true);
  const [wrong, setWrong] = useState(false);
  const [modal, setModal] = useState(false);
  const storePassword = useSelector(getUserPassword);
  const fingerprint = useSelector(isFingerprint);
  const floatingBtnHeight = useFloatingHeight();
  const allWallets = useSelector(selectAllWallets);
  const isNoAppUpdate = useSelector(isNoUpdateAvailable);
  const appState = useRef(AppState.currentState);

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
  const handleSubmit = values => {
    Keyboard.dismiss();
    if (storePassword === values.password) {
      dispatch(fingerprintAuthSuccess(true));
      dispatch(logInSuccess(values.password));
      dispatch(loadingOff());
      if (hasWallet()) {
        redirectSuccess();
      } else {
        navigation.reset({
          index: 0,
          routes: [{name: 'ResetWallet', params: {isFromOnBoarding: true}}],
        });
      }
    } else {
      setWrong(true);
      dispatch(loadingOff());
    }
  };

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    //use this safeareaview don't use other
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
                    returnKeyType="done"
                    mode="outlined"
                    secureTextEntry={hide ? true : false}
                    blurOnSubmit={false}
                    right={
                      <TextInput.Icon
                        icon={hide ? 'eye' : 'eye-off'}
                        onPress={() => setHide(!hide)}
                      />
                    }
                    onSubmitEditing={dismissKeyboard}
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
