import React, {useContext, useState, useEffect} from 'react';
import {TouchableOpacity, View, Text, Keyboard} from 'react-native';
import {TextInput} from 'react-native-paper';
import {Formik} from 'formik';
import {
  loadingOff,
  loadingOn,
  signUpSuccess,
} from 'dok-wallet-blockchain-networks/redux/auth/authSlice';
import {UNLOCK_ERROR_CODES, createAccount} from 'security/unlockFlow';
import {captureError} from 'services/logger';
import {showToast} from 'utils/toast';
// import styles from './RegistrationScreenStyles';
import {validationSchemaRegistration} from 'utils/validationSchema';
import {IS_IOS, useFloatingHeight} from 'utils/dimensions';
import myStyles from './RegistrationScreenStyles';
import {ThemeContext} from 'theme/ThemeContext';
import {useDispatch} from 'react-redux';
import {DokSafeAreaView} from 'components/DokSafeAreaView';

export const RegistrationScreen = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const dispatch = useDispatch();
  const [hide, setHide] = useState(true);
  const [hideConfirm, setHideConfirm] = useState(true);
  const floatingBtnHeight = useFloatingHeight();

  // The password never gets stored: it wraps a fresh vault key (and, for
  // legacy wallets migrated without one, receives their keys).
  const handleSubmit = async values => {
    dispatch(loadingOn());
    Keyboard.dismiss();
    try {
      await dispatch(createAccount(values.password));
    } catch (error) {
      dispatch(loadingOff());
      if (error?.code === UNLOCK_ERROR_CODES.ACCOUNT_EXISTS) {
        // Never replace an existing account's vault from here; only the
        // reset flow may. Hand over to Login.
        showToast({
          type: 'errorToast',
          title: 'Account already exists',
          message: error.message,
        });
        navigation.replace('Login');
        return;
      }
      captureError(error, {tags: {area: 'vault', op: 'create'}});
      showToast({
        type: 'errorToast',
        title: 'Could not create wallet storage',
        message: 'Secure storage is unavailable. Please try again.',
      });
      return;
    }
    dispatch(signUpSuccess());
    navigation.replace('ResetWallet', {isFromOnBoarding: true});
  };

  return (
    <DokSafeAreaView style={styles.safeAreaView}>
      <View style={styles.container}>
        <View style={styles.formInput}>
          <Text
            style={{
              ...styles.title,
              marginTop: floatingBtnHeight > 300 ? 20 : 0,
            }}>
            Create account
          </Text>
          <Text style={styles.text}>
            Enter and confirm your new password bellow
          </Text>
          <Formik
            initialValues={{password: '', passConfirm: ''}}
            validationSchema={validationSchemaRegistration}
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
                  textColor={theme.font}
                  label="Enter new password"
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
                <TextInput
                  style={styles.input}
                  label="Confirm new password"
                  theme={{
                    colors: {
                      onSurfaceVariant: '#989898',
                      primary: errors.passConfirm ? 'red' : '#989898',
                    },
                  }}
                  outlineColor={errors.passConfirm ? 'red' : '#989898'}
                  activeOutlineColor={
                    errors.passConfirm ? 'red' : theme.borderActiveColor
                  }
                  autoCapitalize="none"
                  returnKeyType="next"
                  mode="outlined"
                  secureTextEntry={hideConfirm ? true : false}
                  blurOnSubmit={false}
                  right={
                    <TextInput.Icon
                      icon={hideConfirm ? 'eye' : 'eye-off'}
                      onPress={() => setHideConfirm(!hideConfirm)}
                    />
                  }
                  name="passConfirm"
                  onChangeText={handleChange('passConfirm')}
                  onBlur={handleBlur('passConfirm')}
                  value={values.passConfirm}
                />
                {errors.passConfirm && touched.passConfirm && (
                  <Text style={styles.textConfirm}>{errors.passConfirm}</Text>
                )}
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                  <Text style={styles.buttonTitle}>Create</Text>
                </TouchableOpacity>
              </View>
            )}
          </Formik>
        </View>
      </View>
    </DokSafeAreaView>
  );
};
