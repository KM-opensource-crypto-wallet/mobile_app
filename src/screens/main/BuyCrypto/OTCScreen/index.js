import React, {useCallback, useContext, useRef} from 'react';
import {TouchableOpacity, View, Text, Keyboard} from 'react-native';
import {TextInput} from 'react-native-paper';
import {Formik} from 'formik';
import {validationSchemaOTC} from 'utils/validationSchema';
import myStyles from './OTCScreenStyles';
import {ThemeContext} from 'theme/ThemeContext';
import DokCountryPicker from 'components/DokCountryPicker';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {IS_ANDROID} from 'utils/dimensions';

export const OTCScreen = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const emailInputRef = useRef(null);
  const address1InputRef = useRef(null);
  const address2InputRef = useRef(null);
  const cityInputRef = useRef(null);
  const zipcodeInputRef = useRef(null);

  const onSubmit = useCallback(
    values => {
      Keyboard.dismiss();
      navigation.navigate('OTC2', {data: values});
    },
    [navigation],
  );

  return (
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      {...(IS_ANDROID ? {extraScrollHeight: 30} : {})}
      enableResetScrollToCoords={false}
      keyboardOpeningTime={Number.MAX_SAFE_INTEGER}
      style={styles.container}
      contentContainerStyle={styles.contentContainerStyle}>
      <Formik
        initialValues={{
          fullname: '',
          email: '',
          address1: '',
          address2: '',
          city: '',
          zipcode: '',
          country: '',
        }}
        validationSchema={validationSchemaOTC}
        onSubmit={onSubmit}>
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
          setFieldValue,
        }) => (
          <View>
            <View style={styles.formInput}>
              <Text
                style={{
                  ...styles.title,
                }}>
                {'Personal information'}
              </Text>

              <View>
                <TextInput
                  style={styles.input}
                  label="Full Name"
                  textColor={theme.font}
                  placeholder={'Enter full name'}
                  theme={{
                    colors: {
                      onSurfaceVariant: '#989898',
                      primary: errors.fullname ? 'red' : '#989898',
                    },
                  }}
                  outlineColor={
                    touched.fullname && errors.fullname ? 'red' : '#989898'
                  }
                  activeOutlineColor={
                    touched.fullname && errors.fullname
                      ? 'red'
                      : theme.borderActiveColor
                  }
                  autoCapitalize="none"
                  returnKeyType="next"
                  mode="outlined"
                  blurOnSubmit={false}
                  name="fullname"
                  autoFocus={true}
                  onChangeText={handleChange('fullname')}
                  onBlur={handleBlur('fullname')}
                  value={values.fullname}
                  onSubmitEditing={() => {
                    emailInputRef?.current?.focus();
                  }}
                />
                {errors.fullname && touched.fullname && (
                  <Text style={styles.textConfirm}>{errors.fullname}</Text>
                )}
                <TextInput
                  ref={emailInputRef}
                  style={styles.input}
                  textColor={theme.font}
                  label="Email address"
                  placeholder="Enter email address"
                  keyboardType={'email-address'}
                  theme={{
                    colors: {
                      onSurfaceVariant: '#989898',
                      primary: errors.email ? 'red' : '#989898',
                    },
                  }}
                  outlineColor={
                    touched.email && errors.email ? 'red' : '#989898'
                  }
                  activeOutlineColor={
                    touched.email && errors.email
                      ? 'red'
                      : theme.borderActiveColor
                  }
                  autoCapitalize="none"
                  returnKeyType="next"
                  mode="outlined"
                  blurOnSubmit={false}
                  name="email"
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  value={values.email}
                  onSubmitEditing={() => {
                    address1InputRef?.current?.focus();
                  }}
                />
                {errors.email && touched.email && (
                  <Text style={styles.textConfirm}>{errors.email}</Text>
                )}
                <Text
                  style={{
                    ...styles.title,
                  }}>
                  {'Residential address'}
                </Text>
                <TextInput
                  ref={address1InputRef}
                  style={styles.input}
                  textColor={theme.font}
                  label="Address 1"
                  placeholder="Enter Address 1"
                  theme={{
                    colors: {
                      onSurfaceVariant: '#989898',
                      primary: errors.address1 ? 'red' : '#989898',
                    },
                  }}
                  outlineColor={
                    touched.address1 && errors.address1 ? 'red' : '#989898'
                  }
                  activeOutlineColor={
                    touched.address1 && errors.address1
                      ? 'red'
                      : theme.borderActiveColor
                  }
                  autoCapitalize="none"
                  returnKeyType="next"
                  mode="outlined"
                  blurOnSubmit={false}
                  name="address1"
                  onChangeText={handleChange('address1')}
                  onBlur={handleBlur('address1')}
                  value={values.address1}
                  onSubmitEditing={() => {
                    address2InputRef?.current?.focus();
                  }}
                />
                {errors.address1 && touched.address1 && (
                  <Text style={styles.textConfirm}>{errors.address1}</Text>
                )}
                <TextInput
                  ref={address2InputRef}
                  style={styles.input}
                  textColor={theme.font}
                  label="Address 2"
                  placeholder="Enter Address 2"
                  theme={{
                    colors: {
                      onSurfaceVariant: '#989898',
                      primary: errors.address1 ? 'red' : '#989898',
                    },
                  }}
                  outlineColor={
                    touched.address2 && errors.address2 ? 'red' : '#989898'
                  }
                  activeOutlineColor={
                    touched.address2 && errors.address2
                      ? 'red'
                      : theme.borderActiveColor
                  }
                  autoCapitalize="none"
                  returnKeyType="next"
                  mode="outlined"
                  blurOnSubmit={false}
                  name="address2"
                  onChangeText={handleChange('address2')}
                  onBlur={handleBlur('address2')}
                  value={values.address2}
                  onSubmitEditing={() => {
                    cityInputRef?.current?.focus();
                  }}
                />
                {errors.address2 && touched.address2 && (
                  <Text style={styles.textConfirm}>{errors.address2}</Text>
                )}
                <View style={styles.rowView}>
                  <View style={styles.inputContainer}>
                    <TextInput
                      ref={cityInputRef}
                      style={styles.input}
                      textColor={theme.font}
                      label="City/State"
                      placeholder="Enter City/State"
                      theme={{
                        colors: {
                          onSurfaceVariant: '#989898',
                          primary: errors.city ? 'red' : '#989898',
                        },
                      }}
                      outlineColor={
                        touched.city && errors.city ? 'red' : '#989898'
                      }
                      activeOutlineColor={
                        touched.city && errors.city
                          ? 'red'
                          : theme.borderActiveColor
                      }
                      autoCapitalize="none"
                      returnKeyType="next"
                      mode="outlined"
                      blurOnSubmit={false}
                      name="city"
                      onChangeText={handleChange('city')}
                      onBlur={handleBlur('city')}
                      value={values.city}
                      onSubmitEditing={() => {
                        zipcodeInputRef?.current?.focus();
                      }}
                    />
                    {errors.city && touched.city && (
                      <Text style={styles.textConfirm}>{errors.city}</Text>
                    )}
                  </View>
                  <View style={styles.inputContainer}>
                    <TextInput
                      ref={zipcodeInputRef}
                      style={styles.input}
                      textColor={theme.font}
                      label="Post Code"
                      placeholder="Enter post code"
                      theme={{
                        colors: {
                          onSurfaceVariant: '#989898',
                          primary: errors.zipcode ? 'red' : '#989898',
                        },
                      }}
                      outlineColor={
                        touched.zipcode && errors.zipcode ? 'red' : '#989898'
                      }
                      activeOutlineColor={
                        touched.zipcode && errors.zipcode
                          ? 'red'
                          : theme.borderActiveColor
                      }
                      autoCapitalize="none"
                      returnKeyType="done"
                      mode="outlined"
                      blurOnSubmit={false}
                      name="zipcode"
                      onChangeText={handleChange('zipcode')}
                      onBlur={handleBlur('zipcode')}
                      value={values.zipcode}
                      onSubmitEditing={() => {
                        Keyboard.dismiss();
                      }}
                    />
                    {errors.zipcode && touched.zipcode && (
                      <Text style={styles.textConfirm}>{errors.zipcode}</Text>
                    )}
                  </View>
                </View>
                <DokCountryPicker
                  isVisible={false}
                  onSelect={countryDetails => {
                    setFieldValue('country', countryDetails?.cca2);

                    // setFieldTouched('country', true);
                  }}
                  countryCode={values.country}
                />
                {errors.country && (
                  <Text style={styles.textConfirm}>{errors.country}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonTitle}>{'Next'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </KeyboardAwareScrollView>
  );
};
