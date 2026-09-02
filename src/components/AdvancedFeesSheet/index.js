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
  useWindowDimensions,
} from 'react-native';
import {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DokBottomSheet from 'components/BottomSheet';
import {ThemeContext} from 'theme/ThemeContext';
import {isEVMChain, weiToGwei} from 'dok-wallet-blockchain-networks/helper';

const FeeInput = ({
  styles,
  theme,
  label,
  value,
  onChangeText,
  placeholder,
  error = false,
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <BottomSheetTextInput
      style={[
        styles.textInput,
        {
          color: theme.font,
          borderColor: error ? theme.error : theme.headerBorder,
        },
      ]}
      placeholder={placeholder}
      placeholderTextColor={theme.gray}
      keyboardType="numeric"
      autoCapitalize="none"
      onChangeText={onChangeText}
      value={value}
    />
  </View>
);

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
      // EIP-1559 extras. All optional: legacy chains and the Permit/Allowance
      // sheets omit them and get the single "Gas Price" input as before.
      isEip1559 = false,
      customPriorityFee,
      onChangeCustomPriorityFee,
      baseFeePerGas,
      customFeesError = null,
    },
    ref,
  ) => {
    const {theme} = useContext(ThemeContext);
    const {height: windowHeight} = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const styles = myStyles(theme, insets.bottom);
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
    const showPriorityFee = isEip1559 && !!onChangeCustomPriorityFee;
    const baseFeeGwei = isEip1559 ? weiToGwei(baseFeePerGas) : null;
    const gasLabel = isEip1559 ? 'Max Fee' : 'Gas Price';
    const isSelected = type =>
      selectedFeesType?.toLowerCase() === type.toLowerCase();

    return (
      <DokBottomSheet
        bottomSheetRef={sheetRef => (bottomSheetRef.current = sheetRef)}
        enableDynamicSizing={true}
        maxDynamicContentSize={Math.round(windowHeight * 0.85)}
        zIndex={zIndex}
        stackBehavior={stackBehavior}
        onDismiss={handleClose}>
        <BottomSheetScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="tune-vertical"
              size={24}
              color={theme.background}
            />
            <Text style={styles.title}>Advanced Options</Text>
          </View>
          {/* Gas Price / Max Fee Section */}
          {!!feesOptions?.length && (
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <MaterialCommunityIcons
                  name="gas-station"
                  size={18}
                  color={theme.background}
                />
                <Text style={styles.label}>{gasLabel}</Text>
              </View>
              <View style={styles.feesContainer}>
                {feesOptions?.map(option => {
                  // The lowercased title is the feesType key the polling
                  // estimate is re-run with ('recommended' / 'normal').
                  const type = option?.title?.toLowerCase();
                  if (!type) {
                    return null;
                  }
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => onSelectFeesType(type, option.gasPrice)}
                      style={[
                        styles.feesItem,
                        isSelected(option.title) && styles.feesItemSelected,
                      ]}>
                      <Text numberOfLines={1} style={styles.feesTitle}>
                        {option.title}
                      </Text>
                      <Text style={styles.feesDescription}>
                        {`${option.gasPrice} ${gasCurrency}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={[
                    styles.feesItem,
                    isSelected('custom') && styles.feesItemSelected,
                  ]}
                  onPress={() => onSelectFeesType('custom')}>
                  <Text style={styles.feesTitle}>Custom</Text>
                </TouchableOpacity>
              </View>
              {baseFeeGwei != null && (
                <Text style={styles.hint}>
                  {`Current base fee: ${baseFeeGwei} ${gasCurrency}. You pay base fee + priority fee, capped at the max fee.`}
                </Text>
              )}
              {selectedFeesType === 'custom' && (
                <>
                  <FeeInput
                    styles={styles}
                    theme={theme}
                    label={`Custom ${gasLabel} (${gasCurrency})`}
                    placeholder={`Enter ${gasLabel.toLowerCase()}`}
                    onChangeText={onChangeCustomFees}
                    value={customFees}
                  />
                  {showPriorityFee && (
                    <>
                      <FeeInput
                        styles={styles}
                        theme={theme}
                        label={`Priority Fee (${gasCurrency})`}
                        placeholder="Enter priority fee"
                        onChangeText={onChangeCustomPriorityFee}
                        value={customPriorityFee}
                        error={!!customFeesError}
                      />
                      {customFeesError ? (
                        <Text style={styles.errorText}>{customFeesError}</Text>
                      ) : (
                        <Text style={styles.hint}>
                          Tip paid to validators. Must not exceed the max fee.
                        </Text>
                      )}
                    </>
                  )}
                </>
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
              <FeeInput
                styles={styles}
                theme={theme}
                label="Nonce"
                placeholder="Enter nonce value"
                onChangeText={onChangeCustomNonce}
                value={customNonce}
              />
              <Text style={styles.hint}>
                Used for transaction ordering. Only modify if you know what
                you're doing.
              </Text>
            </View>
          )}
          {/* Done Button */}
          <TouchableOpacity
            style={[styles.button, !!customFeesError && styles.buttonDisabled]}
            disabled={!!customFeesError}
            onPress={handleClose}>
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </BottomSheetScrollView>
      </DokBottomSheet>
    );
  },
);

const myStyles = (theme, bottomInset = 0) =>
  StyleSheet.create({
    content: {
      padding: 20,
      paddingBottom: 20 + bottomInset,
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
    errorText: {
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      color: theme.error,
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
    buttonDisabled: {
      backgroundColor: '#708090',
    },
    buttonText: {
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      color: theme.title,
      fontWeight: '600',
    },
  });

export default AdvancedFeesSheet;
