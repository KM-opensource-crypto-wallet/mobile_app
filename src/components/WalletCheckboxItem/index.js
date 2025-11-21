import React, {memo, useCallback, useContext} from 'react';
import {TouchableOpacity, Text} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './WalletCheckboxItemStyle';
import Checkbox from 'components/Checkbox';

const WalletCheckboxItem = ({item, toggleSelect}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const onToggle = useCallback(
    () => toggleSelect(item?.clientId),
    [item?.clientId, toggleSelect],
  );

  return (
    <TouchableOpacity style={styles.itemRow} onPress={onToggle}>
      <Checkbox checked={item?.isSelected} onChange={onToggle} />
      <Text style={styles.itemTitle} numberOfLines={2}>
        {item.walletName}
      </Text>
    </TouchableOpacity>
  );
};

export default memo(WalletCheckboxItem);
