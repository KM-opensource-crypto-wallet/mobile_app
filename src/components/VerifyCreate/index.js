import React, { useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';

import { useSelector } from 'react-redux';
import { ThemeContext } from '../../theme/ThemeContext';
import myStyles from './VerifyCreateStyles';
import { selectCurrentWallet } from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import { DokSafeAreaView } from '../../components/DokSafeAreaView';
import { useIsFocused } from '@react-navigation/native';
import {
  disabledPreventScreenshot,
  enablePreventScreenshot,
} from '../../utils/screenshot';

export const VerifyCreate = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  const styles = myStyles(theme);
  const isHideNextButton = route?.params?.isHideNextButton;

  const currentWallet = useSelector(selectCurrentWallet);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      enablePreventScreenshot().then(_ => { });
    } else {
      disabledPreventScreenshot().then(_ => { });
    }
  }, [isFocused]);

  if (!currentWallet?.phrase) {
    return;
  }
  const words = currentWallet.phrase.split(' ').map(w => ({ word: w }));

  const HeaderComponent = () => {
    return (
      <View>
        <Text style={styles.title}>Your{'\n'}seed phrase</Text>
        <Text style={styles.textFirst}>
          Get a pen and paper before you start.
        </Text>
        <Text style={styles.text}>
          Write down these words in the right order and save them somewhere
          safe.
        </Text>
      </View>
    );
  };

  const FooterComponent = () => {
    if (isHideNextButton) {
      return null;
    }
    return (
      <View>
        <TouchableOpacity
          style={styles.btn}
          onPress={() =>
            navigation.navigate('Verify', {
              random: words,
            })
          }>
          <Text style={styles.btnTitle}>I`ve written it down</Text>
        </TouchableOpacity>
        <Text style={styles.info}>
          You will confirm this phrase on the next screen
        </Text>
      </View>
    );
  };

  return (
    <DokSafeAreaView style={styles.container}>
      <View style={styles.container}>
        <FlatList
          bounces={false}
          data={words}
          numColumns={3}
          keyExtractor={(item, index) => '' + 'item' + index}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            alignItems: 'center',
          }}
          renderItem={({ item, index }) => (
            <View style={styles.wordsBox}>
              <Text style={styles.number}>{index + 1}</Text>
              <View style={styles.wordContainerIOS}>
                <Text style={styles.word}>{item.word}</Text>
              </View>
            </View>
          )}
          ListHeaderComponent={HeaderComponent()}
          ListFooterComponent={FooterComponent()}
        />
      </View>
    </DokSafeAreaView>
  );
};
