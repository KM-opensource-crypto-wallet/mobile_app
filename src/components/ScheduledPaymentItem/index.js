import React, {memo, useCallback, useContext} from 'react';
import {Text, View} from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import IoniconIcon from 'react-native-vector-icons/Ionicons';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu';
import {ThemeContext} from 'theme/ThemeContext';
import ChainItem from 'components/ChainItem';
import SwapCoinIcon from 'components/ExchangeHistory/SwapCoinIcon';
import {getChainDisplayName} from 'components/ExchangeHistory/exchangeFormat';
import {
  getCustomizePublicAddress,
  multiplyBNWithFixed,
} from 'dok-wallet-blockchain-networks/helper';
import {currencySymbol} from 'data/currency';
import {describeRecurrence, getNextOccurrence} from 'utils/scheduleRecurrence';
import myStyles from './ScheduledPaymentItemStyles';

dayjs.extend(relativeTime);

// One scheduled-payment card. A payment stores only chain + asset, so the
// resolved wallet `coin` (may be undefined if it was removed from the
// wallet) supplies icon, chain display name and fiat rate; everything else
// falls back to what the payment itself carries.
const ScheduledPaymentItem = ({
  item,
  coin,
  localCurrency,
  onEdit,
  onRemove,
  onSendNow,
  reminderSlots = 0,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const handleEdit = useCallback(() => onEdit?.(item), [item, onEdit]);
  const handleRemove = useCallback(() => onRemove?.(item), [item, onRemove]);
  const handleSendNow = useCallback(() => onSendNow?.(item), [item, onSendNow]);

  const symbol = item?.asset?.symbol || '';
  const chainDisplayName =
    coin?.chain_display_name || getChainDisplayName(item?.chain);
  const fiatAmount =
    coin?.currencyRate && Number(coin.currencyRate) > 0
      ? multiplyBNWithFixed(item?.amount, coin.currencyRate, 2)
      : null;
  const next = getNextOccurrence(item);
  const nextDate = next ? dayjs(next.timestamp) : null;
  const recurrenceLabel = describeRecurrence(item?.recurrence);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <SwapCoinIcon
          icon={coin?.icon}
          symbol={symbol}
          chainName={item?.chain}
          size={40}
        />
        <View style={styles.amountBox}>
          <Text style={styles.amountText} numberOfLines={1}>
            {`${item?.amount ?? ''} ${symbol}`}
          </Text>
          <View style={styles.subRow}>
            {!!chainDisplayName && (
              <ChainItem chain_display_name={chainDisplayName} />
            )}
            {!!fiatAmount && (
              <Text style={styles.fiatText} numberOfLines={1}>
                {`≈ ${currencySymbol[localCurrency] || ''}${fiatAmount}`}
              </Text>
            )}
          </View>
        </View>
        <Menu optionsContainerStyle={styles.optionsContainer}>
          <MenuTrigger>
            <View style={styles.menuTrigger}>
              <EntypoIcon
                size={20}
                name={'dots-three-vertical'}
                color={theme.font}
              />
            </View>
          </MenuTrigger>
          <MenuOptions optionsContainerStyle={styles.optionsContainer}>
            <MenuOption onSelect={handleSendNow}>
              <View style={styles.optionMenu}>
                <IoniconIcon
                  size={18}
                  name={'send-outline'}
                  color={theme.borderActiveColor}
                />
                <Text style={styles.optionText}>{'Send now'}</Text>
              </View>
            </MenuOption>
            <MenuOption onSelect={handleEdit}>
              <View style={styles.optionMenu}>
                <EntypoIcon
                  size={18}
                  name={'edit'}
                  color={theme.borderActiveColor}
                />
                <Text style={styles.optionText}>{'Edit'}</Text>
              </View>
            </MenuOption>
            <MenuOption onSelect={handleRemove}>
              <View style={styles.optionMenuLast}>
                <IoniconIcon size={18} name={'trash'} color={'red'} />
                <Text style={[styles.optionText, styles.deleteOptionText]}>
                  {'Delete'}
                </Text>
              </View>
            </MenuOption>
          </MenuOptions>
        </Menu>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailRow}>
        <IoniconIcon
          name="arrow-forward-outline"
          size={14}
          color={theme.gray}
        />
        <Text style={styles.detailText} numberOfLines={1}>
          {`To ${getCustomizePublicAddress(item?.recipientAddress)}`}
        </Text>
      </View>

      {!!item?.memo && (
        <View style={styles.detailRow}>
          <IoniconIcon
            name="document-text-outline"
            size={14}
            color={theme.gray}
          />
          <Text style={styles.detailText} numberOfLines={1}>
            {item.memo}
          </Text>
        </View>
      )}

      {!!nextDate && (
        <View style={styles.detailRow}>
          <IoniconIcon name="calendar-outline" size={14} color={theme.gray} />
          <Text style={styles.detailText} numberOfLines={1}>
            {`${nextDate.format(
              'MMM D, YYYY · h:mm A',
            )}  ·  ${nextDate.fromNow()}`}
          </Text>
        </View>
      )}

      <View style={styles.chipsRow}>
        {!!recurrenceLabel && (
          <View style={styles.chip}>
            <IoniconIcon
              name="repeat-outline"
              size={12}
              color={theme.background}
            />
            <Text style={styles.chipText} numberOfLines={1}>
              {next
                ? `${recurrenceLabel} · ${next.index + 1} of ${next.total}`
                : recurrenceLabel}
            </Text>
          </View>
        )}
        {/* Pending-notification slots this payment occupies on the device;
            the create-time limit alert quotes the same numbers. */}
        <View style={styles.chip}>
          <IoniconIcon
            name="notifications-outline"
            size={12}
            color={theme.background}
          />
          <Text style={styles.chipText} numberOfLines={1}>
            {`${reminderSlots} reminder slot${reminderSlots === 1 ? '' : 's'}`}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default memo(ScheduledPaymentItem);
