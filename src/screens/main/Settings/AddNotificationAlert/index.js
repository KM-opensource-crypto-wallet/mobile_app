import React, {useCallback, useContext} from 'react';
import {View} from 'react-native';
import {useSelector} from 'react-redux';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './AddNotificationAlertStyles';
import {selectAllWallets} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import NotificationWalletStep from 'components/NotificationWalletStep';
import {
  isEVMChain,
  isBitcoinChain,
} from 'dok-wallet-blockchain-networks/helper';

const AddNotificationAlert = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const allWallets = useSelector(selectAllWallets);

  const coinFilter = useCallback(
    c =>
      (c.isInWallet &&
        (c.chain_name === 'ethereum' ||
          c.chain_name === 'binance_smart_chain') &&
        c.type === 'token') ||
      isBitcoinChain(c.chain_name),
    [],
  );

  const onSelectWallet = wallet => {
    navigation.navigate('AddNotificationAlertCoins', {
      walletClientId: wallet.clientId,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.stepIndicator}>
        {[1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={[
              styles.stepDot,
              i === 1 ? styles.stepDotActive : styles.stepDotInactive,
            ]}
          />
        ))}
      </View>
      <NotificationWalletStep
        wallets={allWallets}
        onSelectWallet={onSelectWallet}
        coinFilter={coinFilter}
      />
    </View>
  );
};

export default AddNotificationAlert;
