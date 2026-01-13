import React, {useCallback, useContext, useMemo} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {currencySymbol} from 'data/currency';
import {CryptoList} from 'components/CryptoList';
import WalletConnectStatus from 'components/WalletConnectStatus';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import {
  getLocalCurrency,
  isSearchInHomeScreen,
} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {
  countTotalAssets,
  isImportWalletWithPrivateKey,
  selectCurrentWallet,
  selectUserCoins,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {useNavigation} from '@react-navigation/native';
import {ThemeContext} from 'theme/ThemeContext';
import {selectAllNewCoins} from 'dok-wallet-blockchain-networks/redux/currency/currencySelectors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {setNewCoins} from 'dok-wallet-blockchain-networks/redux/currency/currencySlice';
import {syncCoinsWithServer} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import BatchTransactionBanner from 'components/BatchTransactionBanner';

const {width: screenWidth} = Dimensions.get('window');

let formWidth = screenWidth / 1.1;

const Coins = () => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const localCurrency = useSelector(getLocalCurrency);
  const totalAssets = useSelector(countTotalAssets);
  const userCoins = useSelector(selectUserCoins, shallowEqual);
  const navigation = useNavigation();
  const allNewCoins = useSelector(selectAllNewCoins);
  const currentWallet = useSelector(selectCurrentWallet);
  const isImportWithPrivateKey = useSelector(isImportWalletWithPrivateKey);
  const searchInHomeScreen = useSelector(isSearchInHomeScreen);

  const dispatch = useDispatch();

  const coinsNames = useMemo(() => {
    const tempNewCoins = Array.isArray(allNewCoins) ? allNewCoins : [];
    return tempNewCoins.map(item => item.name).join(', ');
  }, [allNewCoins]);

  const onPressClose = useCallback(() => {
    dispatch(setNewCoins([]));
  }, [dispatch]);

  const onPressSync = useCallback(() => {
    dispatch(setNewCoins([]));
    dispatch(syncCoinsWithServer());
  }, [dispatch]);

  return (
    <>
      <View style={styles.mainView}>
        <BatchTransactionBanner />
        {!!coinsNames && !isImportWithPrivateKey && (
          <View style={styles.syncView}>
            <Text style={styles.syncTitle} numberOfLines={2}>
              {`New ${
                allNewCoins?.length === 1
                  ? 'cryptocurrency'
                  : 'cryptocurrencies'
              }, such as ${coinsNames} ${
                allNewCoins?.length === 1 ? 'is' : 'are'
              } now accessible.`}
            </Text>
            <TouchableOpacity style={styles.syncButton} onPress={onPressSync}>
              <Text style={styles.syncButtonTitle}>Sync</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onPressClose}>
              <MaterialCommunityIcons
                name={'close'}
                size={24}
                color={theme.font}
              />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Total Assets</Text>
          <Text style={styles.headerNumber}>
            {currencySymbol[localCurrency] + totalAssets}
          </Text>
        </View>
        <CryptoList
          number={1}
          list={userCoins}
          navigation={navigation}
          showSearch={searchInHomeScreen}
          currentWallet={currentWallet}
        />
        <WalletConnectStatus />
        {/* <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate('ManageCoins')}>
        <AddCircle height="25" width="25" style={styles.circle} />
        <Text style={styles.btnText}>More Coins</Text>
      </TouchableOpacity> */}
      </View>
    </>
  );
};
const myStyles = theme =>
  StyleSheet.create({
    safeAreaView: {
      flex: 1,
    },
    mainView: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 12,
      width: formWidth,
      alignSelf: 'center',
    },
    syncView: {
      paddingHorizontal: 16,
      height: 60,
      flexDirection: 'row',
      backgroundColor: theme.walletItemColor,
      alignItems: 'center',
    },
    syncButton: {
      paddingHorizontal: 24,
      height: 40,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      marginHorizontal: 12,
    },
    headerTitle: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
    syncTitle: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
      flex: 1,
    },

    syncButtonTitle: {
      color: 'white',
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
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
      zIndex: 8888,
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
  });
export default Coins;
