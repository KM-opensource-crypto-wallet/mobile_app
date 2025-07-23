import React, {useContext, useEffect, useMemo} from 'react';
import {Linking, Modal, Text, TouchableOpacity, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './AddCoinsStyles';

import CoinItem from 'components/CoinItem/CoinItem';
import Loading from 'components/Loading';
import {
  isAllCoinsLoading,
  selectAllCoins,
} from 'dok-wallet-blockchain-networks/redux/currency/currencySelectors';
import {fetchAllCoins} from 'dok-wallet-blockchain-networks/redux/currency/currencySlice';
import {getPaymentData} from 'dok-wallet-blockchain-networks/redux/extraData/extraSelectors';
import {addOrToggleCoinInWallet} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {useNavigation} from '@react-navigation/native';
import {setPaymentData} from 'dok-wallet-blockchain-networks/redux/extraData/extraDataSlice';

const AddCoins = ({visible, hideModal}) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const paymentData = useSelector(getPaymentData);
  const allCoins = useSelector(selectAllCoins);
  const isAllCoinLoading = useSelector(isAllCoinsLoading);

  const [chain_name, symbol] = useMemo(
    () => paymentData?.currency?.split(':') || [],
    [paymentData?.currency],
  );
  const coin = useMemo(
    () =>
      allCoins.find(
        item => item.chain_name === chain_name && item.symbol === symbol,
      ),
    [allCoins, chain_name, symbol],
  );

  useEffect(() => {
    dispatch(
      fetchAllCoins({search: symbol || chain_name?.replaceAll('_', ' ')}),
    );
  }, [chain_name, dispatch, symbol]);

  const handleDismiss = () => {
    hideModal(false);
  };
  const handleAddAndContinue = () => {
    dispatch(addOrToggleCoinInWallet(coin));
    const currentDate = new Date().toISOString();
    setTimeout(() => {
      navigation.navigate('SendFunds', {
        ...paymentData,
        amount: paymentData?.amount,
        address: paymentData?.address,
        memo: paymentData?.meta?.memo,
        date: currentDate,
      });
      dispatch(setPaymentData(null));
    }, 0);
    handleDismiss();
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
        <View style={styles.modalView}>
          <View style={styles.infoBox}>
            <View style={styles.infoList}>
              <Text style={styles.titleInfo}>
                This coin is not added in your wallet, would you like to add it
                ?
              </Text>
            </View>
            {isAllCoinLoading ? (
              <View style={{padding: 20}}>
                <Loading />
              </View>
            ) : coin ? (
              <TouchableOpacity disabled>
                <CoinItem item={coin} />
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
                style={[styles.learnBox, styles.learnBorder]}
                onPress={handleDismiss}>
                <Text style={styles.learnText}>Cancel</Text>
              </TouchableOpacity>
              {coin ? (
                <TouchableOpacity
                  style={styles.learnBox}
                  onPress={handleAddAndContinue}>
                  <Text style={styles.learnText}>Add and Continue</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.learnBox}
                  onPress={handleCloseApp}>
                  <Text style={styles.learnText}>Close App</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddCoins;
