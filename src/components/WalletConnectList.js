import React, {useRef, useContext} from 'react';
import {View, StyleSheet} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import DokBottomSheetScrollView from 'components/BottomSheetScrollView';

import WalletConnectItem from 'components/WalletConnectItem';

const WalletConnectList = ({bottomSheetRef, onDismiss}) => {
  const {theme} = useContext(ThemeContext);
  const styles = MyStyles(theme);
  const bottomRef = useRef();

  return (
    <DokBottomSheetScrollView
      bottomSheetRef={ref => {
        bottomSheetRef(ref);
        bottomRef.current = ref;
      }}
      snapPoints={['90%']}
      onDismiss={() => {
        onDismiss();
      }}>
      <View style={styles.mainView}>
        <WalletConnectItem
          onClose={() => {
            bottomRef.current?.close();
          }}
        />
      </View>
    </DokBottomSheetScrollView>
  );
};
const MyStyles = theme =>
  StyleSheet.create({
    mainView: {
      paddingVertical: 20,
      backgroundColor: theme.backgroundColor,
    },
  });
export default WalletConnectList;
