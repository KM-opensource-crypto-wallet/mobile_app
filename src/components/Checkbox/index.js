import React, {useContext} from 'react';
import {CheckBox} from '@rneui/themed';
import {ThemeContext} from 'theme/ThemeContext';

const Checkbox = ({checked, onChange, customStyle, size = 28}) => {
  const {theme} = useContext(ThemeContext);
  return (
    <CheckBox
      containerStyle={[
        {
          backgroundColor: 'transparent',
          borderWidth: 0,
          padding: 0,
          marginLeft: 0,
          marginTop: 0,
        },
        customStyle ? customStyle : {},
      ]}
      size={size}
      checked={checked}
      onPress={onChange}
      iconType="material-community"
      checkedIcon="checkbox-marked-circle"
      uncheckedIcon="checkbox-blank-circle-outline"
      checkedColor={theme.background}
    />
  );
};

export default Checkbox;
