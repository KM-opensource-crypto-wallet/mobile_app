import React from 'react';
import {View, Text, FlatList} from 'react-native';
import myStyles from './PrivacyMode';

import {useSelector, useDispatch} from 'react-redux';
import {useContext} from 'react';
import {ThemeContext} from 'theme/ThemeContext';

import {togglePrivacyMode} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {selectVisibleWallets} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {Avatar, Switch} from 'react-native-paper';
import {DokSafeAreaView} from 'components/DokSafeAreaView';

const PrivacyMode = () => {
  const visibleWallets = useSelector(selectVisibleWallets);

  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const dispatch = useDispatch();

  return (
    <DokSafeAreaView style={styles.container}>
      <View style={styles.container}>
        <Text style={styles.title}>
          {'When you enable Privacy Mode for your wallet:\n\n' +
            '\t• The addresses for all coins in the wallet will automatically reset to the default address each time you restart the app.\n' +
            '\t• This ensures enhanced privacy and security for your transactions.'}
        </Text>
        <FlatList
          data={visibleWallets}
          contentContainerStyle={styles.contentContainerStyle}
          keyExtractor={item => item.clientId}
          renderItem={({item}) => (
            <View style={styles.walletBox}>
              <View style={styles.rowView}>
                <View style={styles.avatarWrapper}>
                  <Avatar.Image
                    style={styles.avatarAvatar}
                    size={54}
                    source={require('assets/images/Mark.png')}
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.mainText}>{item.walletName}</Text>
                </View>
              </View>
              <View>
                <Switch
                  value={!!item.privacyMode}
                  onValueChange={value => {
                    dispatch(togglePrivacyMode({clientId: item.clientId}));
                  }}
                  trackColor={{false: 'gray', true: '#E8E8E8'}}
                  thumbColor={item.privacyMode ? theme.background : 'white'}
                  ios_backgroundColor="#E8E8E8"
                />
              </View>
            </View>
          )}
        />
      </View>
    </DokSafeAreaView>
  );
};

export default PrivacyMode;
