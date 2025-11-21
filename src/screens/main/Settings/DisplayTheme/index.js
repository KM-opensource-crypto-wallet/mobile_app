import React, {useContext} from 'react';
import {View} from 'react-native';
import myStyles from './DisplayThemeStyles';
import {ThemeContext} from 'theme/ThemeContext';

import DokRadioButton from 'components/DokRadioButton';
import {DokSafeAreaView} from 'components/DokSafeAreaView';

const themeList = [
  {label: 'System Default'},
  {label: 'Light Theme'},
  {label: 'Dark Theme'},
];

const DisplayTheme = () => {
  const {theme, onChangeSelectedTheme, selectedTheme} =
    useContext(ThemeContext);
  const styles = myStyles(theme);

  return (
    <DokSafeAreaView style={styles.safeareaView}>
      <View style={styles.container}>
        <DokRadioButton
          title={'Select a theme'}
          options={themeList}
          checked={selectedTheme}
          setChecked={onChangeSelectedTheme}
        />
      </View>
    </DokSafeAreaView>
  );
};

export default DisplayTheme;
