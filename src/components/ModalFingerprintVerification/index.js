import React, {useState, useContext} from 'react';
import {Dimensions, TouchableOpacity, View} from 'react-native';
import {Modal, Portal, Text, TextInput} from 'react-native-paper';
import myStyles from './ModalFingerprintVerificationStyles';
import CloseIcon from 'assets/images/icons/close.svg';
import {Formik} from 'formik';
import * as vault from 'dok-wallet-blockchain-networks/security/vault';
import {BIOMETRIC_PROMPT} from 'security/biometricPrompt';
import {captureError} from 'services/logger';
import {useFloatingHeight} from 'utils/dimensions';
import {validationSchemaFingerprintVerification} from 'utils/validationSchema';
import {useKeyboardHeight} from 'hooks/useKeyboardHeight';
import {useDispatch} from 'react-redux';
import {updateFingerprint} from 'dok-wallet-blockchain-networks/redux/settings/settingsSlice';
import {fingerprintAuthSuccess} from 'dok-wallet-blockchain-networks/redux/auth/authSlice';
import {ThemeContext} from 'theme/ThemeContext';
import {showToast} from 'utils/toast';
import {getFingerprintName} from 'dok-wallet-blockchain-networks/helper';

const WIDTH = Dimensions.get('window').width + 80;
const {height: screenHeight} = Dimensions.get('window');
const modalMinHeight = screenHeight / 2.5;
const modalMaxHeight = screenHeight / 3;

const isIpad = WIDTH >= 768;

let ITEM_WIDTH;

if (isIpad) {
  ITEM_WIDTH = Math.round(WIDTH * 0.6);
} else {
  ITEM_WIDTH = Math.round(WIDTH * 0.7);
}

const ModalFingerprintVerification = ({
  visible,
  hideModal,
  fingerprintEnabled,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const floatingModalHeight = useFloatingHeight();
  const keyboardHeight = useKeyboardHeight();
  const [wrong, setWrong] = useState(false);
  const dispatch = useDispatch();

  // Enabling biometrics = storing the DEK under the biometric-bound secure
  // item (the OS prompts on Android for that write). Requires the vault to be
  // unlocked, which it is while the app is signed in.
  const handleSubmit = async values => {
    const {currentPassword} = values;
    const ok = await vault.verifyPassword(currentPassword).catch(() => false);
    if (!ok) {
      setWrong(true);
      return;
    }
    try {
      await vault.enableBiometric(BIOMETRIC_PROMPT);
    } catch (error) {
      captureError(error, {tags: {area: 'vault', op: 'enable_biometric'}});
      showToast({
        type: 'errorToast',
        text1: `Could not enable ${getFingerprintName(fingerprintEnabled)}`,
      });
      return;
    }
    dispatch(fingerprintAuthSuccess(true));
    dispatch(updateFingerprint(true));
    hideModal(false);
    showToast({
      type: 'successToast',
      text1: `${getFingerprintName(fingerprintEnabled)} enabled successfully`,
    });
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        contentContainerStyle={{
          marginBottom: keyboardHeight ? 150 : 0,
          backgroundColor: theme.secondaryBackgroundColor,
          width: ITEM_WIDTH,
          alignSelf: 'center',
          borderRadius: 10,
          height: floatingModalHeight > 350 ? modalMaxHeight : modalMinHeight,
        }}
        dismissable={false}>
        <View style={styles.infoList}>
          <View style={styles.infoHeader}>
            <Text style={styles.titleInfo}>
              {`Please enter your password to confirm the use of ${getFingerprintName(
                fingerprintEnabled,
              )}`}
            </Text>
            <TouchableOpacity
              style={styles.infoIcon}
              onPress={() => {
                hideModal(false);
                setWrong(false);
                dispatch(updateFingerprint(false));
              }}>
              <CloseIcon width="20" height="20" fill={theme.font} />
            </TouchableOpacity>
          </View>

          <Formik
            enableReinitialize={true}
            initialValues={{
              currentPassword: '',
            }}
            validationSchema={validationSchemaFingerprintVerification}
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
              <View style={styles.formInput}>
                <TextInput
                  style={styles.input}
                  textColor={theme.font}
                  underlineColor={errors.currentPassword ? 'red' : '#989898'}
                  theme={{
                    colors: {
                      onSurfaceVariant: '#989898',
                      primary: wrong === true ? 'red' : '#989898',
                    },
                  }}
                  activeOutlineColor={errors.currentPassword ? 'red' : '#222'}
                  autoCapitalize="none"
                  returnKeyType="next"
                  secureTextEntry={true}
                  textAlign="center"
                  blurOnSubmit={false}
                  name="currentPassword"
                  onChangeText={handleChange('currentPassword')}
                  onBlur={handleBlur('currentPassword')}
                  onSubmitEditing={handleSubmit}
                  value={values.currentPassword}
                  autoFocus={true}
                />

                {wrong === true ? (
                  <Text style={styles.textWarning}>* Wrong password</Text>
                ) : (
                  <>
                    {errors.currentPassword && touched.currentPassword && (
                      <Text style={styles.textConfirm}>
                        {errors.currentPassword}
                      </Text>
                    )}
                  </>
                )}

                <TouchableOpacity
                  style={{
                    ...styles.button,
                    ...styles.shadow,
                  }}
                  onPress={handleSubmit}>
                  <Text style={styles.buttonTitle}>Verify</Text>
                </TouchableOpacity>
              </View>
            )}
          </Formik>
        </View>
      </Modal>
    </Portal>
  );
};

export default ModalFingerprintVerification;
