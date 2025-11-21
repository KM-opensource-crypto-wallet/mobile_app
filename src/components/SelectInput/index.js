import React, {useState, useEffect, useContext} from 'react';
import {View, Text} from 'react-native';
import myStyles from './SelectInputStyles';
import KeyboardArrow from 'assets/images/icons/keyboard-arrow-right.svg';
import ArrowDown from 'assets/images/buy/arrow-down.svg';
import {Dropdown} from 'react-native-element-dropdown';
import {ThemeContext} from 'theme/ThemeContext';

const SelectInput = ({
  setValue,
  title,
  error,
  form,
  listData,
  number,
  initialValue,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const [select, setSelect] = useState(initialValue || '');
  const [show, setShow] = useState(false);

  const renderItem = item => {
    return (
      <View style={styles.list}>
        <View style={styles.iconBox}>
          <Text>{item.options.icon}</Text>
        </View>

        <View style={styles.items}>
          <Text style={form === 'Crypto' ? styles.title : styles.titleAmount}>
            {item.options.title}
          </Text>
          <Text style={form === 'Crypto' && styles.text}>
            {item.options.title}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.select}>
      <Text style={form !== 'Network' && styles.selectTitle}>{title}</Text>
      <Dropdown
        style={[
          styles.dropdown,
          show && {borderColor: '#222'},
          !!error && {borderColor: 'red'},
        ]}
        containerStyle={{
          backgroundColor: theme.secondaryBackgroundColor,
        }}
        itemTextStyle={{color: theme.font}}
        activeColor={{backgroundColor: theme.secondaryBackgroundColor}}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        data={listData}
        search={true}
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={!show ? 'Select' + ' ' + form : '...'}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        searchPlaceholder="Search..."
        value={select}
        onChange={item => {
          setSelect(item);
          setValue(item);
          setShow(false);
        }}
        renderRightIcon={() =>
          form === 'Country' ? (
            <KeyboardArrow height="30" width="30" style={{fill: theme.gray}} />
          ) : (
            <ArrowDown height="30" width="30" style={{fill: theme.gray}} />
          )
        }
        renderItem={number === '2' ? false : renderItem}
      />
      {!!error && <Text style={styles.textConfirm}>{form} is required</Text>}
    </View>
  );
};

export default SelectInput;
