import React, {memo, useCallback, useContext} from 'react';
import {TouchableOpacity, Text, View} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './AddressBookItemStyles';
import Clipboard from '@react-native-clipboard/clipboard';
import {triggerHapticFeedbackLight} from 'utils/hapticFeedback';
import Toast from 'react-native-toast-message';
import CopyIcon from 'assets/images/icons/copy.svg';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ChainItem from 'components/ChainItem';

const AddressBookItem = ({
  item,
  onPressDelete,
  onPressEdit,
  isFromPicker,
  onPressItem,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const onPressCopy = useCallback(() => {
    Clipboard.setString(item.address);
    triggerHapticFeedbackLight();
    Toast.show({
      type: 'successToast',
      text1: 'Address copied',
    });
  }, [item.address]);

  const onEdit = useCallback(() => {
    onPressEdit?.(item);
  }, [item, onPressEdit]);

  const onDelete = useCallback(() => {
    onPressDelete?.(item);
  }, [item, onPressDelete]);

  return (
    <TouchableOpacity
      style={styles.itemRow}
      disabled={!isFromPicker}
      onPress={() => {
        onPressItem?.(item);
      }}>
      <View style={styles.leftContainer}>
        <View style={styles.rowView}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <ChainItem
            chain_display_name={item?.isEVM ? 'EVM' : item?.chain_display_name}
          />
        </View>
        {item?.label && <Text style={styles.itemSubtitle}>{item?.label}</Text>}
        <TouchableOpacity
          disabled={isFromPicker}
          style={styles.rowView}
          activeOpacity={0.6}
          onPress={onPressCopy}>
          {!isFromPicker && (
            <CopyIcon fill={theme.background} width={20} height={30} />
          )}
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.address}
          </Text>
        </TouchableOpacity>
      </View>
      {!isFromPicker && (
        <Menu>
          <MenuTrigger>
            <View style={{padding: 8}}>
              <EntypoIcon
                size={24}
                name={'dots-three-vertical'}
                color={theme.font}
              />
            </View>
          </MenuTrigger>
          <MenuOptions>
            <MenuOption onSelect={onEdit}>
              <View style={styles.optionMenu}>
                <EntypoIcon
                  size={20}
                  name={'edit'}
                  color={theme.borderActiveColor}
                />
                <Text style={styles.optionText}>{'Edit'}</Text>
              </View>
            </MenuOption>
            <MenuOption onSelect={onDelete}>
              <View style={styles.optionMenu}>
                <Ionicons
                  name={'trash'}
                  resizeMode={'contain'}
                  size={20}
                  style={{marginBottom: 2}}
                  color={'red'}
                />
                <Text style={[styles.optionText, {color: 'red'}]}>
                  {'Delete'}
                </Text>
              </View>
            </MenuOption>
          </MenuOptions>
        </Menu>
      )}
    </TouchableOpacity>
  );
};

export default memo(AddressBookItem);
