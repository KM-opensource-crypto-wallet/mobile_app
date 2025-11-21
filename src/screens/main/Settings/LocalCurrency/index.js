import {View, Text, TouchableOpacity} from 'react-native';
import myStyles from './LocalCurrencyStyles';
import {localCurrencyList} from 'data/currency';
import {CheckBox} from '@rneui/themed';
import RadioOn from 'assets/images/icons/radio-button-on.svg';
import {useSelector, useDispatch} from 'react-redux';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {setLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSlice';
import {useContext, useEffect, useRef, useState} from 'react';
import {ThemeContext} from 'theme/ThemeContext';
import Icon from 'react-native-vector-icons/FontAwesome';
import ThemedIcon from 'components/ThemedIcon';
import {refreshCoins} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';

const LocalCurrency = () => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const localCurrency = useSelector(getLocalCurrency);
  const dispatch = useDispatch();
  const isButtonClick = useRef(false);

  useEffect(() => {
    if (localCurrency && isButtonClick.current) {
      isButtonClick.current = false;
      dispatch(refreshCoins());
    }
  }, [dispatch, localCurrency]);

  return (
    <View style={styles.container}>
      {localCurrencyList?.map((item, index) => (
        <TouchableOpacity
          style={styles.list}
          key={index}
          onPress={() => {
            isButtonClick.current = true;
            dispatch(setLocalCurrency(item.id));
          }}>
          <View
            style={
              localCurrency === item.id ? styles.iconBoxChecked : styles.iconBox
            }>
            {item.icon && (
              <ThemedIcon icon={item.icon} theme={theme} font={2} />
            )}
          </View>

          <View style={styles.items}>
            <Text style={styles.title}>{item.label}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default LocalCurrency;
