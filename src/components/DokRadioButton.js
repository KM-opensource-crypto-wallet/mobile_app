import React, {useState, useEffect, useContext} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {CheckBox} from '@rneui/themed';
import {ThemeContext} from 'theme/ThemeContext';

const DokRadioButton = ({title, options, setChecked, checked}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>

      {options?.map((item, index) => (
        <TouchableOpacity
          style={styles.itembox}
          key={index}
          onPress={() => {
            setChecked && setChecked(item.label);
          }}>
          <CheckBox
            containerStyle={{
              backgroundColor: 'transparent',
              borderWidth: 0,
              padding: 0,
              marginLeft: 0,
            }}
            checked={checked === item.label}
            checkedIcon="dot-circle-o"
            uncheckedIcon="circle-o"
            checkedColor={theme.background}
          />
          <Text style={styles.item}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const myStyles = theme =>
  StyleSheet.create({
    section: {
      paddingVertical: 24,
      justifyContent: 'center',
    },
    title: {
      color: theme.primary,
      fontSize: 15,
      marginBottom: 15,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
    },
    item: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
    itembox: {
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: 10,
    },
  });

export default DokRadioButton;
