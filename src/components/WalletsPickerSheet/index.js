import React, {useCallback, useContext, useMemo, useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './WalletsPickerSheetStyles';
import DokBottomSheet from 'components/BottomSheet';
import {Searchbar} from 'react-native-paper';
import {BottomSheetFlatList} from '@gorhom/bottom-sheet';
import WalletCheckboxItem from 'components/WalletCheckboxItem';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import KeyboardHeightView from 'components/KeyboardHeightView';

const WalletsPickerSheet = ({
  wallets,
  onChange,
  onDismiss,
  bottomSheetRef,
  onSelectAll,
}) => {
  const {theme} = useContext(ThemeContext);
  const {bottom} = useSafeAreaInsets();
  const styles = myStyles(theme, bottom);

  const [searchText, setSearchText] = useState('');
  const data = useMemo(() => {
    return searchText
      ? wallets?.filter(wallet =>
          wallet?.walletName
            ?.toLowerCase()
            ?.includes(searchText?.toLowerCase()),
        )
      : wallets;
  }, [searchText, wallets]);

  const keyExtractor = useCallback(item => item.clientId, []);
  const getItemLayout = useCallback(
    (_, index) => ({length: 50, offset: 50 * index, index}),
    [],
  );
  const renderItem = useCallback(
    ({item}) => <WalletCheckboxItem item={item} toggleSelect={onChange} />,
    [onChange],
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
          <Text style={styles.textStyle}>
            Select Wallets which you want to save the address
          </Text>
          <Searchbar
            placeholder="Search"
            value={searchText}
            style={styles.input}
            onChangeText={setSearchText}
            autoFocus={false}
            inputStyle={{minHeight: 0}}
          />
          <View style={styles.rowView}>
            <TouchableOpacity onPress={() => onSelectAll(true)}>
              <Text style={styles.buttonText}>{'Select All'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onSelectAll(false)}>
              <Text style={styles.buttonText}>{'Select None'}</Text>
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
        />
        <KeyboardHeightView />
      </View>
    </DokBottomSheet>
  );
};

export default WalletsPickerSheet;
