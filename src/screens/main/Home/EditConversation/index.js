import React, {
  useContext,
  useRef,
  useCallback,
  useLayoutEffect,
  useMemo,
} from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import myStyles from './EditConversation';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { ThemeContext } from 'theme/ThemeContext';
import Exclamationcircleo from 'assets/images/icons/exclamationcircle.svg';
import { addConversationsName } from 'dok-wallet-blockchain-networks/redux/messages/messageSlice';
import { getSelectedConversations } from 'dok-wallet-blockchain-networks/redux/messages/messageSelector';
import { getCustomizePublicAddress } from 'dok-wallet-blockchain-networks/helper';
import { DokSafeAreaView } from 'components/DokSafeAreaView';

const EditConversation = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const styles = myStyles(theme);
  const formikRef = useRef(null);
  const dispatch = useDispatch();
  const conversation = useSelector(getSelectedConversations, shallowEqual);

  const title = useMemo(() => {
    return (
      conversation?.name || getCustomizePublicAddress(conversation?.peerAddress)
    );
  }, [conversation?.name, conversation?.peerAddress]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `Edit ${title}`,
    });
  }, [navigation, title]);

  const validationSchema = Yup.object().shape({
    name: Yup.string().optional(),
  });

  const onSubmit = useCallback(
    values => {
      dispatch(addConversationsName({ name: values?.name }));
      navigation.goBack();
    },
    [dispatch, navigation],
  );

  return (
    <DokSafeAreaView style={styles.safeAreaView}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          keyboardVerticalOffset={80}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}>
          <View style={styles.formInput}>
            <Text style={styles.brand}>{''}</Text>
            <Formik
              enableReinitialize={true}
              initialValues={{
                name: conversation?.name || '',
              }}
              innerRef={formikRef}
              validationSchema={validationSchema}
              onSubmit={onSubmit}>
              {({ handleChange, handleSubmit, values, errors }) => (
                <View
                  style={{
                    flex: 1,
                  }}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={styles.input}
                      label="Name"
                      textColor={theme.font}
                      maxLength={50}
                      theme={{
                        colors: {
                          onSurfaceVariant: errors.name ? 'red' : theme.gray,
                        },
                      }}
                      outlineColor={errors.name ? 'red' : theme.gray}
                      activeOutlineColor={
                        errors.name ? 'red' : theme.borderActiveColor
                      }
                      autoCapitalize="none"
                      returnKeyType="next"
                      mode="outlined"
                      blurOnSubmit={false}
                      name="name"
                      autoFocus={true}
                      onChangeText={handleChange('name')}
                      value={values.name}
                    />
                    {errors.name && (
                      <Text style={styles.textConfirm}>{errors.name}</Text>
                    )}
                    <View>
                      <Exclamationcircleo
                        height="20"
                        width="20"
                        fill={theme.font}
                      />
                      <Text style={styles.info}>
                        {
                          'Note: The name is displayed instead of the address, and the information is stored locally on your device.\nIf you want to display the address, set the name field to empty.'
                        }
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleSubmit}>
                    <Text style={styles.buttonTitle}>{'Save'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </DokSafeAreaView>
  );
};

export default EditConversation;
