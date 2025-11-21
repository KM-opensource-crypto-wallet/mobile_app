import React, {useState, useEffect, useContext} from 'react';
import {
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  Provider,
  Checkbox,
} from 'react-native-paper';
import myStyles from './ModalQRStyles';
import {ThemeContext} from 'theme/ThemeContext';

export const ModalQR = ({navigation, visible, hideModal, data, qrScheme}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const WIDTH = Dimensions.get('window').width + 80;
  const ITEM_WIDTH = Math.round(WIDTH * 0.7);
  const {height: screenHeight} = Dimensions.get('window');
  const modalHeight = data ? screenHeight / 2.2 : screenHeight / 8;

  // const [visible, setVisible] = useState(true);
  // const hideModal = () => setVisible(false);
  const containerStyleValid = {
    backgroundColor: 'white',
    padding: 20,
    width: ITEM_WIDTH,
    alignSelf: 'center',
    borderRadius: 10,
    height: modalHeight,
  };

  const containerStyleInvalid = {
    backgroundColor: 'white',
    padding: 10,
    width: ITEM_WIDTH,
    flexDirection: 'column',
    alignSelf: 'center',
    borderRadius: 10,
    height: modalHeight,
  };

  return (
    // <Provider>
    //   <Portal>
    <Modal
      visible={visible}
      contentContainerStyle={data ? containerStyleValid : containerStyleInvalid}
      onDismiss={() => hideModal(false)}>
      {data ? (
        <View>
          <Text style={styles.title}>My wallet address</Text>

          <Text style={styles.span}>{data}</Text>
          <Text style={styles.span} />

          <Text style={styles.info}>
            Use this as reference to confirm your wallet address on Business
            console.
          </Text>

          <TouchableOpacity
            style={{
              ...styles.btnVerify,
              backgroundColor: theme.background,
            }}
            // onPress={() => {
            //   hideModal(), navigation.navigate("VerifyCreate");
            // }}
            onPress={() => hideModal(false)}>
            <Text style={styles.verifyTitle}>OK</Text>
          </TouchableOpacity>
        </View>
      ) : qrScheme ? (
        <View>
          <Text style={styles.info2}>{`Currently we are not supporting "${
            typeof qrScheme === 'string' ? qrScheme?.toUpperCase() : 'not known'
          }" chain`}</Text>
        </View>
      ) : (
        <View>
          <Text style={styles.info2}>Address not supported yet</Text>
        </View>
      )}
    </Modal>
    //   </Portal>
    // </Provider>
  );
};
