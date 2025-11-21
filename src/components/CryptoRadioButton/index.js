import React, {useState, useEffect, useContext} from 'react';
import {View, Text} from 'react-native';
import myStyles from './CryptoRadioButtonStyles';
import {CheckBox} from '@rneui/themed';
import {ThemeContext} from 'theme/ThemeContext';

const cryptoList = [
  {label: 'Employment'},
  {label: 'Investment'},
  {label: 'Other'},
];

const CryptoRadioButton = ({setValueRadioBtn}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const [checked, setChecked] = useState('Employment');

  useEffect(() => {
    setValueRadioBtn && setValueRadioBtn(checked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Source of Funds</Text>

      {cryptoList?.map((item, index) => (
        <View style={styles.itembox} key={index}>
          <CheckBox
            containerStyle={{
              backgroundColor: 'transparent',
              borderWidth: 0,
              padding: 0,
              marginLeft: 0,
            }}
            checked={checked === item.label}
            onPress={() => {
              setChecked(item.label);
              setValueRadioBtn && setValueRadioBtn(item.label);
            }}
            checkedIcon="dot-circle-o"
            uncheckedIcon="circle-o"
            checkedColor={theme.background}
          />
          <Text style={styles.item}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

export default CryptoRadioButton;
