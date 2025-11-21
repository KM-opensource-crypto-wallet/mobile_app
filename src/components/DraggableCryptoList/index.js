import React, {useState, useEffect, useContext, useCallback} from 'react';
import myStyles from './DraggableCryptoListStyles';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {useSelector, useDispatch} from 'react-redux';
import {ThemeContext} from 'theme/ThemeContext';

import CoinItem from 'components/CoinItem/CoinItem';
import DraggableFlatList, {
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import {Keyboard, View} from 'react-native';
import {rearrangeCurrentWalletCoins} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';

const DraggableCryptoList = ({
  number,
  list,
  showSwitch,
  currentWallet,
  isSortSelected,
  showDeleteMode,
  onPressDelete,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const localCurrency = useSelector(getLocalCurrency);
  const [renderList, setRenderList] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    setRenderList(list);
  }, [list]);

  const onDragEnd = useCallback(
    ({data}) => {
      dispatch(rearrangeCurrentWalletCoins({rearrangeCoins: data}));
    },
    [dispatch],
  );

  const onDragBegin = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <View style={styles.mainContainer}>
      <DraggableFlatList
        contentContainerStyle={styles.contentContainer}
        extraData={list}
        data={renderList}
        keyExtractor={item => {
          return item?._id;
        }}
        renderItem={({item, getIndex, isActive, drag}) => {
          return (
            <ScaleDecorator>
              <CoinItem
                item={item}
                index={getIndex()}
                number={number}
                dispatch={dispatch}
                currentWallet={currentWallet}
                localCurrency={localCurrency}
                setRenderList={setRenderList}
                showSwitch={showSwitch}
                isActiveDrag={isActive}
                drag={drag}
                isSortSelected={isSortSelected}
                coinsLength={renderList.length}
                showDeleteMode={showDeleteMode}
                onPressDelete={onPressDelete}
              />
            </ScaleDecorator>
          );
        }}
        onDragEnd={onDragEnd}
        onDragBegin={onDragBegin}
      />
    </View>
  );
};

export default DraggableCryptoList;
