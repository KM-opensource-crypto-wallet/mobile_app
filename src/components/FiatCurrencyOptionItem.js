import React, {useContext} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';

const FiatCurrencyOptionItem = ({item}) => {
  const {theme} = useContext(ThemeContext);
  const myStyles = styles(theme);
  return (
    <View style={myStyles.listView}>
      <Text style={[myStyles.titleAmount]}>{item?.label}</Text>
    </View>
  );
};
const styles = theme =>
  StyleSheet.create({
    listView: {
      height: 50,
      width: '100%',
      borderBottomWidth: 0.5,
      borderBottomColor: theme.gray,
      paddingHorizontal: 12,
      justifyContent: 'center',
    },
    titleAmount: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '500',
    },
  });
export default FiatCurrencyOptionItem;
