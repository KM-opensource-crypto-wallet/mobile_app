import React, {useState, useContext, useCallback} from 'react';
import {View, TouchableOpacity, Dimensions, Text} from 'react-native';
import myStyles from './SortTransactionsStyles';
import {Modal} from 'react-native-paper';
import {CheckBox} from '@rneui/themed';
import RadioOn from 'assets/images/icons/radio-button-on.svg';
import {ThemeContext} from 'theme/ThemeContext';
import Icon from 'react-native-vector-icons/FontAwesome';
import {useDispatch, useSelector} from 'react-redux';
import {selectCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {createPendingTransactionKey} from 'dok-wallet-blockchain-networks/helper';
import {
  refreshCurrentCoin,
  setPendingTransactions,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';

const WIDTH = Dimensions.get('window').width + 80;
const {height: screenHeight} = Dimensions.get('window');
const modalHeight = screenHeight / 1.6;
const isIpad = WIDTH >= 768;

let ITEM_WIDTH;

if (isIpad) {
  ITEM_WIDTH = Math.round(WIDTH * 0.5);
} else {
  ITEM_WIDTH = Math.round(WIDTH * 0.7);
}

const SortTransactions = ({visible, hideModal, onPressAppy}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const currentCoin = useSelector(selectCurrentCoin);
  const dispatch = useDispatch();

  const [value, setValue] = useState('Date Descending');
  const [status, setStatus] = useState('None');

  const handleSumbit = () => {
    hideModal(false);
    onPressAppy(value, status);
  };

  const sortList = [
    {label: 'Date Ascending'},
    {label: 'Date Descending'},
    {label: 'Amount Ascending'},
    {label: 'Amount Descending'},
  ];

  const filterList = [
    {label: 'None'},
    {label: 'Send'},
    {label: 'Received'},
    {label: 'Pending'},
  ];

  const containerStyle = {
    width: ITEM_WIDTH,
    alignSelf: 'center',
    backgroundColor: theme.secondaryBackgroundColor,
    borderRadius: 5,
    height: modalHeight,
    // padding: 2,
  };

  const onPressClearTransactionCache = useCallback(() => {
    hideModal(false);
    const key = createPendingTransactionKey({
      chain_name: currentCoin?.chain_name,
      symbol: currentCoin?.symbol,
      address: currentCoin?.address,
    });
    dispatch(setPendingTransactions({key, value: []}));
    dispatch(refreshCurrentCoin({fetchTransaction: true}));
  }, [
    currentCoin?.address,
    currentCoin?.chain_name,
    currentCoin?.symbol,
    dispatch,
    hideModal,
  ]);

  return (
    <Modal
      visible={visible}
      onDismiss={hideModal}
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
            <Text style={styles.titleItem}>{value}</Text>
          </Text>

          <TouchableOpacity style={styles.btn} onPress={() => hideModal(false)}>
            <Text style={styles.btnTitle}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {sortList?.map((item, index) => (
          <View style={styles.itembox} key={index}>
            <View sryle={styles.checkBox}>
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
                checked={value === item.label}
                onPress={() => {
                  setValue(item.label);
                }}
                checkedIcon={
                  <RadioOn width="25" height="25" color={theme.background} />
                }
                uncheckedIcon={
                  <Icon
                    name="circle-o"
                    size={24}
                    color={theme.carouselPoints}
                  />
                }
                checkedColor={theme.background}
              />
            </View>
            <Text style={styles.item}>{item.label}</Text>
          </View>
        ))}

        {/* //////////////////filter/////////////////////////////////////////// */}
        <Text style={{...styles.titleItem, marginVertical: 10}}>Filter</Text>

        {filterList?.map((el, index) => (
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
              checked={status === el.label}
              value={el.label}
              onPress={() => {
                setStatus(el.label);
              }}
              checkedIcon={
                <RadioOn width="25" height="25" color={theme.background} />
              }
              uncheckedIcon={
                <Icon name="circle-o" size={24} color={theme.carouselPoints} />
              }
              checkedColor={theme.background}
            />
            <Text style={styles.item}>{el.label}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.btnSubmit} onPress={handleSumbit}>
          <Text style={styles.btnSubmitTitle}>Apply</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cacheButton}
          onPress={onPressClearTransactionCache}>
          <Text style={styles.cacheButtonTitle}>Clear Transaction Cache</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default SortTransactions;
