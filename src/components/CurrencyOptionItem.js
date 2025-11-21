import React, {useContext} from 'react';
import {View, StyleSheet, Text, Dimensions} from 'react-native';
import ThemedIcon from 'components/ThemedIcon';
import {ThemeContext} from 'theme/ThemeContext';
import {useSelector} from 'react-redux';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {currencyIcon} from 'data/currency';
const {width: screenWidth} = Dimensions.get('window');
const itemWidth = screenWidth / 1.4;

const CurrencyOptionItem = ({item}) => {
  const {theme} = useContext(ThemeContext);
  const myStyles = styles(theme);
  const localCurrency = useSelector(getLocalCurrency);
  return (
    <View style={myStyles.list}>
      <View style={myStyles.iconBox}>
        {currencyIcon[localCurrency] && (
          <ThemedIcon
            icon={currencyIcon[localCurrency]}
            theme={theme}
            font={1}
          />
        )}
      </View>

      <View style={myStyles.items}>
        <Text style={[myStyles.titleAmount]}>
          {item.label + ' ' + localCurrency}
        </Text>
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
    titleAmount: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
  });
export default CurrencyOptionItem;
