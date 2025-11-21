import React, {useState, useEffect, useContext, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import {TextInput} from 'react-native-paper';
import {CheckBox} from '@rneui/themed';
import {Formik} from 'formik';
import crypto from 'react-native-quick-crypto';

import Castle from 'assets/images/verify/сastle.svg';
import Cross from 'assets/images/verify/cross.svg';
import Check from 'assets/images/verify/check.svg';
import {IS_ANDROID, useFloatingHeight} from 'utils/dimensions';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './VerifyStyles';
import {useFloatingWidth} from 'hooks/useFloatingWidth';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {useKeyboardHeight} from 'hooks/useKeyboardHeight';
import {SCREEN_HEIGHT} from '@gorhom/bottom-sheet';
import {useDispatch} from 'react-redux';
import {setIsAskedBackupModal} from 'dok-wallet-blockchain-networks/redux/currency/currencySlice';
import {setBackedUp} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';

export const Verify = ({route, navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const {random} = route.params;
  const [list, setList] = useState([]);
  const [checked, setChecked] = useState(false);
  const [textInputEnabled, setTextInputEnabled] = useState(true);
  const [selected, setSelected] = useState(0);
  const floatingHeight = useFloatingHeight();
  const keyboardHeight = useKeyboardHeight();
  const isIpad = useFloatingWidth();
  const formikRef = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    let randomWords = [...random].sort(() => 0.5 - crypto.randomInt(100) / 100);
    let randomNumbers = randomWords.slice(0, 3);
    let randomIds = randomNumbers.map(item => item.word);
    const tempList = random.map((value, index) => ({
      ...value,
      id: index + 1,
      random: randomIds.includes(value.word),
      audit: '',
    }));
    setList(tempList);
    const foundIndex = tempList.findIndex(item => item.random);
    setSelected(foundIndex + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = values => {
    const index = selected - 1;
    const tempItem = list[index];
    const tempList = [...list];
    if (tempItem.word === values?.word) {
      const newIndex = list.findIndex(
        item => item.random && item.word !== values.word && !item.audit,
      );
      tempItem.audit = true;
      tempList[index] = tempItem;
      setList(tempList);

      const filterItem = tempList.filter(item => item.audit);
      if (filterItem.length === 3) {
        setTextInputEnabled(false);
        Keyboard.dismiss();
        if (checked) {
          dispatch(setBackedUp());
          navigation.reset({
            index: 0,
            routes: [{name: 'Sidebar'}],
          });
        }
      } else {
        setSelected(newIndex + 1);
        formikRef?.current?.setFieldValue('word', '');
      }
    } else {
      tempItem.audit = false;
      tempList[index] = tempItem;
      setList(tempList);
    }
  };

  const selectedItem = list[selected - 1];
  return (
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      bounces={false}
      extraScrollHeight={-SCREEN_HEIGHT * 0.15}
      style={styles.container}
      contentContainerStyle={{flexGrow: 1}}>
      <View
        style={{
          ...styles.container,
          justifyContent: 'space-between',
          paddingVertical: 20,
        }}>
        <View style={styles.section}>
          <Text style={styles.title}>Your{'\n'}seed phrase</Text>
          <Text style={styles.textFirst}>
            Verify that you`ve stored seed phrase.
          </Text>
          <Text style={styles.text}>
            Enter the correct words of you seed phrase below.
          </Text>
          <View style={{...styles.wordsList, marginTop: isIpad ? 50 : 0}}>
            {list.map((item, index) => (
              <TouchableOpacity
                style={{
                  ...styles.wordsBox,
                  marginVertical: floatingHeight > 300 ? 8 : 4,
                  marginHorizontal: floatingHeight > 300 ? 4 : 2,
                }}
                key={index}
                onPress={() => setSelected(item.id)}
                disabled={
                  item.audit === false ? true : item.random === false && true
                }>
                {item.random === false ? (
                  <>
                    <Text style={styles.number}>{item.id}</Text>
                  </>
                ) : (
                  <>
                    <Text
                      style={{
                        ...styles.numberRandom,
                        borderColor:
                          item.id === selected ? 'red' : 'transparent',
                        backgroundColor:
                          item.audit === true
                            ? theme.background
                            : item.audit === false
                            ? '#CCC8C6'
                            : '#FFF7E5',
                        color:
                          item.audit === true
                            ? '#fff'
                            : item.audit === false
                            ? theme.background
                            : '#FF647C',
                      }}>
                      {item.id}
                    </Text>
                  </>
                )}
                {item.random === true && (
                  <>
                    {item.audit === '' && (
                      <Castle width={24} height={24} style={styles.icon} />
                    )}

                    {item.audit === false && <Cross style={styles.cross} />}

                    {item.audit === true && (
                      <Check style={styles.check} />
                      // color="#fff"
                    )}
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View
          style={[
            styles.formInput,
            keyboardHeight && {justifyContent: 'flex-start'},
          ]}>
          <Text style={styles.info}>
            {`Enter the ${selected}${
              selected === 1
                ? 'st'
                : selected === 2
                ? 'nd'
                : selected === 3
                ? 'rd'
                : 'th'
            } word`}
          </Text>
          <Formik
            innerRef={formikRef}
            initialValues={{word: ''}}
            onSubmit={handleSubmit}>
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              touched,
              setValues,
            }) => (
              <View>
                <TextInput
                  editable={textInputEnabled}
                  style={styles.input}
                  label="Enter word here"
                  textColor={theme.font}
                  theme={{
                    colors: {
                      onSurfaceVariant:
                        selectedItem?.audit === false ? 'red' : '#989898',
                    },
                  }}
                  autoComplete={'off'}
                  autoCorrect={false}
                  {...(IS_ANDROID ? {keyboardType: 'visible-password'} : {})}
                  spellCheck={false}
                  outlineColor={
                    selectedItem?.audit === false ? 'red' : '#989898'
                  }
                  onSubmitEditing={handleSubmit}
                  activeOutlineColor={
                    selectedItem?.audit === false
                      ? 'red'
                      : textInputEnabled
                      ? theme.borderActiveColor
                      : theme.headerBorder
                  }
                  autoCapitalize="none"
                  returnKeyType="next"
                  mode="outlined"
                  blurOnSubmit={false}
                  name="word"
                  // autoFocus={true}
                  onChangeText={handleChange('word')}
                  onBlur={handleBlur('word')}
                  value={values.word}
                />

                {selectedItem?.audit === false && (
                  <Text style={styles.textConfirm}>Invalid mnemonic word.</Text>
                )}

                <View style={styles.checkbox}>
                  <CheckBox
                    containerStyle={{
                      backgroundColor: 'transparent',
                      borderWidth: 0,
                      padding: 0,
                      marginLeft: 0,
                    }}
                    size={24}
                    checked={checked}
                    onPress={() => {
                      setChecked(!checked);
                    }}
                    iconType="material-community"
                    checkedIcon="checkbox-marked"
                    uncheckedIcon="checkbox-blank-outline"
                    checkedColor={theme.background}
                  />
                  <Text style={styles.checkText}>
                    I acknowledge that I must safely store me seed phrase as I
                    wiil not be able to access my funds
                  </Text>
                </View>

                <TouchableOpacity
                  disabled={!checked}
                  style={{
                    ...styles.btn,
                    backgroundColor: checked ? theme.background : '#708090',
                  }}
                  // onPress={() =>
                  //   verify === true
                  //     ? navigation.navigate("Create")
                  //     : handleSubmit()
                  // }
                  onPress={handleSubmit}>
                  <Text style={styles.btnTitle}>Confirm</Text>
                </TouchableOpacity>
              </View>
            )}
          </Formik>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
};
