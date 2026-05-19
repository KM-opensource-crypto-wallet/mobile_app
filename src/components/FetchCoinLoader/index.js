import {memo} from 'react';
import {View, Text, ActivityIndicator, Modal} from 'react-native';
import myStyles from './FetchCoinLoaderStyles';

const FetchCoinLoader = ({visible, theme}) => {
  const styles = myStyles(theme);

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent={true} onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={theme.background} />
          <Text style={styles.title}>Fetching Coin Details...</Text>
          <Text style={styles.subtitle}>Please wait, do not close the app</Text>
        </View>
      </View>
    </Modal>
  );
};

export default memo(FetchCoinLoader);
