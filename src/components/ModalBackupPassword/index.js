import React, {useState, useContext, useEffect} from 'react';
import {Dimensions, TouchableOpacity, View} from 'react-native';
import {Modal, Portal, Text, TextInput} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Formik} from 'formik';
import myStyles from './ModalBackupPasswordStyles';
import {WARN} from 'components/ConfirmationModal/ConfirmationModalStyles';
import CloseIcon from 'assets/images/icons/close.svg';
import {
  validationSchemaBackupPasswordCreate,
  validationSchemaBackupPasswordEnter,
} from 'utils/validationSchema';
import {useKeyboardHeight} from 'hooks/useKeyboardHeight';
import {ThemeContext} from 'theme/ThemeContext';

const WIDTH = Dimensions.get('window').width + 80;

const isIpad = WIDTH >= 768;

let ITEM_WIDTH;

if (isIpad) {
  ITEM_WIDTH = Math.round(WIDTH * 0.6);
} else {
  ITEM_WIDTH = Math.round(WIDTH * 0.7);
}

const LOST_PASSWORD_WARNING =
  'If you lose this password, your backup can NEVER be restored. It is not stored anywhere — not on your device, not on any server. Write it down and keep it safe.';

const ModalBackupPassword = ({
  visible,
  hideModal,
  onSuccess,
  mode = 'enter',
  errorText = '',
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const keyboardHeight = useKeyboardHeight();
  const [hide, setHide] = useState(true);
  const [hideConfirm, setHideConfirm] = useState(true);

  const isCreate = mode === 'create';

  useEffect(() => {
    if (visible) {
      setHide(true);
      setHideConfirm(true);
    }
  }, [visible]);

  const onSubmit = values => {
    onSuccess && onSuccess(values.backupPassword);
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
        }}
        dismissable={false}>
        <View style={styles.infoList}>
          <View style={styles.infoHeader}>
            <Text style={styles.titleInfo}>
              {isCreate
                ? 'Create a Backup Password'
                : 'Enter Your Backup Password'}
            </Text>
            <TouchableOpacity
              style={styles.infoIcon}
              onPress={() => {
                hideModal();
              }}>
              <CloseIcon width="20" height="20" fill={theme.font} />
            </TouchableOpacity>
          </View>

          {isCreate && (
            <View style={styles.warningCard}>
              <MaterialCommunityIcons
                name={'alert-circle-outline'}
                size={18}
                color={WARN}
              />
              <Text style={styles.warningText}>{LOST_PASSWORD_WARNING}</Text>
            </View>
          )}

          <Formik
            key={`${mode}-${visible}`}
            initialValues={{
              backupPassword: '',
              backupPasswordConfirm: '',
            }}
            validationSchema={
              isCreate
                ? validationSchemaBackupPasswordCreate
                : validationSchemaBackupPasswordEnter
            }
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
                  label="Backup password"
                  textColor={theme.font}
                  underlineColor={errors.backupPassword ? 'red' : '#989898'}
                  theme={{
                    colors: {
                      onSurfaceVariant: '#989898',
                      primary: errorText ? 'red' : '#989898',
                    },
                  }}
                  activeOutlineColor={errors.backupPassword ? 'red' : '#222'}
                  autoCapitalize="none"
                  returnKeyType={isCreate ? 'next' : 'done'}
                  secureTextEntry={hide}
                  blurOnSubmit={false}
                  name="backupPassword"
                  right={
                    <TextInput.Icon
                      icon={hide ? 'eye' : 'eye-off'}
                      onPress={() => setHide(prev => !prev)}
                    />
                  }
                  onChangeText={handleChange('backupPassword')}
                  onBlur={handleBlur('backupPassword')}
                  onSubmitEditing={isCreate ? undefined : handleSubmit}
                  value={values.backupPassword}
                  autoFocus={true}
                />
                {errors.backupPassword && touched.backupPassword && (
                  <Text style={styles.textConfirm}>
                    {errors.backupPassword}
                  </Text>
                )}

                {isCreate && (
                  <>
                    <TextInput
                      style={styles.input}
                      label="Confirm backup password"
                      textColor={theme.font}
                      underlineColor={
                        errors.backupPasswordConfirm ? 'red' : '#989898'
                      }
                      theme={{
                        colors: {
                          onSurfaceVariant: '#989898',
                          primary: '#989898',
                        },
                      }}
                      activeOutlineColor={
                        errors.backupPasswordConfirm ? 'red' : '#222'
                      }
                      autoCapitalize="none"
                      returnKeyType="done"
                      secureTextEntry={hideConfirm}
                      blurOnSubmit={false}
                      name="backupPasswordConfirm"
                      right={
                        <TextInput.Icon
                          icon={hideConfirm ? 'eye' : 'eye-off'}
                          onPress={() => setHideConfirm(prev => !prev)}
                        />
                      }
                      onChangeText={handleChange('backupPasswordConfirm')}
                      onBlur={handleBlur('backupPasswordConfirm')}
                      onSubmitEditing={handleSubmit}
                      value={values.backupPasswordConfirm}
                    />
                    {errors.backupPasswordConfirm &&
                      touched.backupPasswordConfirm && (
                        <Text style={styles.textConfirm}>
                          {errors.backupPasswordConfirm}
                        </Text>
                      )}
                  </>
                )}

                {!!errorText && (
                  <Text style={styles.textWarning}>{errorText}</Text>
                )}

                <TouchableOpacity
                  style={{
                    ...styles.button,
                    ...styles.shadow,
                  }}
                  onPress={handleSubmit}>
                  <Text style={styles.buttonTitle}>
                    {isCreate ? 'Set Password' : 'Unlock Backup'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Formik>
        </View>
      </Modal>
    </Portal>
  );
};

export default ModalBackupPassword;
