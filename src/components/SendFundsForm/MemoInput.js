import React, {useContext} from 'react';
import {Text, View} from 'react-native';
import {TextInput} from 'react-native-paper';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './SendFundsFormStyles';

const MemoInput = ({formik, editable = true, onPressScan}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const {values, errors, touched, handleBlur, handleSubmit, setFieldValue} =
    formik;
  const error = touched.memo && errors.memo;
  return (
    <View style={styles.boxInput}>
      <Text style={styles.listTitle}>Memo:</Text>
      <TextInput
        style={styles.input}
        editable={editable}
        label="Enter Memo or Scan QR"
        textColor={editable ? theme.font : theme.gray}
        theme={{colors: {onSurfaceVariant: theme.gray}}}
        outlineColor={error ? 'red' : theme.gray}
        activeOutlineColor={error ? 'red' : theme.font}
        autoCapitalize="none"
        mode="outlined"
        blurOnSubmit={false}
        onChangeText={text => setFieldValue('memo', text)}
        onBlur={handleBlur('memo')}
        value={values.memo}
        onSubmitEditing={handleSubmit}
        right={
          editable && onPressScan ? (
            <TextInput.Icon
              style={styles.scan}
              icon="qrcode-scan"
              iconColor={theme.backgroundColor}
              size={15}
              onPress={onPressScan}
            />
          ) : undefined
        }
      />
      <Text style={styles.infoText}>
        Memo or Tag is optional, It is only required when recipient needed.
      </Text>
      {!!error && <Text style={styles.textConfirm}>{error}</Text>}
    </View>
  );
};

export default MemoInput;
