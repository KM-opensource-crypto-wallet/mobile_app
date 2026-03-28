import myStyles from './ResetWalletStyles';
import React, {useContext} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import {CREATE_WALLET, IMPORT_WALLET} from 'utils/wlData';

const ResetWallet = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const isFromOnBoarding = route?.params?.isFromOnBoarding;

  return (
    <DokSafeAreaView style={styles.safeAreaView}>
      <View style={styles.container}>
        <View style={styles.infoList}>
          <Text style={styles.titleInfo}>Set up </Text>
          <Text style={styles.titleInfo}>your Wallet </Text>
          <Text style={styles.info}>
            {
              'A cryptocurrency wallet is simply a virtual wallet used to send, receive and store digital assets such as Bitcoin, Ethereum, BNB and Solana, among others.'
            }
          </Text>
          <Text style={styles.info}>
            To set up a wallet, we will generate a seed phrase for you,
            consisting of 12 unique words. It is very important that you store
            your seed phrase in a safe place.
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('LearnReset')}>
            <Text style={styles.learnText}>Learn more</Text>
          </TouchableOpacity>

          <View style={styles.btnList}>
            {/* Create Wallet */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('CreateWallet')}
              style={styles.card}>
              <View style={styles.imageBox}>
                <View pointerEvents="none">
                  <CREATE_WALLET height={150} width={150} />
                  <View style={styles.textBox}>
                    <Text style={{...styles.textBtn, color: theme.font}}>
                      Create
                    </Text>
                    <Text
                      style={{
                        ...styles.textBtn,
                        color: theme.backgroundColor,
                      }}>
                      Wallet
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Create Wallet</Text>
                <Text style={styles.cardSubtitle}>
                  Generate a brand-new wallet with a fresh 12-word seed phrase.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Import Wallet */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('ImportWallet', {isAdd: !!isFromOnBoarding})
              }
              style={styles.card}>
              <View style={styles.imageBox}>
                <View pointerEvents="none">
                  <IMPORT_WALLET height={150} width={150} />
                  <View style={styles.textBox2}>
                    <Text
                      style={{
                        ...styles.textBtn,
                        color: theme.background,
                      }}>
                      Import
                    </Text>
                    <Text
                      style={{
                        ...styles.textBtn,
                        color: 'white',
                      }}>
                      Wallet
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Import Wallet</Text>
                <Text style={styles.cardSubtitle}>
                  Restore an existing wallet using your seed phrase or private
                  key.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </DokSafeAreaView>
  );
};

export default ResetWallet;
