import React, {useContext} from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import ApplePayIcon from 'assets/images/buy/apple_icon.svg';

const ApplePayButton = ({onPress}) => {
  const {theme} = useContext(ThemeContext);
  const style = myStyles(theme);
  return (
    <TouchableOpacity style={style.mainView} onPress={onPress}>
      <ApplePayIcon fill={theme.backgroundColor} height={32} width={32} />
      <Text style={style.textStyle}>{'Pay'}</Text>
    </TouchableOpacity>
  );
};
const myStyles = theme =>
  StyleSheet.create({
    mainView: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.font,
      borderRadius: 6,
      marginLeft: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    textStyle: {
      color: theme.backgroundColor,
      fontSize: 18,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
      marginLeft: 2,
    },
  });
export default ApplePayButton;
