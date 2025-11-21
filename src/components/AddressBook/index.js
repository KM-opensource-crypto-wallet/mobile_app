import React, {useCallback, useContext, useMemo, useRef, useState} from 'react';
import {View, FlatList} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './AddressBookStyles';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import KeyboardHeightView from 'components/KeyboardHeightView';
import {useDispatch, useSelector} from 'react-redux';
import {getAddressBook} from 'dok-wallet-blockchain-networks/redux/addressBook/addressBookSelector';
import {Searchbar} from 'react-native-paper';
import AddressBookItem from 'components/AddressBookItem';
import ModalConfirm from 'components/ModalConfirm';
import {deleteAddressBook} from 'dok-wallet-blockchain-networks/redux/addressBook/addressBookSlice';
import EmptyView from 'components/EmptyView';

const getItemHeight = item => {
  return item.label ? 101 : 80;
};

const AddressBook = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const {bottom} = useSafeAreaInsets();
  const styles = myStyles(theme, bottom);
  const addressBook = useSelector(getAddressBook);
  const [searchText, setSearchText] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState('');
  const selectedItemRef = useRef(null);

  const data = useMemo(() => {
    return searchText
      ? addressBook?.filter(
          item =>
            item.name?.toLowerCase()?.includes(searchText?.toLowerCase()) ||
            item.address?.toLowerCase()?.includes(searchText?.toLowerCase()) ||
            item.label?.toLowerCase()?.includes(searchText?.toLowerCase()),
        )
      : addressBook;
  }, [searchText, addressBook]);

  const dispatch = useDispatch();

  const keyExtractor = useCallback(item => item.id, []);
  const getItemLayout = useCallback((fdata, index) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(fdata[i]);
    }
    const length = getItemHeight(fdata[index]);
    return {length, offset, index};
  }, []);

  const onPressYes = useCallback(() => {
    setShowConfirmModal(false);
    if (selectedItemRef.current) {
      dispatch(deleteAddressBook(selectedItemRef.current));
    } else {
      console.warn('No items selected for delete in address book');
    }
  }, [dispatch]);

  const onPressNo = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  const onPressDelete = useCallback(item => {
    selectedItemRef.current = item;
    setShowConfirmModal(true);
  }, []);

  const onPressEdit = useCallback(
    item => {
      navigation.navigate('AddAddress', item);
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({item}) => (
      <AddressBookItem
        item={item}
        onPressDelete={onPressDelete}
        onPressEdit={onPressEdit}
      />
    ),
    [onPressDelete, onPressEdit],
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Searchbar
          placeholder="Search"
          value={searchText}
          style={styles.input}
          onChangeText={setSearchText}
          autoFocus={false}
          inputStyle={{minHeight: 0}}
        />
      </View>
      <FlatList
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
          onPressButton: () => navigation.navigate('AddAddress'),
        })}
      />
      <KeyboardHeightView />
      <ModalConfirm
        title={`Delete ${selectedItemRef?.current?.name}?`}
        description={
          "Once the address details is removed it can't be recovered"
        }
        onPressNo={onPressNo}
        onPressYes={onPressYes}
        visible={showConfirmModal}
      />
    </View>
  );
};

export default AddressBook;
