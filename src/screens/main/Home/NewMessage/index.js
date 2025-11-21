import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {TouchableOpacity, View, Text, ActivityIndicator} from 'react-native';
import {TextInput} from 'react-native-paper';
import {Formik} from 'formik';
import * as Yup from 'yup';
import myStyles from './NewMessageStyles';
import {ThemeContext} from 'theme/ThemeContext';
import {IS_ANDROID} from 'utils/dimensions';
import {getChain} from 'dok-wallet-blockchain-networks/cryptoChain';
import {XMTP} from 'utils/xmtp';
import {showToast} from 'utils/toast';
import {setSelectedConversation} from 'dok-wallet-blockchain-networks/redux/messages/messageSlice';
import {useDispatch} from 'react-redux';

const NewMessage = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const formikRef = useRef();
  const data = route?.params?.data;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (data) {
      formikRef?.current?.setFieldValue('address', data?.toString());
    }
  }, [data]);

  const onSubmit = useCallback(
    async values => {
      try {
        setIsSubmitting(true);
        const address = values?.address;
        const chain = getChain('ethereum');
        const isValid = await chain.isValidAddress({address});
        let validAddress = null;
        if (!isValid) {
          validAddress = await chain?.isValidName({name: address});
        }
        if (isValid || validAddress) {
          const isExists = await XMTP.checkAccountExists({
            address: validAddress || address,
          });
          if (isExists) {
            const conversation = await XMTP.newConversation({
              address: validAddress || address,
            });
            const formattedConversation = await XMTP.formatConversation([
              conversation,
            ]);
            dispatch(
              setSelectedConversation({
                address: formattedConversation[0].clientAddress,
                topic: formattedConversation[0].topic,
              }),
            );
            navigation.replace('Message');
          } else {
            showToast({
              type: 'errorToast',
              title: "Account doesn't exist",
              message: 'Please check account properly',
            });
          }
        } else {
          formikRef.current?.setFieldError('address', 'Invalid address');
        }
        setIsSubmitting(false);
      } catch (err) {
        setIsSubmitting(false);
        console.error('Error in new message', err);
        showToast({
          type: 'errorToast',
          title: 'Something went wrong',
        });
      }
    },
    [dispatch, navigation],
  );

  return (
    <View style={styles.container}>
      <View style={styles.formInput}>
        <Text style={styles.listTitle}>
          Enter a ethereum address to create a new message conversation
        </Text>
        <Formik
          initialValues={{address: ''}}
          innerRef={formikRef}
          validationSchema={Yup.object().shape({
            address: Yup.string().required('address is required'),
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
                maxHeight={150}
                textColor={theme.font}
                autoComplete={'off'}
                autoCorrect={false}
                {...(IS_ANDROID ? {keyboardType: 'visible-password'} : {})}
                spellCheck={false}
                label="Enter address"
                theme={{
                  colors: {
                    onSurfaceVariant: errors.address ? 'red' : theme.gray,
                  },
                }}
                outlineColor={errors.address ? 'red' : theme.gray}
                activeOutlineColor={errors.address ? 'red' : theme.font}
                autoCapitalize="none"
                returnKeyType="next"
                mode="outlined"
                blurOnSubmit={false}
                name="address"
                onChangeText={handleChange('address')}
                onBlur={handleBlur('address')}
                value={values.address}
                onSubmitEditing={handleSubmit}
                right={
                  <TextInput.Icon
                    style={styles.scan}
                    icon="qrcode-scan"
                    iconColor={theme.backgroundColor}
                    size={15}
                    onPress={() => {
                      navigation.navigate('Scanner', {
                        page: 'NewMessage',
                      });
                    }}
                  />
                }
              />
              {errors.address && touched.address && (
                <Text style={styles.textConfirm}>{errors.address}</Text>
              )}

              <TouchableOpacity
                style={[
                  styles.button,
                  !values?.address && {
                    backgroundColor: theme.gray,
                  },
                ]}
                disabled={!values?.address || isSubmitting}
                onPress={handleSubmit}>
                {isSubmitting ? (
                  <ActivityIndicator color={'white'} size={'large'} />
                ) : (
                  <Text style={styles.buttonTitle}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      </View>
    </View>
  );
};

export default NewMessage;
