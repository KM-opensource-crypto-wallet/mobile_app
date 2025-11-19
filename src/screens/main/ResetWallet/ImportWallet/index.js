import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import englishMnemonics from 'bip39/src/wordlists/english.json';
import { TextInput } from 'react-native-paper';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import myStyles from './ImportWalletStyles';
import { ThemeContext } from 'theme/ThemeContext';
import { IS_ANDROID, IS_IOS } from 'utils/dimensions';
import { validateMnemonic } from 'bip39';
import { useKeyboardHeight } from 'hooks/useKeyboardHeight';
import { fetchWordsStartingWith } from 'dok-wallet-blockchain-networks/helper';
import { DokSafeAreaView } from 'components/DokSafeAreaView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ImportWallet = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const styles = myStyles(theme);
  const keyboardHeight = useKeyboardHeight();
  const [suggestionMnemonic, setSuggestionMnemonic] = useState([]);
  const { bottom } = useSafeAreaInsets();
  const finalKeyboardHeight = useMemo(() => {
    return IS_IOS ? keyboardHeight - bottom : keyboardHeight;
  }, [bottom, keyboardHeight]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: { phrase: '' },
    validationSchema: Yup.object().shape({
      phrase: Yup.string().required('Seed phrase is required'),
    }),
    onSubmit: async values => {
      try {
        const phrase = values.phrase?.trim();
        const finalPhrase = phrase.split(/[\n\r\s]+/).join(' ');
        if (validateMnemonic(finalPhrase)) {
          navigation.navigate('CreateWallet', { phrase: finalPhrase });
        } else {
          formik.setFieldError('phrase', 'Invalid seed phrase');
        }
      } catch (err) {
        if (err.stack) {
          console.error(`in importWallet: ${JSON.stringify(err)}`);
          formik.setErrors({ phrase: '* Wrong seed' });
        }
      }
    },
  });

  const onPressImportByPrivateKey = useCallback(() => {
    navigation.navigate('ImportWalletByPrivateKey');
  }, [navigation]);

  const findMnemonicsValue = useCallback(text => {
    if (text.length >= 2) {
      setSuggestionMnemonic(fetchWordsStartingWith(englishMnemonics, text));
    } else {
      setSuggestionMnemonic([]);
    }
  }, []);

  const onPressMnemonicWord = useCallback(
    word => {
      const phrase = formik.values.phrase;
      const wordsArray = phrase.split(/\s+/);
      wordsArray.pop();
      wordsArray.push(word);
      const finalText = wordsArray.join(' ') + ' ';
      formik.setFieldValue('phrase', finalText);
      setSuggestionMnemonic([]);
    },
    [formik],
  );

  return (
    <DokSafeAreaView style={styles.safeAreaView}>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <ScrollView
          bounces={false}
          style={styles.container}
          contentContainerStyle={styles.contentContainer}>
          <View style={styles.formInput}>
            <Text style={styles.title}>Import</Text>
            <Text style={styles.title}>your Wallet</Text>
            <Text style={styles.listTitle}>
              {
                'Enter your 12, 18 or 24-word seed phrase below to restore your crypto wallet.'
              }
            </Text>

            <TextInput
              style={styles.input}
              multiline={true}
              textColor={theme.font}
              numberOfLines={7}
              maxHeight={150}
              autoComplete={'off'}
              autoCorrect={false}
              {...(IS_ANDROID ? { keyboardType: 'visible-password' } : {})}
              spellCheck={false}
              label="Enter seed phrase"
              theme={{
                colors: {
                  onSurfaceVariant: formik.errors.phrase ? 'red' : theme.gray,
                },
              }}
              outlineColor={formik.errors.phrase ? 'red' : theme.gray}
              activeOutlineColor={formik.errors.phrase ? 'red' : theme.font}
              autoCapitalize="none"
              returnKeyType="next"
              mode="outlined"
              blurOnSubmit={false}
              name="phrase"
              autoFocus={true}
              onChangeText={text => {
                const lowerCaseStr = text.toLowerCase();
                formik.setFieldValue('phrase', lowerCaseStr);
                const lastWord = lowerCaseStr.split(' ').pop();
                findMnemonicsValue(lastWord);
              }}
              onBlur={formik.handleBlur('phrase')}
              value={formik.values.phrase}
              onSubmitEditing={formik.handleSubmit}
            />
            {formik.errors.phrase && formik.touched.phrase && (
              <Text style={styles.textConfirm}>{formik.errors.phrase}</Text>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={formik.handleSubmit}>
              <Text style={styles.buttonTitle}>Import</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={onPressImportByPrivateKey}>
              <Text style={styles.buttonTitle}>Import by private key</Text>
            </TouchableOpacity>

            <Text style={styles.info}>
              Your Private Key will be encrypted and stored on this device.
            </Text>
          </View>
          {!!suggestionMnemonic?.length && (
            <ScrollView
              style={[styles.keyboardOverView, { bottom: finalKeyboardHeight }]}
              contentContainerStyle={{
                alignItems: 'center',
                flexGrow: 1,
                paddingHorizontal: 20,
              }}
              horizontal={true}
              keyboardShouldPersistTaps={'always'}
              bounces={false}
              showsHorizontalScrollIndicator={false}>
              {suggestionMnemonic.map(item => (
                <TouchableOpacity
                  key={item + ''}
                  style={styles.itemView}
                  onPress={() => onPressMnemonicWord(item)}>
                  <Text style={styles.wordText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </DokSafeAreaView>
  );
};

export default ImportWallet;
