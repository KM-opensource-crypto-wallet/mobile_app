import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {TouchableOpacity, View, Text} from 'react-native';
import {TextInput} from 'react-native-paper';
import {Formik} from 'formik';
import * as Yup from 'yup';
import myStyles from './ImportWalletByPrivateKeyStyles';
import {ThemeContext} from 'theme/ThemeContext';
import {IS_ANDROID} from 'utils/dimensions';
import SelectInput from 'components/SelectInput';
import {PrivateKeyList} from 'dok-wallet-blockchain-networks/helper';
import {getChain} from 'dok-wallet-blockchain-networks/cryptoChain';

const ImportWalletByPrivateKey = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const [networkInput, setNetworkInput] = useState({});
  const formikRef = useRef();
  const data = route?.params?.data;

  useEffect(() => {
    if (data) {
      formikRef?.current?.setFieldValue('privateKey', data?.toString());
    }
  }, [data]);

  const onSubmit = useCallback(
    async values => {
      try {
        const chainName = networkInput?.value;
        const privateKey = values?.privateKey;
        if (chainName && privateKey) {
          const chain = getChain(chainName);
          const isValid = await chain.isValidPrivateKey({privateKey});
          if (isValid) {
            navigation.navigate('CreateWallet', {
              privateKey: values.privateKey,
              chain_name: chainName,
            });
          } else {
            formikRef.current?.setFieldError(
              'privateKey',
              'Invalid privateKey',
            );
          }
        }
      } catch (err) {
        if (err.stack) {
          console.error(`in importWallet: ${JSON.stringify(err)}`);
          formikRef.current?.setErrors({privateKey: 'Invalid privateKey'});
        }
      }
    },
    [navigation, networkInput?.value],
  );

  return (
    <View style={styles.container}>
      <View style={styles.formInput}>
        <Text style={styles.title}>Import</Text>
        <Text style={styles.title}>your Wallet</Text>
        <Text style={styles.listTitle}>
          Select a chain and enter your private key below to restore your crypto
          wallet.
        </Text>
        <SelectInput
          setValue={setNetworkInput}
          form={'Network'}
          number={'2'}
          listData={PrivateKeyList}
          initialValue={networkInput?.value}
        />
        <Formik
          initialValues={{privateKey: ''}}
          innerRef={formikRef}
          validationSchema={Yup.object().shape({
            privateKey: Yup.string().required('Private key is required'),
          })}
          onSubmit={onSubmit}>
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
          }) => (
            <View>
              <TextInput
                style={styles.input}
                multiline={true}
                numberOfLines={7}
                textColor={theme.font}
                maxHeight={150}
                autoComplete={'off'}
                autoCorrect={false}
                {...(IS_ANDROID ? {keyboardType: 'visible-password'} : {})}
                spellCheck={false}
                label="Enter private key"
                theme={{
                  colors: {
                    onSurfaceVariant: errors.privateKey ? 'red' : theme.gray,
                  },
                }}
                outlineColor={errors.privateKey ? 'red' : theme.gray}
                activeOutlineColor={errors.privateKey ? 'red' : theme.font}
                autoCapitalize="none"
                returnKeyType="next"
                mode="outlined"
                blurOnSubmit={false}
                name="privateKey"
                onChangeText={handleChange('privateKey')}
                onBlur={handleBlur('privateKey')}
                value={values.privateKey}
                onSubmitEditing={handleSubmit}
                right={
                  <TextInput.Icon
                    style={styles.scan}
                    icon="qrcode-scan"
                    iconColor={theme.backgroundColor}
                    size={15}
                    onPress={() => {
                      navigation.navigate('Scanner', {
                        page: 'ImportWalletByPrivateKey',
                      });
                    }}
                  />
                }
              />
              {errors.privateKey && touched.privateKey && (
                <Text style={styles.textConfirm}>{errors.privateKey}</Text>
              )}

              <TouchableOpacity
                style={[
                  styles.button,
                  (!values?.privateKey || !networkInput) && {
                    backgroundColor: theme.gray,
                  },
                ]}
                disabled={!values?.privateKey || !networkInput}
                onPress={handleSubmit}>
                <Text style={styles.buttonTitle}>Import</Text>
              </TouchableOpacity>
            </View>
          )}
        </Formik>
        <Text style={styles.info}>
          Your Private Key will be encrypted and stored on this device.
        </Text>
      </View>
    </View>
  );
};

export default ImportWalletByPrivateKey;
