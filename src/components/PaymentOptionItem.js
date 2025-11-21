import React, {useContext} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const PaymentOptionItem = ({item}) => {
  const {theme} = useContext(ThemeContext);
  const myStyles = styles(theme);
  return (
    <View style={myStyles.list}>
      <MaterialCommunityIcon
        name={item?.options?.icon}
        color={theme.font}
        size={32}
      />
      <Text style={myStyles.titleAmount}>{item.label}</Text>
    </View>
  );
};
const styles = theme =>
  StyleSheet.create({
    list: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 12,
      alignContent: 'center',
    },
    iconStyle: {
      height: '100%',
      width: '100%',
      borderRadius: 20,
    },
    items: {
      alignItems: 'flex-start',
    },
    titleAmount: {
      color: theme.font,
      marginLeft: 8,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
    },
  });
export default PaymentOptionItem;
