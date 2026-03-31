import React, {memo, useContext} from 'react';
import {View, Text, TouchableOpacity, ActivityIndicator} from 'react-native';
import {TextInput, Switch} from 'react-native-paper';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {ThemeContext} from 'theme/ThemeContext';
import CoinIcon from 'components/CoinIcon/CoinIcon';
import ChainItem from 'components/ChainItem';
import {isBitcoinChain} from 'dok-wallet-blockchain-networks/helper';
import {IS_ANDROID} from 'utils/dimensions';
import myStyles from './NotificationConfigStepStyles';
import {
  coinKey,
  truncateAddress,
  isAmountBelowThreshold,
  MAX_ALERTS,
} from 'utils/notificationAlertHelpers';

const NotificationConfigStep = ({
  selectedCoinEntries,
  configCoinKey,
  addressMap,
  currentMinAmount,
  onMinAmountChange,
  amountError,
  notifyOnReceive,
  onReceiveChange,
  notifyOnSend,
  onSendChange,
  toggleError,
  alertsCount,
  isEditMode,
  isSaving,
  onSubmit,
  onOpenCoinPicker,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const currentEntry =
    selectedCoinEntries.find(
      e => coinKey(e.walletClientId, e.coin._id) === configCoinKey,
    ) ?? selectedCoinEntries[0];

  const isLimitReached = !isEditMode && alertsCount >= MAX_ALERTS;

  return (
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      bounces={false}
      keyboardShouldPersistTaps={'always'}
      {...(IS_ANDROID ? {extraScrollHeight: 30} : {})}
      keyboardOpeningTime={Number.MAX_SAFE_INTEGER}
      contentContainerStyle={styles.contentContainerStyle}>
      <View style={styles.formContainer}>
        {/* Multi-coin tab strip */}
        {selectedCoinEntries.length > 1 && (
          <View style={styles.coinIconRow}>
            {selectedCoinEntries.map(entry => {
              const key = coinKey(entry.walletClientId, entry.coin._id);
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.coinIconButton,
                    key === configCoinKey && styles.coinIconButtonActive,
                  ]}
                  onPress={onOpenCoinPicker}>
                  <CoinIcon item={entry.coin} hideMargin />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Summary card */}
        {currentEntry && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <CoinIcon item={currentEntry.coin} />
              <View style={styles.flexOne}>
                <View style={styles.coinSymbolRow}>
                  <Text style={styles.coinSymbol}>
                    {currentEntry.coin.symbol}
                  </Text>
                  {(currentEntry.coin.type === 'token' ||
                    isBitcoinChain(currentEntry.coin.chain_name)) && (
                    <ChainItem
                      chain_display_name={currentEntry.coin.chain_display_name}
                    />
                  )}
                </View>
                <Text style={styles.coinName}>{currentEntry.walletName}</Text>
              </View>
            </View>
            {configCoinKey && addressMap[configCoinKey] && (
              <View style={styles.summaryRowTop}>
                <Text style={styles.summaryLabel}>Address</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {truncateAddress(addressMap[configCoinKey])}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Min amount */}
        <TextInput
          style={styles.input}
          textColor={theme.font}
          label="Minimum Amount"
          placeholder="Enter minimum amount"
          keyboardType="decimal-pad"
          theme={{
            colors: {onSurfaceVariant: amountError ? 'red' : theme.gray},
          }}
          outlineColor={amountError ? 'red' : theme.gray}
          activeOutlineColor={amountError ? 'red' : theme.font}
          returnKeyType="done"
          mode="outlined"
          value={currentMinAmount}
          onChangeText={onMinAmountChange}
          right={
            <TextInput.Affix
              text={currentEntry?.coin?.symbol || ''}
              textStyle={styles.affixText}
            />
          }
        />
        {!!amountError && <Text style={styles.textConfirm}>{amountError}</Text>}
        {currentEntry &&
          isAmountBelowThreshold(currentMinAmount, currentEntry.coin) && (
            <Text style={styles.warningText}>
              Amount is below $10 equivalent — you may receive very few alerts
            </Text>
          )}

        {/* Toggles */}
        <View style={styles.toggleRow}>
          <View style={styles.flexOne}>
            <Text style={styles.toggleLabel}>Notify on Receive</Text>
            <Text style={styles.toggleDesc}>
              Get notified when funds are received
            </Text>
          </View>
          <Switch
            value={notifyOnReceive}
            onValueChange={onReceiveChange}
            trackColor={{false: 'gray', true: theme.background}}
            thumbColor={'white'}
            ios_backgroundColor="#E8E8E8"
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.flexOne}>
            <Text style={styles.toggleLabel}>Notify on Send</Text>
            <Text style={styles.toggleDesc}>
              Get notified when funds are sent
            </Text>
          </View>
          <Switch
            value={notifyOnSend}
            onValueChange={onSendChange}
            trackColor={{false: 'gray', true: theme.background}}
            thumbColor={'white'}
            ios_backgroundColor="#E8E8E8"
          />
        </View>
        {!!toggleError && (
          <Text style={[styles.textConfirm, styles.toggleErrorText]}>
            {toggleError}
          </Text>
        )}

        {isLimitReached && (
          <Text style={styles.textConfirm}>
            You have reached the maximum of {MAX_ALERTS} alerts.
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            (isSaving || isLimitReached) && styles.buttonDisabled,
          ]}
          disabled={isSaving || isLimitReached}
          onPress={onSubmit}>
          {isSaving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.buttonTitle}>
              {isEditMode ? 'Update Alert' : 'Save Alert'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default memo(NotificationConfigStep);
