import React, {useState, useContext} from 'react';
import {View, TouchableOpacity, Dimensions, Text, ScrollView} from 'react-native';
import myStyles from './SortCoinsStyles';
import {Modal} from 'react-native-paper';
import {CheckBox} from '@rneui/themed';
import RadioOn from 'assets/images/icons/radio-button-on.svg';
import {ThemeContext} from 'theme/ThemeContext';
import Icon from 'react-native-vector-icons/FontAwesome';

const WIDTH = Dimensions.get('window').width + 80;
const {height: screenHeight} = Dimensions.get('window');
const modalHeight = screenHeight / 1.4;
const isIpad = WIDTH >= 768;

let ITEM_WIDTH;

if (isIpad) {
  ITEM_WIDTH = Math.round(WIDTH * 0.5);
} else {
  ITEM_WIDTH = Math.round(WIDTH * 0.7);
}

export const SORT_OPTIONS = {
  VALUE_DESC: 'value_desc',
  VALUE_ASC: 'value_asc',
  BALANCE_DESC: 'balance_desc',
  BALANCE_ASC: 'balance_asc',
  NAME_ASC: 'name_asc',
  NAME_DESC: 'name_desc',
  SYMBOL_ASC: 'symbol_asc',
  SYMBOL_DESC: 'symbol_desc',
};

const sortList = [
  {label: 'Value High to Low', value: SORT_OPTIONS.VALUE_DESC},
  {label: 'Value Low to High', value: SORT_OPTIONS.VALUE_ASC},
  {label: 'Balance High to Low', value: SORT_OPTIONS.BALANCE_DESC},
  {label: 'Balance Low to High', value: SORT_OPTIONS.BALANCE_ASC},
  {label: 'Name A-Z', value: SORT_OPTIONS.NAME_ASC},
  {label: 'Name Z-A', value: SORT_OPTIONS.NAME_DESC},
  {label: 'Symbol A-Z', value: SORT_OPTIONS.SYMBOL_ASC},
  {label: 'Symbol Z-A', value: SORT_OPTIONS.SYMBOL_DESC},
];

const SortCoins = ({visible, hideModal, onApply, currentSort}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const [selectedSort, setSelectedSort] = useState(currentSort || SORT_OPTIONS.VALUE_DESC);

  const handleSubmit = () => {
    hideModal(false);
    onApply(selectedSort);
  };

  const getSelectedLabel = () => {
    const found = sortList.find(item => item.value === selectedSort);
    return found ? found.label : 'Value High to Low';
  };

  const containerStyle = {
    width: ITEM_WIDTH,
    alignSelf: 'center',
    backgroundColor: theme.secondaryBackgroundColor,
    borderRadius: 5,
    height: modalHeight,
  };

  return (
    <Modal
      visible={visible}
      onDismiss={() => hideModal(false)}
      contentContainerStyle={containerStyle}
      animationType="fade"
      theme={{
        colors: {
          backdrop: 'transparent',
        },
      }}>
      <View style={styles.section}>
        <View style={styles.header}>
          <Text style={styles.headerBox}>
            <Text style={styles.title}>Sort by:</Text>
            <Text style={styles.titleItem}>{getSelectedLabel()}</Text>
          </Text>

          <TouchableOpacity style={styles.btn} onPress={() => hideModal(false)}>
            <Text style={styles.btnTitle}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer}>
          {sortList.map((item, index) => (
            <View style={styles.itembox} key={index}>
              <CheckBox
                containerStyle={{
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  padding: 0,
                  width: 25,
                  height: 25,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                checked={selectedSort === item.value}
                onPress={() => setSelectedSort(item.value)}
                checkedIcon={
                  <RadioOn width="25" height="25" color={theme.background} />
                }
                uncheckedIcon={
                  <Icon name="circle-o" size={24} color={theme.carouselPoints} />
                }
                checkedColor={theme.background}
              />
              <Text style={styles.item}>{item.label}</Text>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit}>
          <Text style={styles.btnSubmitTitle}>Apply</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default SortCoins;
