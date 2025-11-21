import React, {memo, useCallback, useContext, useMemo} from 'react';

import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import myStyles from './CoinGroupItemStyles';
import {ThemeContext} from 'theme/ThemeContext';
import CoinIcons from 'components/CoinIcons';
import IoniconsIcon from 'react-native-vector-icons/Ionicons';
import {useGroupCoins} from 'hooks/useGroupCoins';

const CoinGroupItem = ({
  currentWallet,
  item,
  index,
  userCoins,
  onPressItem,
  onPressAddItem,
  isAddingGroup,
}) => {
  const icons = useMemo(() => {
    return item?.coins?.map(subItem => subItem?.icon);
  }, [item?.coins]);

  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const {isDisabledItem, isGroupCoinsAdded, isAdding} = useGroupCoins({
    currentWallet,
    group: item,
    isAddingGroup,
    userCoins,
  });

  const onLocalPress = useCallback(() => {
    onPressItem?.(item, isGroupCoinsAdded);
  }, [isGroupCoinsAdded, item, onPressItem]);

  const onLocalAddPress = useCallback(() => {
    onPressAddItem?.(item, isGroupCoinsAdded);
  }, [isGroupCoinsAdded, item, onPressAddItem]);

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      style={[styles.section, isDisabledItem && styles.disableSection]}
      key={index}
      disabled={isDisabledItem}
      onPress={onLocalPress}>
      <View style={styles.list}>
        <View style={styles.box}>
          <View style={styles.item}>
            <View style={styles.rowStyle}>
              <Text style={styles.title} numberOfLines={1}>
                {item?.name}
              </Text>
              <CoinIcons icons={icons} />
            </View>
            <Text style={styles.text} numberOfLines={2}>
              {item?.description}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onLocalAddPress}
          disabled={isGroupCoinsAdded || isDisabledItem || isAdding}
          style={[
            styles.btnStyle,
            isGroupCoinsAdded && styles.successBtnStyle,
            isDisabledItem && styles.disabledBtnStyle,
          ]}>
          {isAdding ? (
            <ActivityIndicator color={'white'} />
          ) : isGroupCoinsAdded ? (
            <>
              <IoniconsIcon
                name={'checkmark-circle'}
                size={24}
                color={'white'}
              />
              <Text style={styles.btnText}>Added</Text>
            </>
          ) : (
            <>
              <IoniconsIcon name={'add-circle'} size={24} color={'white'} />
              <Text style={styles.btnText}>Add</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default memo(CoinGroupItem);
