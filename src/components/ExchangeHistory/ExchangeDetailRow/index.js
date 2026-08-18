import React, {useContext} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import IoniconIcon from 'react-native-vector-icons/Ionicons';
import {ThemeContext} from 'theme/ThemeContext';
import {getCustomizePublicAddress} from 'dok-wallet-blockchain-networks/helper';
import {showToast} from 'utils/toast';
import myStyles from './ExchangeDetailRowStyles';

// Label/value row for the details card. `copyable` shortens the value and
// copies it on tap; `onPress` (e.g. open in explorer) wins over copy.
// `icon` (Ionicon name) renders a tinted leading circle before the label.
const ExchangeDetailRow = ({
  label,
  value,
  displayValue,
  copyable,
  onPress,
  isFirst,
  icon,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  if (value === null || value === undefined || value === '') {
    return null;
  }
  const stringValue = String(value);
  const shownValue =
    displayValue ||
    (copyable ? getCustomizePublicAddress(stringValue) : stringValue);

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    Clipboard.setString(stringValue);
    showToast({type: 'success', title: 'Copied to clipboard'});
  };

  return (
    <>
      {!isFirst && <View style={styles.divider} />}
      <View style={styles.row}>
        <View style={styles.rowLabelWrap}>
          {!!icon && (
            <View style={styles.iconCircle}>
              <IoniconIcon name={icon} size={15} color={theme.background} />
            </View>
          )}
          <Text style={styles.rowLabel}>{label}</Text>
        </View>
        {copyable || onPress ? (
          <TouchableOpacity style={styles.rowValueRow} onPress={handlePress}>
            <Text style={styles.rowValue} numberOfLines={1}>
              {shownValue}
            </Text>
            <IoniconIcon
              name={onPress ? 'open-outline' : 'copy-outline'}
              size={16}
              color={theme.gray}
              style={styles.rowIcon}
            />
          </TouchableOpacity>
        ) : (
          <Text style={styles.rowValue} numberOfLines={2}>
            {shownValue}
          </Text>
        )}
      </View>
    </>
  );
};

export default ExchangeDetailRow;
