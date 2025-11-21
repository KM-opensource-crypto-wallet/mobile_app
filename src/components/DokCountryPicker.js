import React, {useContext} from 'react';
import {Appearance, StyleSheet} from 'react-native';
import CountryPicker, {
  DARK_THEME,
  DEFAULT_THEME,
} from 'react-native-country-picker-modal';
import {ThemeContext} from 'theme/ThemeContext';

const DokCountryPicker = ({isVisible, onSelect, countryCode}) => {
  const {theme} = useContext(ThemeContext);
  const myStyles = styles(theme);
  return (
    <CountryPicker
      withFilter
      withAlphaFilter
      withCountryNameButton
      theme={theme.backgroundColor === '#121212' ? DARK_THEME : DEFAULT_THEME}
      visible={isVisible}
      onSelect={onSelect}
      containerButtonStyle={myStyles.countryContainer}
      countryCode={countryCode}
    />
  );
};
const styles = theme =>
  StyleSheet.create({
    countryContainer: {
      height: 56,
      width: '100%',
      justifyContent: 'center',
      borderWidth: 1,
      marginBottom: 20,
      backgroundColor: theme.backgroundColor,
      paddingHorizontal: 16,
      borderRadius: 4,
      borderColor: '#989898',
    },
  });
export default DokCountryPicker;
