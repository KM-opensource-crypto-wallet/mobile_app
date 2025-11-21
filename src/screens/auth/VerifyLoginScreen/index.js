import React, {useState, useEffect, useCallback, useContext} from 'react';
import {TouchableOpacity, View, Text, Keyboard} from 'react-native';
import {TextInput} from 'react-native-paper';
import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';
import {
  fingerprintAuthSuccess,
  loadingOff,
  loadingOn,
} from 'dok-wallet-blockchain-networks/redux/auth/authSlice';
import {
  getUserPassword,
  getFingerprintAuth,
} from 'dok-wallet-blockchain-networks/redux/auth/authSelectors';
import {validationSchemaLogin} from 'utils/validationSchema';
import ModalReset from 'components/ModalReset';
import {isFingerprint} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import FingerprintScanner from 'react-native-fingerprint-scanner';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './VerifyLoginScreenStyles';

import {IS_IOS} from 'utils/dimensions';
import {WL_APP_NAME} from 'utils/wlData';

export const VerifyLoginScreen = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const dispatch = useDispatch();
  const [hide, setHide] = useState(true);
  const [wrong, setWrong] = useState(false);
  const [modal, setModal] = useState(false);
  const storePassword = useSelector(getUserPassword);
  const fingerprint = useSelector(isFingerprint);
  const isFinger = useSelector(getFingerprintAuth);

  const handleFingerprintAuth = useCallback(async () => {
    if (fingerprint) {
      try {
        const isAuth = await FingerprintScanner.authenticate({
          description: `Unlock ${WL_APP_NAME} with your fingerprint`,
        });

        dispatch(fingerprintAuthSuccess(isAuth));
        navigation.navigate('VerifyCreate', {isHideNextButton: true});
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
  }, [dispatch, fingerprint, navigation]);

  useEffect(() => {
    dispatch(loadingOff());
    setTimeout(() => {
      handleFingerprintAuth().then();
    }, 200);
  }, [dispatch, handleFingerprintAuth]);

  useEffect(() => {
    if (!isFinger) {
      handleFingerprintAuth().then();
    }
  }, [isFinger, handleFingerprintAuth]);

  const handleSubmit = values => {
    dispatch(loadingOn());
    Keyboard.dismiss();
    if (storePassword === values.password) {
      dispatch(loadingOff());
      dispatch(fingerprintAuthSuccess(true));
      navigation.navigate('VerifyCreate', {isHideNextButton: true});
    } else {
      setWrong(true);
      dispatch(loadingOff());
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.formInput}>
          <Text style={[styles.resetTitle, {marginBottom: 16}]}>
            {'Please enter your password to access the seed phrase'}
          </Text>
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
                  style={styles.input}
                  label="Password"
                  textColor={theme.font}
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
                  autoFocus={true}
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

                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                  <Text style={styles.buttonTitle}>Verify</Text>
                </TouchableOpacity>
              </View>
            )}
          </Formik>
          {/*<View style={styles.reset}>*/}
          {/*  <Text style={styles.resetTitle}>Forgot you password?</Text>*/}
          {/*  <TouchableOpacity*/}
          {/*    // onPress={() => navigation.navigate('Registration')}*/}
          {/*    onPress={() => setModal(true)}>*/}
          {/*    <Text style={styles.resetText}>*/}
          {/*      Reset your wallet by using you seed phrase*/}
          {/*    </Text>*/}
          {/*  </TouchableOpacity>*/}
          {/*</View>*/}
        </View>
      </View>
      {/*<ModalReset*/}
      {/*  visible={modal}*/}
      {/*  hideModal={setModal}*/}
      {/*  navigation={navigation}*/}
      {/*  page={'Forgot'}*/}
      {/*/>*/}
    </>
  );
};
