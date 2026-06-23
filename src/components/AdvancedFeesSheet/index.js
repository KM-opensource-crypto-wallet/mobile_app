import React, {
  useContext,
  forwardRef,
  useImperativeHandle,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {BottomSheetView, BottomSheetTextInput} from '@gorhom/bottom-sheet';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DokBottomSheet from 'components/BottomSheet';
import {ThemeContext} from 'theme/ThemeContext';
import {isEVMChain} from 'dok-wallet-blockchain-networks/helper';

const AdvancedFeesSheet = forwardRef(
  (
    {
      feesOptions,
      selectedFeesType,
      customFees,
      customNonce,
      gasCurrency,
      onSelectFeesType,
      onChangeCustomFees,
      onChangeCustomNonce,
      chainName,
      zIndex,
      stackBehavior,
    },
    ref,
  ) => {
    const {theme} = useContext(ThemeContext);
    const styles = myStyles(theme);
    const bottomSheetRef = useRef(null);

    useImperativeHandle(ref, () => ({
      present: () => bottomSheetRef.current?.present(),
      close: () => bottomSheetRef.current?.close(),
    }));

    const handleClose = () => {
      bottomSheetRef.current?.close();
    };
    const isEVM = useMemo(() => {
      return isEVMChain(chainName);
    }, [chainName]);

    return (
      <DokBottomSheet
        bottomSheetRef={sheetRef => (bottomSheetRef.current = sheetRef)}
        enableDynamicSizing={true}
        maxDynamicContentSize={600}
        zIndex={zIndex}
        stackBehavior={stackBehavior}
        onDismiss={handleClose}>
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
          }}>
          <BottomSheetView style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <MaterialCommunityIcons
                name="tune-vertical"
                size={24}
                color={theme.background}
              />
              <Text style={styles.title}>Advanced Options</Text>
            </View>
            {/* Gas Price Section */}
            {!!feesOptions?.length && (
              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons
                    name="gas-station"
                    size={18}
                    color={theme.background}
                  />
                  <Text style={styles.label}>Gas Price</Text>
                </View>
                <View style={styles.feesContainer}>
                  <TouchableOpacity
                    onPress={() =>
                      onSelectFeesType(
                        'recommended',
                        feesOptions?.[0]?.gasPrice,
                      )
                    }
                    style={[
                      styles.feesItem,
                      selectedFeesType?.toLowerCase() ===
                        feesOptions?.[0]?.title?.toLowerCase() &&
                        styles.feesItemSelected,
                    ]}>
                    <Text numberOfLines={1} style={styles.feesTitle}>
                      {feesOptions?.[0]?.title}
                    </Text>
                    <Text style={styles.feesDescription}>
                      {`${feesOptions?.[0]?.gasPrice} ${gasCurrency}`}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.feesItem,
                      selectedFeesType?.toLowerCase() ===
                        feesOptions?.[1]?.title?.toLowerCase() &&
                        styles.feesItemSelected,
                    ]}
                    onPress={() =>
                      onSelectFeesType('normal', feesOptions?.[1]?.gasPrice)
                    }>
                    <Text numberOfLines={1} style={styles.feesTitle}>
                      {feesOptions?.[1]?.title}
                    </Text>
                    <Text style={styles.feesDescription}>
                      {`${feesOptions?.[1]?.gasPrice} ${gasCurrency}`}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.feesItem,
                      selectedFeesType?.toLowerCase() === 'custom' &&
                        styles.feesItemSelected,
                    ]}
                    onPress={() => onSelectFeesType('custom')}>
                    <Text style={styles.feesTitle}>Custom</Text>
                  </TouchableOpacity>
                </View>
                {selectedFeesType === 'custom' && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Custom Gas Price</Text>
                    <BottomSheetTextInput
                      style={[
                        styles.textInput,
                        {color: theme.font, borderColor: theme.headerBorder},
                      ]}
                      placeholder="Enter Gas price"
                      placeholderTextColor={theme.gray}
                      keyboardType="numeric"
                      autoCapitalize="none"
                      onChangeText={onChangeCustomFees}
                      value={customFees}
                    />
                  </View>
                )}
              </View>
            )}
            {/* Nonce Section */}
            {isEVM && (
              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons
                    name="counter"
                    size={18}
                    color={theme.background}
                  />
                  <Text style={styles.label}>Transaction Nonce</Text>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Nonce</Text>
                  <BottomSheetTextInput
                    style={[
                      styles.textInput,
                      {color: theme.font, borderColor: theme.headerBorder},
                    ]}
                    placeholder="Enter nonce value"
                    placeholderTextColor={theme.gray}
                    keyboardType="numeric"
                    autoCapitalize="none"
                    onChangeText={onChangeCustomNonce}
                    value={customNonce}
                  />
                </View>
                <Text style={styles.hint}>
                  Used for transaction ordering. Only modify if you know what
                  you're doing.
                </Text>
              </View>
            )}
            {/* Done Button */}
            <TouchableOpacity style={styles.button} onPress={handleClose}>
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </BottomSheetView>
        </TouchableWithoutFeedback>
      </DokBottomSheet>
    );
  },
);

const myStyles = theme =>
  StyleSheet.create({
    content: {
      padding: 20,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.headerBorder,
    },
    title: {
      fontSize: 18,
      fontFamily: 'Roboto-Regular',
      color: theme.font,
      fontWeight: '600',
    },
    section: {
      marginBottom: 24,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 14,
    },
    label: {
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      color: theme.font,
      fontWeight: '600',
    },
    feesContainer: {
      flexDirection: 'row',
      gap: 10,
    },
    feesItem: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 8,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: theme.headerBorder,
      borderRadius: 10,
      backgroundColor: 'transparent',
    },
    feesItemSelected: {
      borderColor: theme.background,
      borderWidth: 2,
      backgroundColor: theme.background + '15',
    },
    feesTitle: {
      fontFamily: 'Roboto-Regular',
      fontSize: 12,
      color: theme.font,
      textAlign: 'center',
      fontWeight: '600',
    },
    feesDescription: {
      color: theme.gray,
      fontSize: 11,
      fontFamily: 'Roboto-Regular',
      textAlign: 'center',
      marginTop: 6,
    },
    inputContainer: {
      marginTop: 12,
    },
    inputLabel: {
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      color: theme.gray,
      marginBottom: 8,
    },
    textInput: {
      height: 50,
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 16,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      backgroundColor: 'transparent',
    },
    hint: {
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      color: theme.gray,
      marginTop: 10,
      lineHeight: 18,
    },
    button: {
      height: 50,
      borderRadius: 12,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      marginBottom: 16,
    },
    buttonText: {
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      color: theme.title,
      fontWeight: '600',
    },
  });

export default AdvancedFeesSheet;
