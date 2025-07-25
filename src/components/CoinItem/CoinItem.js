import React, {memo, useCallback, useContext} from 'react';
import {
  checkValidChainForWalletImportWithPrivateKey,
  isBitcoinChain,
  validateSupportedChain,
} from 'dok-wallet-blockchain-networks/helper';
import {Keyboard, Switch, Text, TouchableOpacity, View} from 'react-native';
import {
  addOrToggleCoinInWallet,
  setCurrentCoin,
  setCurrentWalletCoinsPosition,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import FastImage from '@d11/react-native-fast-image';
import ChainItem from 'components/ChainItem';
import {currencySymbol} from 'data/currency';
import KeyboardArrow from 'assets/images/icons/keyboard-arrow-right.svg';
import myStyles from './CoinItemStyles';
import {ThemeContext} from 'theme/ThemeContext';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome6';
import AntIcon from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CoinItem = ({
  currentWallet,
  item,
  index,
  number,
  navigation,
  showSwitch,
  dispatch,
  setRenderList,
  localCurrency,
  isActiveDrag,
  drag,
  isSortSelected,
  coinsLength,
  showDeleteMode,
  onPressDelete,
}) => {
  const isCoinInWallet = item?.isInWallet;
  const isToken = item?.type === 'token';
  const isAddCoin = number === 3;
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const isDisabledItem =
    isAddCoin &&
    !checkValidChainForWalletImportWithPrivateKey({
      currentWallet,
      currentCoin: item,
    });

  const isBitcoin = isBitcoinChain(item?.chain_name);

  const onPressMove = isMoveUp => {
    Keyboard.dismiss();
    dispatch(setCurrentWalletCoinsPosition({index, isMoveUp}));
  };

  const onPressItem = useCallback(() => {
    dispatch(setCurrentCoin(item?._id));
    navigation.navigate('SendScreen', {
      item: JSON.parse(JSON.stringify(item)),
    });
  }, [dispatch, item, navigation]);

  const onChangeValue = useCallback(() => {
    dispatch(addOrToggleCoinInWallet(item));
    setRenderList(prevState =>
      prevState.map(subItem => {
        if (item._id === subItem._id) {
          return {...subItem, isInWallet: !subItem.isInWallet};
        }
        return subItem;
      }),
    );
  }, [dispatch, item, setRenderList]);

  const onDelete = useCallback(() => {
    onPressDelete?.(item);
  }, [item, onPressDelete]);

  if (!validateSupportedChain(item?.chain_name)) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.section,
        isDisabledItem && {backgroundColor: theme.disabledItem},
        isSortSelected && {paddingHorizontal: 24},
      ]}
      key={index}
      disabled={number !== 1}
      onPress={onPressItem}>
      {isSortSelected && (
        <TouchableOpacity
          style={styles.dragIcon}
          onLongPress={drag}
          disabled={isActiveDrag}
          hitSlop={{top: 12, right: 12, bottom: 12, left: 12}}>
          <FontAwesomeIcon
            name={'grip-vertical'}
            size={24}
            color={theme.font}
          />
        </TouchableOpacity>
      )}
      <View style={styles.iconBox}>
        {item?.icon && (
          <FastImage
            source={{uri: item?.icon}}
            resizeMode={'contain'}
            style={styles.imageStyle}
          />
        )}
        {/*{item?.icon && (*/}
        {/*  <ThemedIcon icon={item?.icon} theme={theme} font={1} />*/}
        {/*)}*/}
      </View>

      <View style={styles.list}>
        <View style={styles.box}>
          <View style={styles.item}>
            <View style={styles.rowStyle}>
              <Text style={styles.title} numberOfLines={1}>
                {item?.symbol}
              </Text>
              {(isToken || isBitcoin) && (
                <ChainItem chain_display_name={item?.chain_display_name} />
              )}
            </View>
            <Text style={styles.text} numberOfLines={1}>
              {item?.name}
            </Text>
          </View>

          {number === 1 && (
            <View style={styles.itemNumber}>
              <Text style={styles.title}>{item?.totalBalance}</Text>
              <Text style={styles.text}>
                {currencySymbol[localCurrency] || ''}
                {item?.totalBalanceCourse}
              </Text>
            </View>
          )}
        </View>

        {number === 1 && (
          <View>
            <KeyboardArrow height="30" width="30" style={styles.arrow} />
          </View>
        )}
        {isSortSelected && coinsLength > 1 && (
          <>
            <TouchableOpacity
              style={styles.boxBtn}
              disabled={index === 0}
              onPress={() => {
                onPressMove(true);
              }}>
              <AntIcon
                name={'upcircle'}
                color={index > 0 ? theme.font : theme.gray}
                size={24}
              />
            </TouchableOpacity>
            <TouchableOpacity
              disabled={index === coinsLength - 1}
              style={styles.boxBtn}
              onPress={() => {
                onPressMove(false);
              }}>
              <AntIcon
                name={'downcircle'}
                color={index < coinsLength - 1 ? theme.font : theme.gray}
                size={24}
              />
            </TouchableOpacity>
          </>
        )}
        {!!showSwitch && !isSortSelected && !showDeleteMode && (
          <Switch
            onValueChange={() => {
              onChangeValue(item);
            }}
            value={isCoinInWallet}
            disabled={isDisabledItem}
          />
        )}
        {showDeleteMode && (
          <TouchableOpacity onPress={onDelete}>
            <Ionicons
              name={'trash'}
              resizeMode={'contain'}
              size={32}
              color={'red'}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default memo(CoinItem, (prevProps, nextProps) => {
  const key1 = `${prevProps?.item?.chain_name}_${prevProps?.item?.symbol}_${prevProps?.index}`;
  const key2 = `${nextProps?.item?.chain_name}_${nextProps?.item?.symbol}_${nextProps?.index}`;
  return (
    key1 === key2 &&
    JSON.stringify(prevProps.item) === JSON.stringify(nextProps.item) &&
    JSON.stringify(prevProps.currentWallet) ===
      JSON.stringify(nextProps.currentWallet) &&
    prevProps.isSortSelected === nextProps.isSortSelected &&
    prevProps.showDeleteMode === nextProps.showDeleteMode
  );
});

// export default CoinItem;
