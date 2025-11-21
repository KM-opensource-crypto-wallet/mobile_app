import React, {useState, useEffect, useContext} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';

import {CheckBox} from '@rneui/themed';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './CryptoCheckboxStyles';

const CryptoCheckbox = ({
  setTermsCheck,
  title,
  number,
  setRiskCheck,
  setInfoCheck,
  onPress,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const [checked, setChecked] = useState(false);
  const toggleCheckbox = () => {
    const tempChecked = !checked;
    setChecked(tempChecked);
    if (number === '1') {
      setTermsCheck(tempChecked);
    }
    if (number === '2') {
      setRiskCheck(tempChecked);
    }
    if (number === '3') {
      setInfoCheck(tempChecked);
    }
  };

  return (
    <View style={styles.checkbox}>
      <CheckBox
        containerStyle={{
          backgroundColor: 'transparent',
          borderWidth: 0,
          padding: 0,
          marginLeft: 0,
        }}
        size={24}
        checked={checked}
        onPress={toggleCheckbox}
        iconType="material-community"
        checkedIcon="checkbox-marked"
        uncheckedIcon="checkbox-blank-outline"
        checkedColor={theme.background}
      />

      {number !== '3' ? (
        <Text>
          <Text style={styles.text}>I accept the</Text>
          <Text style={styles.checkText} onPress={() => onPress && onPress()}>
            &nbsp;{title}
          </Text>
        </Text>
      ) : (
        <Text style={{...styles.text}} onPress={() => onPress && onPress()}>
          {title}
        </Text>
      )}
    </View>
  );
};

export default CryptoCheckbox;
