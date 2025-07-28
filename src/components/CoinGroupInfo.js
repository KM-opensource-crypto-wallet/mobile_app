import React, {useRef, useContext, useMemo, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import DokBottomSheetScrollView from 'components/BottomSheetScrollView';
import FastImage from '@d11/react-native-fast-image';
import ChainItem from 'components/ChainItem';
import IoniconsIcon from 'react-native-vector-icons/Ionicons';
import {useGroupCoins} from 'hooks/useGroupCoins';

const CoinGroupInfo = ({
  groups,
  bottomSheetRef,
  onDismiss,
  selectedGroupId,
  isAddingGroup,
  onPressAddItem,
  currentWallet,
  userCoins,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = MyStyles(theme);
  const bottomRef = useRef();
  const selectedGroup = useMemo(() => {
    return groups.find(item => item?._id === selectedGroupId);
  }, [groups, selectedGroupId]);

  const {isDisabledItem, isGroupCoinsAdded, isAdding} = useGroupCoins({
    currentWallet,
    group: selectedGroup,
    isAddingGroup,
    userCoins,
  });

  const coins = Array.isArray(selectedGroup?.coins) ? selectedGroup?.coins : [];

  const onLocalPressAddItem = useCallback(() => {
    onPressAddItem(selectedGroup);
  }, [onPressAddItem, selectedGroup]);

  return (
    <DokBottomSheetScrollView
      bottomSheetRef={ref => {
        bottomSheetRef(ref);
        bottomRef.current = ref;
      }}
      snapPoints={['85%']}
      onDismiss={() => {
        onDismiss();
      }}>
      <View style={styles.mainView}>
        <Text style={styles.title}>{selectedGroup?.name}</Text>
        <Text style={styles.description}>{selectedGroup?.description}</Text>
        <Text style={[styles.title, {marginTop: 20}]}>{'Coins'}</Text>
        {coins?.map((coin, i) => (
          <View style={styles.chainRowView} key={'' + coin?._id + i}>
            <FastImage
              source={{uri: coin?.icon}}
              style={styles.rowImageStyle}
            />
            <View style={styles.centerItemView}>
              <View style={styles.rowView}>
                <Text style={styles.itemTitle}>{`${coin?.symbol}`}</Text>
                <ChainItem chain_display_name={coin?.chain_display_name} />
              </View>
              <Text numberOfLines={1} style={styles.url}>
                {coin?.name}
              </Text>
            </View>
          </View>
        ))}
        <TouchableOpacity
          disabled={isGroupCoinsAdded || isAdding || isDisabledItem}
          style={[
            styles.addButton,
            isGroupCoinsAdded && styles.successButton,
            isDisabledItem && styles.disabledButton,
          ]}
          onPress={onLocalPressAddItem}>
          {isAdding ? (
            <ActivityIndicator color={'white'} />
          ) : isGroupCoinsAdded ? (
            <>
              <IoniconsIcon
                name={'checkmark-circle'}
                size={24}
                color={'white'}
              />
              <Text style={styles.addButtonTitle}>Added</Text>
            </>
          ) : (
            <>
              <IoniconsIcon name={'add-circle'} size={24} color={'white'} />
              <Text style={styles.addButtonTitle}>Add</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </DokBottomSheetScrollView>
  );
};
const MyStyles = theme =>
  StyleSheet.create({
    mainView: {
      padding: 20,
      backgroundColor: theme.backgroundColor,
    },
    title: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
      marginBottom: 20,
    },
    description: {
      color: theme.primary,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
    rowView: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    chainRowView: {
      alignItems: 'center',
      flexDirection: 'row',
      width: '100%',
      borderColor: theme.gray,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginTop: 8,
      borderRadius: 8,
    },
    rowImageStyle: {
      height: 30,
      width: 30,
      resizeMode: 'contain',
      marginRight: 8,
      borderRadius: 8,
    },
    itemTitle: {
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
      fontSize: 14,
      color: theme.primary,
    },
    addButton: {
      height: 50,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      marginTop: 32,
      flexDirection: 'row',
      gap: 8,
    },
    successButton: {
      backgroundColor: theme.successBottom,
    },
    disabledButton: {
      backgroundColor: theme.gray,
    },
    addButtonTitle: {
      color: 'white',
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
    },
  });
export default CoinGroupInfo;
