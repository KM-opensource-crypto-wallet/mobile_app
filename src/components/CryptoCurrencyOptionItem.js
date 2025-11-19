import React, { useContext } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import ThemedIcon from '../components/ThemedIcon';
import { ThemeContext } from '../theme/ThemeContext';
const { width: screenWidth } = Dimensions.get('window');
const itemWidth = screenWidth / 1.4;
import FastImage from '@d11/react-native-fast-image';
import ChainItem from '../components/ChainItem';

const CryptoCurrencyOptionItem = ({ item }) => {
  const { theme } = useContext(ThemeContext);
  const myStyles = styles(theme);
  return (
    <View style={myStyles.list}>
      <View style={myStyles.iconBox}>
        {item?.options?.icon && (
          <FastImage
            source={{ uri: item?.options?.icon }}
            resizeMode={'contain'}
            style={{ height: '100%', width: '100%' }}
          />
        )}
      </View>

      <View style={myStyles.items}>
        <View
          style={[myStyles.rowView, !item?.options?.title && { marginTop: 0 }]}>
          <Text style={[myStyles.titleAmount]}>{item?.options?.symbol}</Text>
          {item?.options?.chain_display_name && (
            <ChainItem chain_display_name={item?.options?.chain_display_name} />
          )}
        </View>
        {item?.options?.symbol && (
          <Text style={myStyles.text}>{item?.options?.title}</Text>
        )}
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
      alignItems: 'flex-start',
      width: itemWidth,
    },
    rowView: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
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
      marginBottom: 10,
    },
    titleAmount: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
  });
export default CryptoCurrencyOptionItem;
