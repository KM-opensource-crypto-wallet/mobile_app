import React, {useContext} from 'react';
import {View, Text} from 'react-native';
import {TextInput} from 'react-native-paper';
import {ThemeContext} from 'theme/ThemeContext';
import AddressBookPicker from 'components/AddressBookPicker';
import myStyles from './RecipientAddressInputStyles';

const RecipientAddressInput = ({
  value,
  onChangeText,
  onBlur,
  error,
  disabled,
  chain_name,
  walletId,
  onSelectAddress,
  onPressScan,
  onSubmitEditing,
  label = 'Enter wallet adress or scan QR',
  containerStyle,
  inputStyle,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  return (
    <View>
      <View style={[styles.rowView, containerStyle]}>
        <TextInput
          style={[styles.addressInput, inputStyle]}
          editable={!disabled}
          label={label}
          textColor={disabled ? theme.gray : theme.font}
          theme={{colors: {onSurfaceVariant: theme.gray}}}
          outlineColor={error ? 'red' : theme.gray}
          activeOutlineColor={error ? 'red' : theme.font}
          autoCapitalize="none"
          returnKeyType="done"
          mode="outlined"
          blurOnSubmit={false}
          onChangeText={onChangeText}
          onBlur={onBlur}
          value={value}
          onSubmitEditing={onSubmitEditing}
          right={
            !disabled && onPressScan ? (
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
        {!disabled && (
          <AddressBookPicker
            chain_name={chain_name}
            walletId={walletId}
            onSelectAddress={onSelectAddress}
          />
        )}
      </View>
      {!!error && <Text style={styles.textConfirm}>{error}</Text>}
    </View>
  );
};

export default RecipientAddressInput;
