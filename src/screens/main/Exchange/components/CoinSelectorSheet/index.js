import React, {
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {TouchableOpacity, View, Text} from 'react-native';
import {Searchbar} from 'react-native-paper';
import {BottomSheetFlatList} from '@gorhom/bottom-sheet';
import DokBottomSheet from 'components/BottomSheet';
import CryptoCurrencyOptionItem from 'components/CryptoCurrencyOptionItem';
import KeyboardHeightView from 'components/KeyboardHeightView';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './CoinSelectorSheetStyles';

const ITEM_HEIGHT = 59;

// Searchable coin picker sheet, shared by the from- and to-side of the swap:
// present(direction) remembers which side asked, and onSelect receives it
// back along with the picked option.
const CoinSelectorSheet = forwardRef(({options, onSelect}, ref) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const sheetRef = useRef(null);
  const directionRef = useRef('from');
  const [searchText, setSearchText] = useState('');

  useImperativeHandle(
    ref,
    () => ({
      present: direction => {
        directionRef.current = direction || 'from';
        setSearchText('');
        sheetRef.current?.present?.();
      },
      close: () => sheetRef.current?.close?.(),
    }),
    [],
  );

  const data = useMemo(() => {
    if (!searchText) {
      return options || [];
    }
    const needle = searchText.toLowerCase();
    return (options || []).filter(
      item =>
        item?.options?.symbol?.toLowerCase()?.includes(needle) ||
        item?.options?.title?.toLowerCase()?.includes(needle) ||
        item?.options?.chain_display_name?.toLowerCase()?.includes(needle),
    );
  }, [options, searchText]);

  const keyExtractor = useCallback(item => item?.value, []);
  const getItemLayout = useCallback(
    (_, index) => ({length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index}),
    [],
  );

  const renderItem = useCallback(
    ({item}) => (
      <TouchableOpacity
        onPress={() => {
          sheetRef.current?.close?.();
          onSelect?.(item, directionRef.current);
        }}>
        <CryptoCurrencyOptionItem item={item} />
      </TouchableOpacity>
    ),
    [onSelect],
  );

  return (
    <DokBottomSheet
      bottomSheetRef={sheetInstance => {
        sheetRef.current = sheetInstance;
      }}
      snapPoints={['90%']}>
      <View style={styles.container}>
        <Text style={styles.title}>Select coin</Text>
        <Searchbar
          placeholder="Search by name or symbol"
          value={searchText}
          style={styles.input}
          onChangeText={setSearchText}
          autoFocus={false}
          inputStyle={styles.searchInput}
        />
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
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No coins match your search. Add more coins from your wallet to
              swap them.
            </Text>
          }
        />
        <KeyboardHeightView />
      </View>
    </DokBottomSheet>
  );
});

CoinSelectorSheet.displayName = 'CoinSelectorSheet';

export default CoinSelectorSheet;
