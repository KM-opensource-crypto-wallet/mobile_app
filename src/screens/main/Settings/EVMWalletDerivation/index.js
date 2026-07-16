import React from 'react';
import {View, Text, FlatList} from 'react-native';
import myStyles from './EVMWalletDerivationStyles';

import {useSelector, useDispatch} from 'react-redux';
import {useContext} from 'react';
import {ThemeContext} from 'theme/ThemeContext';

import {
  addEVMAndTronDeriveAddresses,
  removeEVMDeriveAddresses,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {selectVisibleWalletsWithIndex} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {Avatar, Switch} from 'react-native-paper';
import {DokSafeAreaView} from 'components/DokSafeAreaView';

const EVMWalletDerivation = () => {
  const visibleWallets = useSelector(selectVisibleWalletsWithIndex);

  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const dispatch = useDispatch();

  return (
    <DokSafeAreaView style={styles.container}>
      <View style={styles.container}>
        <Text style={styles.title}>
          {'Add or remove derives address for all EVM, SOL and TRX coins.'}
        </Text>
        <FlatList
          data={visibleWallets}
          contentContainerStyle={styles.contentContainerStyle}
          keyExtractor={entry =>
            entry.wallet.clientId || entry.wallet.walletName
          }
          renderItem={({item: {wallet: item, index}}) =>
            item?.isImportWalletWithPrivateKey ? null : (
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
                    value={!!item.isEVMAddressesAdded}
                    onValueChange={value => {
                      if (value) {
                        dispatch(
                          addEVMAndTronDeriveAddresses({index, wallet: item}),
                        );
                      } else {
                        dispatch(removeEVMDeriveAddresses({index}));
                      }
                    }}
                    trackColor={{false: 'gray', true: '#E8E8E8'}}
                    thumbColor={
                      item.isEVMAddressesAdded ? theme.background : 'white'
                    }
                    ios_backgroundColor="#E8E8E8"
                  />
                </View>
              </View>
            )
          }
        />
      </View>
    </DokSafeAreaView>
  );
};

export default EVMWalletDerivation;
