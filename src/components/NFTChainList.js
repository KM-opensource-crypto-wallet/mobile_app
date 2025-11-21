import React, {useCallback, useContext} from 'react';
import {FlatList, StyleSheet, View, Text, TouchableOpacity} from 'react-native';
import {NFT_SUPPORTED_CHAIN} from 'dok-wallet-blockchain-networks/helper';
import {ThemeContext} from 'theme/ThemeContext';
import {getSelectedNftChain} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import {
  fetchNft,
  setNftSelectedChain,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';

const NFTChainItem = ({item, styles, selectedChain, dispatch}) => {
  const isSelected = item === selectedChain;
  const onPressSelectedChain = useCallback(() => {
    dispatch(setNftSelectedChain(item));
    dispatch(fetchNft({selectedNftChain: item}));
  }, [dispatch, item]);
  return (
    <TouchableOpacity
      style={[styles.itemContainer, isSelected && styles.activeBackground]}
      onPress={onPressSelectedChain}>
      <Text style={[styles.text, isSelected && styles.activeText]}>{item}</Text>
    </TouchableOpacity>
  );
};

const NFTChainList = () => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const selectedChain = useSelector(getSelectedNftChain, shallowEqual);
  const dispatch = useDispatch();

  return (
    <View style={styles.flatlist}>
      <FlatList
        keyExtractor={item => 'chainlist_' + item}
        contentContainerStyle={styles.flatListContainer}
        data={NFT_SUPPORTED_CHAIN}
        renderItem={({item}) => (
          <NFTChainItem
            item={item}
            styles={styles}
            selectedChain={selectedChain}
            dispatch={dispatch}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
      />
    </View>
  );
};

const myStyles = theme =>
  StyleSheet.create({
    flatlist: {
      height: 70,
      width: '100%',
      backgroundColor: theme.backgroundColor,
      borderBottomWidth: 1,
      borderBottomColor: theme.gray,
    },
    flatListContainer: {
      height: 70,
      backgroundColor: theme.backgroundColor,
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    itemContainer: {
      paddingHorizontal: 20,
      height: 40,
      borderRadius: 40,
      backgroundColor: theme.lightBackground,
      justifyContent: 'center',
      marginRight: 12,
    },
    text: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '500',
    },
    activeBackground: {
      backgroundColor: theme.background,
    },
    activeText: {
      color: 'white',
      fontSize: 15,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
    },
  });
export default NFTChainList;
