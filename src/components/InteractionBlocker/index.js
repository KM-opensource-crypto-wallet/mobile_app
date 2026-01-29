import React, {memo} from 'react';
import {View, Text, ActivityIndicator} from 'react-native';
import myStyles from './InteractionBlockerStyles';

const InteractionBlocker = ({visible, theme}) => {
  const styles = myStyles(theme);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.background} />
        <Text style={styles.title}>Creating wallets...</Text>
        <Text style={styles.subtitle}>Please wait, do not close the app</Text>
      </View>
    </View>
  );
};

export default memo(InteractionBlocker);
