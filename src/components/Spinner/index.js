import React, {useContext} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Modal,
  View,
  Text,
} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import PropTypes from 'prop-types';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const Spinner = ({isShownTransactionText}) => {
  const {theme} = useContext(ThemeContext);
  const {bottom} = useSafeAreaInsets();
  const styles = myStyles(theme, bottom || 0);
  return (
    <Modal style={styles.flex1} visible={true} transparent={true}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.background} />
        {isShownTransactionText ? (
          <View style={styles.paddingView}>
            <Text style={styles.text}>
              {
                'The transaction is submitting. It may take a few minutes. Please avoid pressing the back button or closing the app.'
              }
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
};

const myStyles = (theme, bottomInset) =>
  StyleSheet.create({
    flex1: {
      flex: 1,
    },
    container: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      width: screenWidth,
      height: screenHeight,
    },
    paddingView: {
      padding: 20,
      backgroundColor: 'white',
      position: 'absolute',
      zIndex: 9999,
      paddingBottom: 20 + bottomInset,
      bottom: 0,
    },
    text: {
      color: theme.gray,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
      textAlign: 'center',
      marginTop: 20,
      marginHorizontal: 20,
    },
  });

Spinner.propTypes = {
  isShownTransactionText: PropTypes.bool,
};

export default Spinner;
