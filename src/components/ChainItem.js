import React, {useContext} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import {capitalizeFirstLetter} from 'dok-wallet-blockchain-networks/helper';

const ChainItem = ({chain_display_name}) => {
  const {theme} = useContext(ThemeContext);
  const style = myStyles(theme);
  return (
    <View style={style.mainView}>
      <Text style={style.textStyle}>{chain_display_name || ''}</Text>
    </View>
  );
};
const myStyles = theme =>
  StyleSheet.create({
    mainView: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: theme.lightBackground,
      borderRadius: 6,
      marginLeft: 4,
    },
    textStyle: {
      color: theme.primary,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
    },
  });
export default ChainItem;
