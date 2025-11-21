import React from 'react';
import {Dropdown} from 'react-native-element-dropdown';
import myStyles from './SelectInputExchangeStyles';
import {useContext} from 'react';
import {ThemeContext} from 'theme/ThemeContext';
import CryptoCurrencyOptionItem from 'components/CryptoCurrencyOptionItem';

const SelectInputExchange = ({
  listData,
  selectRef,
  selectedValue,
  onValueChange,
  customStyle = {},
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const renderItem = item => {
    return <CryptoCurrencyOptionItem item={item} />;
  };

  return (
    <Dropdown
      containerStyle={{
        backgroundColor: theme.secondaryBackgroundColor,
      }}
      activeColor={{backgroundColor: theme.secondaryBackgroundColor}}
      ref={selectRef}
      style={[styles.dropdown, customStyle]}
      placeholderStyle={styles.placeholderStyle}
      iconStyle={styles.iconStyle}
      maxHeight={300}
      value={selectedValue}
      data={listData}
      valueField="value"
      labelField="lable"
      onChange={item => {
        onValueChange(item);
      }}
      renderItem={renderItem}
      iconColor={'transparent'}
      search={true}
      searchField={'value'}
      keyboardAvoiding={true}
      searchPlaceholder={'Search'}
    />
  );
};

export default SelectInputExchange;
