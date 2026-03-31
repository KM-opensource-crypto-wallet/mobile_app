import React, {memo, useCallback, useContext} from 'react';
import {View, Text, FlatList, TouchableOpacity} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './NotificationWalletStepStyles';

const NotificationWalletStep = ({wallets, onSelectWallet}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const renderItem = useCallback(
    ({item}) => (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => onSelectWallet(item)}>
        <MaterialCommunityIcons name="wallet" size={24} color={theme.font} />
        <View style={styles.flexOne}>
          <Text style={styles.listItemText}>{item.walletName}</Text>
          <Text style={styles.listItemSubtext}>
            {`${item.coins?.filter(c => c.isInWallet)?.length || 0} coins`}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={theme.gray}
        />
      </TouchableOpacity>
    ),
    [onSelectWallet, styles, theme],
  );

  return (
    <FlatList
      data={wallets}
      renderItem={renderItem}
      keyExtractor={item => item.clientId}
      bounces={false}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No wallets found</Text>
        </View>
      }
    />
  );
};

export default memo(NotificationWalletStep);
