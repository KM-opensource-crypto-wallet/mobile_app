import React, {useContext} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';

const Loading = () => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.background} />
    </View>
  );
};

const myStyles = theme =>
  StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
  });

export default Loading;
