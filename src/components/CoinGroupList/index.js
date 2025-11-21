import React, {useCallback, useContext, useRef, useState} from 'react';
import {BottomSheetFlatList} from '@gorhom/bottom-sheet';
import myStyles from './CoinGroupListStyles';
import {useSelector, useDispatch, shallowEqual} from 'react-redux';
import {ThemeContext} from 'theme/ThemeContext';
import CoinGroupItem from 'components/CoinGroupItem/CoinGroupItem';
import {
  selectCurrentWallet,
  selectUserCoins,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import CoinGroupInfo from 'components/CoinGroupInfo';
import {addCoinGroup} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {isAddingGroup} from 'dok-wallet-blockchain-networks/redux/currency/currencySelectors';

export const CoinsGroupList = ({list, onEndReached, contentContainerStyle}) => {
  const bottomSheetRef = useRef();
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const userCoins = useSelector(selectUserCoins, shallowEqual);
  const currentWallet = useSelector(selectCurrentWallet);
  const isAddGroup = useSelector(isAddingGroup);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const dispatch = useDispatch();

  const onPressItem = useCallback(item => {
    setSelectedGroupId(item?._id);
    bottomSheetRef.current?.close?.();
    bottomSheetRef.current?.present?.();
  }, []);

  const onDismiss = useCallback(() => {
    bottomSheetRef.current.close();
  }, []);

  const onPressAddItem = useCallback(
    item => {
      dispatch(addCoinGroup(item));
    },
    [dispatch],
  );

  return (
    <>
      <CoinGroupInfo
        bottomSheetRef={ref => {
          bottomSheetRef.current = ref;
        }}
        groups={list}
        onDismiss={onDismiss}
        selectedGroupId={selectedGroupId}
        isAddingGroup={isAddGroup}
        onPressAddItem={onPressAddItem}
        currentWallet={currentWallet}
        userCoins={userCoins}
      />
      <BottomSheetFlatList
        style={styles.mainContainer}
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        data={list}
        keyExtractor={item => item?._id}
        onEndReached={() => {
          onEndReached?.();
        }}
        renderItem={({item, index}) => {
          return (
            <CoinGroupItem
              item={item}
              index={index}
              dispatch={dispatch}
              currentWallet={currentWallet}
              userCoins={userCoins}
              onPressItem={onPressItem}
              onPressAddItem={onPressAddItem}
              isAddingGroup={isAddGroup}
            />
          );
        }}
      />
    </>
  );
};
