import React, {useContext} from 'react';
import {View, StyleSheet, Text, Dimensions} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
const {width: screenWidth} = Dimensions.get('window');
const itemWidth = screenWidth / 1.4;
import FastImage from '@d11/react-native-fast-image';
import {formatNumber} from 'utils/common';
import {formatBalance} from 'dok-wallet-blockchain-networks/helper';

const ValidatorOptionItem = ({item, currentCoin}) => {
  const {theme} = useContext(ThemeContext);
  const myStyles = styles(theme);

  return (
    <View style={myStyles.list}>
      <View style={myStyles.iconBox}>
        {!!item?.options?.image && (
          <FastImage
            source={{uri: item?.options?.image}}
            resizeMode={'contain'}
            style={{height: '100%', width: '100%', borderRadius: 20}}
          />
        )}
      </View>

      <View style={myStyles.items}>
        <Text style={[myStyles.titleAmount]} numberOfLines={1}>
          {item?.options?.name}
        </Text>
        <View
          style={[myStyles.rowView, !item?.options?.name && {marginTop: 0}]}>
          {!!item?.options?.apy_estimate && (
            <Text style={myStyles.text}>
              {item?.options?.apy_estimate + '% APY'}
            </Text>
          )}
          <Text style={[myStyles.text]} numberOfLines={1}>
            {`STAKE ${formatBalance(item?.options?.totalStaked ?? 0)} ${
              currentCoin?.symbol
            }`}
          </Text>
        </View>
      </View>
    </View>
  );
};
const styles = theme =>
  StyleSheet.create({
    list: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconBox: {
      width: 39,
      height: 39,
      backgroundColor: theme.font,
      borderRadius: 20,
      marginLeft: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
      marginTop: 10,
      marginBottom: 10,
    },
    items: {
      width: itemWidth,
    },
    rowView: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
      justifyContent: 'space-between',
    },
    title: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      marginTop: 10,
    },
    text: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
    titleAmount: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
  });
export default ValidatorOptionItem;
