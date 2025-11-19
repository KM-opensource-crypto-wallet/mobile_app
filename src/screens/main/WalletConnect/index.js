import React, { useContext, useCallback } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import myStyles from './WalletsConnectStyles';
import { ThemeContext } from '../../../theme/ThemeContext';
import FastImage from '@d11/react-native-fast-image';
import WalletConnectImage from '../../../assets/images/WalletConnect.png';
import WalletConnectItem from '../../../components/WalletConnectItem';
import { DokSafeAreaView } from '../../../components/DokSafeAreaView';

const WalletConnect = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const styles = myStyles(theme);

  const onPressNewConnection = useCallback(() => {
    navigation.navigate('Scanner', { page: 'Home', walletConnect: true });
  }, [navigation]);

  return (
    <DokSafeAreaView style={styles.container}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.contentContainerStyle}
          bounces={false}>
          <FastImage
            source={WalletConnectImage}
            style={styles.mainImageStyle}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={onPressNewConnection}>
            <Text style={styles.buttonTitle}>{'New Connection'}</Text>
          </TouchableOpacity>
          <View style={styles.borderView} />
          <WalletConnectItem />
        </ScrollView>
      </View>
    </DokSafeAreaView>
  );
};

export default WalletConnect;
