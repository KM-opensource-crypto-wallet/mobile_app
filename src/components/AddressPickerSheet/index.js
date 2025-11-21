import React, {useCallback, useContext, useMemo, useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './AddressPickerSheetStyles';
import DokBottomSheet from 'components/BottomSheet';
import {Searchbar} from 'react-native-paper';
import {BottomSheetFlatList} from '@gorhom/bottom-sheet';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import KeyboardHeightView from 'components/KeyboardHeightView';
import {useSelector} from 'react-redux';
import {getAddressBook} from 'dok-wallet-blockchain-networks/redux/addressBook/addressBookSelector';
import {isEVMChain} from 'dok-wallet-blockchain-networks/helper';
import AddressBookItem from 'components/AddressBookItem';
import EmptyView from 'components/EmptyView';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
const getItemHeight = item => {
  return item.label ? 101 : 80;
};

const AddressPickerSheet = ({
  chain_name,
  bottomSheetRef,
  onDismiss,
  walletId,
  onSelectedAddress,
}) => {
  const {theme} = useContext(ThemeContext);
  const {bottom} = useSafeAreaInsets();
  const styles = myStyles(theme, bottom);
  const addressBook = useSelector(getAddressBook);
  const filterAddressBook = useMemo(() => {
    const isEvm = isEVMChain(chain_name);
    if (isEvm) {
      return addressBook.filter(
        item =>
          item?.wallets?.includes(walletId) &&
          (item?.isEVM || item?.chain_name === chain_name),
      );
    } else {
      return addressBook.filter(
        item =>
          item?.wallets?.includes(walletId) && item?.chain_name === chain_name,
      );
    }
  }, [addressBook, chain_name, walletId]);

  const [searchText, setSearchText] = useState('');
  const data = useMemo(() => {
    return searchText
      ? filterAddressBook?.filter(wallet =>
          wallet.walletName?.toLowerCase()?.includes(searchText?.toLowerCase()),
        )
      : filterAddressBook;
  }, [searchText, filterAddressBook]);
  const navigation = useNavigation();

  const keyExtractor = useCallback(item => item.id, []);
  const getItemLayout = useCallback((fdata, index) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(fdata[i]);
    }
    const length = getItemHeight(fdata[index]);
    return {length, offset, index};
  }, []);

  const onPressItem = useCallback(
    item => {
      onSelectedAddress(item);
    },
    [onSelectedAddress],
  );

  const renderItem = useCallback(
    ({item}) => (
      <AddressBookItem
        item={item}
        isFromPicker={true}
        onPressItem={onPressItem}
      />
    ),
    [onPressItem],
  );

  return (
    <DokBottomSheet
      bottomSheetRef={ref => {
        bottomSheetRef(ref);
      }}
      snapPoints={['90%']}
      onDismiss={() => {
        onDismiss();
      }}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.textStyle}>Select address</Text>
          <View style={styles.rowView}>
            <Searchbar
              placeholder="Search"
              value={searchText}
              style={styles.input}
              onChangeText={setSearchText}
              autoFocus={false}
              inputStyle={{minHeight: 0}}
            />
            <TouchableOpacity
              hitSlop={{left: 4, right: 4, top: 4, bottom: 4}}
              onPress={() => {
                onDismiss();
                navigation.navigate('AddAddress');
              }}>
              <Ionicons
                name={'person-add'}
                resizeMode={'contain'}
                size={28}
                color={theme.font}
              />
            </TouchableOpacity>
          </View>
        </View>
        <BottomSheetFlatList
          bounces={false}
          keyboardShouldPersistTaps={'always'}
          style={styles.flatlistStyle}
          contentContainerStyle={styles.contentContainerStyle}
          keyExtractor={keyExtractor}
          data={data}
          renderItem={renderItem}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={10}
          getItemLayout={getItemLayout}
          ListEmptyComponent={EmptyView({
            text: 'No Address book is available',
            buttonText: 'Add Address',
            onPressButton: () => {
              onDismiss();
              navigation.navigate('AddAddress');
            },
          })}
        />
        <KeyboardHeightView />
      </View>
    </DokBottomSheet>
  );
};

export default AddressPickerSheet;
