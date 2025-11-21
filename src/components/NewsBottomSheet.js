import React, {useRef, useContext} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import DokBottomSheetScrollView from 'components/BottomSheetScrollView';

const NewsBottomSheet = ({bottomSheetRef, onDismiss, message}) => {
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
        <Text style={styles.title}>{'Important News!'}</Text>
        <Text style={styles.description}>{message}</Text>
      </View>
    </DokBottomSheetScrollView>
  );
};
const MyStyles = theme =>
  StyleSheet.create({
    mainView: {
      padding: 20,
      backgroundColor: theme.backgroundColor,
    },
    title: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
      marginBottom: 20,
    },
    description: {
      color: theme.primary,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
    },
  });
export default NewsBottomSheet;
