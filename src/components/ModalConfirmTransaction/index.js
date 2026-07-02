import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from 'react';
import {Dimensions, TouchableOpacity, View} from 'react-native';
import {Modal, Portal, Text, TextInput} from 'react-native-paper';
import myStyles from './ModalConfirmTransactionStyles';
import CloseIcon from 'assets/images/icons/close.svg';
import {Formik} from 'formik';
import {getUserPassword} from 'dok-wallet-blockchain-networks/redux/auth/authSelectors';
import {IS_IOS, useFloatingHeight} from 'utils/dimensions';
import {validationSchemaFingerprintVerification} from 'utils/validationSchema';
import {useKeyboardHeight} from 'hooks/useKeyboardHeight';
import {useSelector} from 'react-redux';
import {ThemeContext} from 'theme/ThemeContext';
import {isFingerprint} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import FingerprintScanner from 'react-native-fingerprint-scanner';
import {WL_APP_NAME} from 'utils/wlData';

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

const ModalConfirmTransaction = ({visible, hideModal, onSuccess}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const floatingModalHeight = useFloatingHeight();
  const keyboardHeight = useKeyboardHeight();
  const storePassword = useSelector(getUserPassword);
  const [wrong, setWrong] = useState(false);

  const fingerprint = useSelector(isFingerprint);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      isSubmittingRef.current = false;
    }
  }, [visible]);

  const triggerSuccess = useCallback(() => {
    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;
    onSuccess && onSuccess();
  }, [onSuccess]);

  const handleFingerprintAuth = useCallback(async () => {
    if (fingerprint && visible) {
      try {
        await FingerprintScanner.authenticate({
          description: `Unlock ${WL_APP_NAME} with your fingerprint`,
        });
        triggerSuccess();
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
  }, [fingerprint, triggerSuccess, visible]);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        handleFingerprintAuth().then();
      }, 200);
    }
  }, [handleFingerprintAuth, visible]);

  const onSubmit = values => {
    const {currentPassword} = values;
    if (currentPassword === storePassword) {
      triggerSuccess();
    } else {
      setWrong(true);
    }
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
              {
                'Please enter your password or fingerprint for confirm the transfer'
              }
            </Text>
            <TouchableOpacity
              style={styles.infoIcon}
              onPress={() => {
                hideModal(false);
                setWrong(false);
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
            onSubmit={onSubmit}>
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
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
                  mode="flet"
                  secureTextEntry={true}
                  textAlign="center"
                  blurOnSubmit={false}
                  name="currentPassword"
                  onChangeText={handleChange('currentPassword')}
                  onBlur={handleBlur('currentPassword')}
                  onSubmitEditing={handleSubmit}
                  value={values.currentPassword}
                  autoFocus={!fingerprint}
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

export default ModalConfirmTransaction;
