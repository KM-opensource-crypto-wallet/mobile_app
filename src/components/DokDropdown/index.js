import React, {useContext} from 'react';
import {View, Text} from 'react-native';
import myStyles from './DokDropdownStyles';
import ArrowDown from 'assets/images/buy/arrow-down.svg';
import {Dropdown} from 'react-native-element-dropdown';
import {ThemeContext} from 'theme/ThemeContext';

const DokDropdown = ({
  title,
  data,
  onChangeValue,
  value,
  placeholder,
  renderItem,
  titleStyle,
  dropdownStyle,
  contentContainerStyle,
  customSelectedTextStyle,
  ...props
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  return (
    <View style={styles.select}>
      {!!title && <Text style={[styles.selectTitle, titleStyle]}>{title}</Text>}
      <Dropdown
        style={[styles.dropdown, dropdownStyle]}
        containerStyle={[
          {
            backgroundColor: theme.secondaryBackgroundColor,
          },
          !!contentContainerStyle && contentContainerStyle,
        ]}
        itemTextStyle={{color: theme.font}}
        activeColor={{backgroundColor: theme.secondaryBackgroundColor}}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={[
          styles.selectedTextStyle,
          !!customSelectedTextStyle && customSelectedTextStyle,
        ]}
        iconStyle={styles.iconStyle}
        data={data}
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={placeholder || 'Select'}
        inputSearchStyle={styles.inputTextStyle}
        value={value}
        title
        onChange={onChangeValue}
        renderRightIcon={() => (
          <ArrowDown height="30" width="30" style={{fill: theme.gray}} />
        )}
        renderItem={renderItem}
        {...props}
      />
      {/* {error === true && (
        <Text style={styles.textConfirm}>{inputForm} is required</Text>
      )} */}
    </View>
  );
};

export default DokDropdown;
