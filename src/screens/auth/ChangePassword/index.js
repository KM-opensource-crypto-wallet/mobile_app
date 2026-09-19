import React, {useState, useEffect, useContext} from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {TextInput} from 'react-native-paper';
import {Formik} from 'formik';
import {useDispatch} from 'react-redux';
import {changePasswordSuccess} from 'dok-wallet-blockchain-networks/redux/auth/authSlice';
import * as vault from 'dok-wallet-blockchain-networks/security/vault';
import {VAULT_ERROR_CODES} from 'dok-wallet-blockchain-networks/security/errors';
import {captureError} from 'services/logger';
import myStyles from './ChangePasswordStyles';
import {useFloatingHeight} from 'utils/dimensions';
import {validationSchemaChangePassword} from 'utils/validationSchema';
import {ThemeContext} from 'theme/ThemeContext';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import {showToast} from 'utils/toast';

const ChangePassword = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const dispatch = useDispatch();
  const [hide, setHide] = useState(true);
  const floatingHeight = useFloatingHeight();
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);

  // Re-wraps the vault key under the new password; the current password is
  // enforced by the unwrap (previously nothing blocked a wrong one — D1).
  const handleSubmit = async values => {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      await vault.changePassword(values.currentPassword, values.newPassword);
    } catch (error) {
      setBusy(false);
      if (error?.code === VAULT_ERROR_CODES.INVALID_PASSWORD) {
        setWrong(true);
        return;
      }
      captureError(error, {tags: {area: 'vault', op: 'change_password'}});
      showToast({
        type: 'errorToast',
        title: 'Password not updated',
        message: 'Secure storage is unavailable. Please try again.',
      });
      return;
    }
    setBusy(false);
    setWrong(false);
    dispatch(changePasswordSuccess());
    showToast({
      type: 'successToast',
      title: 'Password updated',
      message: 'Your password has been updated successfully!.',
    });
    navigation.goBack();
  };

  return (
    <DokSafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          style={{
            ...styles.container,
            paddingVertical: floatingHeight > 400 ? 40 : 10,
          }}>
          <View style={styles.formInput}>
            <Formik
              enableReinitialize={true}
              initialValues={{
                currentPassword: '',
                newPassword: '',
                retypePassword: '',
              }}
              validationSchema={validationSchemaChangePassword}
              onSubmit={handleSubmit}>
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
                isValid,
              }) => (
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'space-between',
                  }}>
                  <View>
                    <TextInput
                      style={styles.input}
                      label={!values.currentPassword && 'Current Password'}
                      textColor={theme.font}
                      underlineColor={
                        errors.currentPassword ? 'red' : '#989898'
                      }
                      theme={{
                        colors: {
                          onSurfaceVariant: '#989898',
                          primary: errors.currentPassword ? 'red' : '#989898',
                        },
                      }}
                      activeOutlineColor={
                        errors.currentPassword ? 'red' : theme.borderActiveColor
                      }
                      autoCapitalize="none"
                      returnKeyType="next"
                      secureTextEntry={hide ? true : false}
                      blurOnSubmit={false}
                      right={
                        <TextInput.Icon
                          icon={hide ? 'eye' : 'eye-off'}
                          onPress={() => setHide(!hide)}
                        />
                      }
                      name="currentPassword"
                      onChangeText={handleChange('currentPassword')}
                      // onBlur={handleBlur('currentPassword')}
                      onBlur={() => {
                        setWrong(false);
                        handleBlur('currentPassword');
                      }}
                      onSubmitEditing={handleSubmit}
                      value={values.currentPassword}
                    />
                    {errors.currentPassword && touched.currentPassword && (
                      <Text style={styles.textConfirm}>
                        {errors.currentPassword}
                      </Text>
                    )}

                    {wrong === true && (
                      <Text style={styles.textWarning}>
                        * You have entered an invalid password
                      </Text>
                    )}

                    <TextInput
                      style={styles.input}
                      label={!values.newPassword && 'New Password'}
                      textColor={theme.font}
                      underlineColor={errors.newPassword ? 'red' : '#989898'}
                      theme={{
                        colors: {
                          onSurfaceVariant: '#989898',
                          primary: errors.newPassword ? 'red' : '#989898',
                        },
                      }}
                      activeOutlineColor={
                        errors.newPassword ? 'red' : theme.borderActiveColor
                      }
                      autoCapitalize="none"
                      returnKeyType="next"
                      secureTextEntry={hide ? true : false}
                      blurOnSubmit={false}
                      right={
                        <TextInput.Icon
                          icon={hide ? 'eye' : 'eye-off'}
                          onPress={() => setHide(!hide)}
                        />
                      }
                      name="newPassword"
                      onChangeText={handleChange('newPassword')}
                      onBlur={handleBlur('newPassword')}
                      value={values.newPassword}
                    />
                    {errors.newPassword && touched.newPassword && (
                      <Text style={styles.textConfirm}>
                        {errors.newPassword}
                      </Text>
                    )}
                    <TextInput
                      style={styles.input}
                      label={!values.retypePassword && 'New Password'}
                      textColor={theme.font}
                      underlineColor={errors.retypePassword ? 'red' : '#989898'}
                      theme={{
                        colors: {
                          onSurfaceVariant: '#989898',
                          primary: errors.retypePassword ? 'red' : '#989898',
                        },
                      }}
                      activeOutlineColor={
                        errors.retypePassword ? 'red' : theme.borderActiveColor
                      }
                      autoCapitalize="none"
                      returnKeyType="next"
                      secureTextEntry={hide ? true : false}
                      blurOnSubmit={false}
                      right={
                        <TextInput.Icon
                          icon={hide ? 'eye' : 'eye-off'}
                          onPress={() => setHide(!hide)}
                        />
                      }
                      name="retypePassword"
                      onChangeText={handleChange('retypePassword')}
                      onBlur={handleBlur('retypePassword')}
                      value={values.retypePassword}
                    />
                    {errors.retypePassword && touched.retypePassword && (
                      <Text style={styles.textConfirm}>
                        {errors.retypePassword}
                      </Text>
                    )}
                  </View>

                  <View>
                    <TouchableOpacity
                      disabled={isValid ? false : true}
                      style={{
                        ...styles.button,
                        // marginTop: isValid
                        //   ? floatingBtnHeight
                        //   : floatingBtnHeight - 30,
                        opacity: !isValid && 0.5,
                      }}
                      onPress={handleSubmit}>
                      <Text style={styles.buttonTitle}>Update password</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Formik>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </DokSafeAreaView>
  );
};

export default ChangePassword;
