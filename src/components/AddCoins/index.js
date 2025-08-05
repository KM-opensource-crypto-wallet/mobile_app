import React, {useContext, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './AddCoinsStyles';

import {useNavigation} from '@react-navigation/native';
import CoinItem from 'components/CoinItem/CoinItem';
import Loading from 'components/Loading';
import {
  getCurrencyLoading,
  getMissingCoins,
} from 'dok-wallet-blockchain-networks/redux/currency/currencySelectors';
import {setMissingCoins} from 'dok-wallet-blockchain-networks/redux/currency/currencySlice';
import {setPaymentData} from 'dok-wallet-blockchain-networks/redux/extraData/extraDataSlice';
import {getPaymentData} from 'dok-wallet-blockchain-networks/redux/extraData/extraSelectors';
import {addOrToggleCoinInWallet} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {refreshCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {setCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';

const AddCoins = ({visible, hideModal}) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const paymentData = useSelector(getPaymentData);
  const loading = useSelector(getCurrencyLoading);
  const missingCoins = useSelector(getMissingCoins);
  const filteredMissingCoins = useMemo(
    () => missingCoins.filter(item => !item?.isInWallet),
    [missingCoins],
  );

  const [adding, setAdding] = useState(false);

  const handleDismiss = () => {
    hideModal(false);
    dispatch(setMissingCoins([]));
    dispatch(setPaymentData(null));
  };

  const handleAddAndContinue = async () => {
    setAdding(true);
    try {
      for (const coin of missingCoins) {
        if (coin?.isInWallet) {
          dispatch(setCurrentCoin(coin._id));
        } else {
          const {newCoin, existingCoinId} = await dispatch(
            addOrToggleCoinInWallet(coin),
          ).unwrap();
          if (existingCoinId) {
            dispatch(setCurrentCoin(existingCoinId));
          }
          if (newCoin) {
            await dispatch(refreshCurrentCoin({currentCoin: newCoin}));
            dispatch(setCurrentCoin(newCoin?._id));
          }
        }
      }

      const currentDate = new Date().toISOString();
      navigation.navigate('SendFunds', {
        ...paymentData,
        amount: paymentData?.amount,
        address: paymentData?.address,
        memo: paymentData?.meta?.memo,
        date: currentDate,
      });
      handleDismiss();
    } catch (error) {
      console.error('Failed to add coins:', error);
      // Consider showing a toast or error message to the user
    } finally {
      setAdding(false);
    }
  };
  const handleCloseApp = () => {
    handleDismiss();
    if (paymentData?.redirect_url) {
      Linking.openURL(paymentData.redirect_url);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      statusBarTranslucent
      animationType="slide"
      onDismiss={handleDismiss}>
      <View style={styles.container}>
        {loading ? (
          <View>
            <Loading />
          </View>
        ) : (
          <View style={styles.modalView}>
            <View style={styles.infoList}>
              <Text style={styles.titleInfo}>Add Coins</Text>
              <Text style={[styles.titleInfo, {fontSize: 14}]}>
                This coin is not added in your wallet, would you like to add it
                ?
              </Text>
            </View>
            {filteredMissingCoins.length > 0 ? (
              <TouchableOpacity disabled style={styles.coinList}>
                {filteredMissingCoins.map(coin => (
                  <CoinItem key={`coins-list-${coin?._id}`} item={coin} />
                ))}
              </TouchableOpacity>
            ) : (
              <View style={styles.errorBox}>
                <Text style={styles.error}>
                  This coin is not found, import the coin manually inorder to
                  use it.
                </Text>
              </View>
            )}
            <View style={styles.btnList}>
              <TouchableOpacity
                disabled={adding}
                style={[styles.button, adding && {backgroundColor: theme.gray}]}
                onPress={handleDismiss}>
                <Text style={styles.buttonTitle}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={adding}
                style={[styles.button, adding && {backgroundColor: theme.gray}]}
                onPress={
                  filteredMissingCoins.length > 0
                    ? handleAddAndContinue
                    : handleCloseApp
                }>
                {adding ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonTitle}>
                    {filteredMissingCoins.length > 0 ? 'Add' : 'Close App'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

export default AddCoins;
