import React, {useContext, useRef} from 'react';
import {StyleSheet, View, Text, Image} from 'react-native';
import DokBottomSheet from 'components/BottomSheet';
import {ThemeContext} from 'theme/ThemeContext';
import DOWNLOAD_ICON from 'assets/images/icons/download.png';
import PLUS_ICON from 'assets/images/icons/plus-icon.png';
import {useNavigation} from '@react-navigation/native';
import {TouchableOpacity} from '@gorhom/bottom-sheet';

const CreateWalletSheet = ({bottomSheetRef, onDismiss}) => {
  const navigation = useNavigation();
  const {theme} = useContext(ThemeContext);
  const myStyles = styles(theme);
  const bottomRef = useRef();
  return (
    <DokBottomSheet
      bottomSheetRef={ref => {
        bottomSheetRef(ref);
        bottomRef.current = ref;
      }}
      onDismiss={onDismiss}>
      <View style={myStyles.mainView}>
        <TouchableOpacity
          style={myStyles.itemView}
          onPress={() => {
            bottomRef.current?.close();
            navigation.push('CreateWallet');
          }}>
          <Image
            source={PLUS_ICON}
            style={myStyles.plusIcon}
            resizeMode={'cover'}
          />
          <View>
            <Text style={myStyles.title}>{"I don't have a wallet"}</Text>
            <Text style={myStyles.description}>
              {'Create a new multi-chain wallet'}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={myStyles.itemView}
          onPress={() => {
            bottomRef.current?.close();
            navigation.navigate('ImportWallet', {isAdd: true});
          }}>
          <Image
            source={DOWNLOAD_ICON}
            style={myStyles.downloadIcon}
            resizeMode={'cover'}
          />
          <View>
            <Text style={myStyles.title}>{'I already have a wallet'}</Text>
            <Text style={myStyles.description}>{'Import a wallet'}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </DokBottomSheet>
  );
};
const styles = theme =>
  StyleSheet.create({
    mainView: {
      padding: 20,
      backgroundColor: theme.backgroundColor,
    },
    itemView: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      backgroundColor: theme.walletItemColor,
      borderRadius: 8,
      marginBottom: 16,
      alignItems: 'center',
    },
    title: {
      color: theme.font,
      fontSize: 16,
      marginBottom: 6,
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
    },
    description: {
      color: theme.primary,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
    plusIcon: {
      height: 24,
      width: 24,
      marginRight: 16,
    },
    downloadIcon: {
      height: 24,
      width: 24,
      marginRight: 16,
    },
  });

export default CreateWalletSheet;
