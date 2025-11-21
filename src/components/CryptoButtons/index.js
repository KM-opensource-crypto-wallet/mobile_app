import React, {useContext, useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import myStyles from './CryptoButtonsStyles';
import {ThemeContext} from 'theme/ThemeContext';

const CryptoButtons = () => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const [active, setActive] = useState(1);

  return (
    <View style={styles.btnList}>
      <TouchableOpacity
        style={active === 1 ? styles.btnActive : styles.btnItem}
        onPress={() => setActive(1)}>
        <Text
          style={{
            ...styles.btnTitle,
            color: active === 1 ? theme.backgroundColor : theme.background,
          }}>
          Buy Crypto
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={active === 2 ? styles.btnActive : styles.btnItem}
        onPress={() => setActive(2)}>
        <Text
          style={{
            ...styles.btnTitle,
            color: active === 2 ? theme.backgroundColor : theme.background,
          }}>
          Sell Crypto
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default CryptoButtons;
