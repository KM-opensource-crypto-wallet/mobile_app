import React, {useCallback, useContext, useRef} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import {currencySymbol} from 'data/currency';

import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {
  countTotalAssets,
  getSelectedNftAvailable,
  getSelectedNftChain,
  getSelectedNftData,
  getSelectedNftLoading,
  selectUserCoins,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {useNavigation} from '@react-navigation/native';
import {ThemeContext} from 'theme/ThemeContext';
import NFTChainList from 'components/NFTChainList';
import NFTMainChainItem from 'components/NFTMainChainItem';
import Loading from 'components/Loading';
import {fetchNft} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';

const {width: screenWidth} = Dimensions.get('window');

const isIpad = screenWidth >= 768;

let formWidth = screenWidth / 1.1;

const EmptyNFTView = (styles, selectedNftChain) => {
  return (
    <View style={styles.centerView}>
      <Text
        style={
          styles.emptyText
        }>{`No NFT found in ${selectedNftChain} chain`}</Text>
    </View>
  );
};

const NFTList = () => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const nftData = useSelector(getSelectedNftData, shallowEqual);
  const loading = useSelector(getSelectedNftLoading, shallowEqual);
  const selectedNftChain = useSelector(getSelectedNftChain, shallowEqual);
  const available = useSelector(getSelectedNftAvailable, shallowEqual);
  const dispatch = useDispatch();
  const isFetchingRef = useRef({});
  const navigation = useNavigation();

  const renderItem = useCallback(
    ({item, index}) => {
      return (
        <NFTMainChainItem
          item={item}
          theme={theme}
          dispatch={dispatch}
          navigation={navigation}
        />
      );
    },
    [dispatch, navigation, theme],
  );

  const onRefresh = useCallback(() => {
    dispatch(fetchNft({selectedNftChain}));
  }, [dispatch, selectedNftChain]);

  const onEndReach = useCallback(async () => {
    const fetchRef = isFetchingRef.current[selectedNftChain];
    if (!fetchRef && available) {
      isFetchingRef.current[selectedNftChain] = true;
      await dispatch(fetchNft({selectedNftChain, cursor: available})).unwrap();
      isFetchingRef.current[selectedNftChain] = false;
    }
  }, [available, dispatch, selectedNftChain]);

  return (
    <View style={styles.mainView}>
      <NFTChainList />
      {loading && !nftData?.length ? (
        <View style={styles.centerView}>
          <Loading />
        </View>
      ) : (
        <FlatList
          data={nftData}
          keyExtractor={(item, index) => `${item?.tokenAddress}_${index}`}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.contentContainerStyle}
          columnWrapperStyle={styles.columnStyle}
          ListEmptyComponent={EmptyNFTView(styles, selectedNftChain)}
          refreshing={loading}
          onRefresh={onRefresh}
          onEndReached={onEndReach}
          extraData={selectedNftChain}
        />
      )}
    </View>
  );
};
const myStyles = theme =>
  StyleSheet.create({
    safeAreaView: {
      flex: 1,
    },
    mainView: {
      flex: 1,
      justifyContent: 'flex-start',
    },
    centerView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 12,
      width: formWidth,
      alignSelf: 'center',
    },
    headerTitle: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },

    headerNumber: {
      color: theme.font,
      fontSize: 24,
      fontFamily: 'Roboto-Regular',
    },
    btn: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      position: 'absolute',
      zIndex: 9999,
      bottom: 25,
      backgroundColor: theme.whiteOutline,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    btnText: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      marginRight: 10,
      marginLeft: 4,
    },
    circle: {
      fill: theme.background,
    },
    emptyText: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
    },
    contentContainerStyle: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    columnStyle: {
      justifyContent: 'space-between',
    },
  });
export default NFTList;
