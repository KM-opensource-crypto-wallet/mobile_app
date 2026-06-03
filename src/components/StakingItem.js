import React, {useCallback, useContext} from 'react';
import {Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {currencySymbol} from 'data/currency';
import KeyboardArrow from 'assets/images/icons/keyboard-arrow-right.svg';
import {ThemeContext} from 'theme/ThemeContext';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {selectCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import Toast from 'react-native-toast-message';

const StakingItem = ({
  item,
  showReward,
  isWithdraw,
  estimateEpochTimestamp,
  handleClaimReward,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const navigation = useNavigation();
  const currentCoin = useSelector(selectCurrentCoin);
  const localCurrency = useSelector(getLocalCurrency);

  const handleOnPress = useCallback(() => {
    if (item?.status?.toLowerCase() === 'deactivating') {
      Toast.show({
        type: 'errorToast',
        text1: 'Already deactivating',
        text2: 'Please wait until epoch end then you can withdraw.',
      });
    } else if (item?.status) {
      navigation.navigate('WithdrawStaking', {
        selectedStake: item,
        ...(item?.status === 'inactive'
          ? {isWithdrawStaking: true}
          : {isDeactivateStaking: true}),
      });
    } else {
      navigation.navigate('WithdrawStaking', {
        selectedStake: item,
        ...(item?.status === 'inactive'
          ? {isWithdrawStaking: true}
          : {isDeactivateStaking: true}),
      });
    }
  }, [item, navigation]);

  const rewardAmount = item?.reward?.amount
    ? parseFloat(item.reward.amount)
    : 0;
  const hasReward = rewardAmount > 0;
  const rewardSymbol = item?.reward?.symbol || null;
  const rewardLogo = item?.reward?.logo || null;

  return (
    <TouchableOpacity disabled={!isWithdraw} onPress={handleOnPress}>
      <View
        style={[
          styles.rowView,
          !isWithdraw && {borderWidth: 0.5, borderRadius: 4},
        ]}>
        <View style={[styles.subRowView, {marginRight: 0}]}>
          <View style={styles.subRowView}>
            <FastImage
              source={{uri: item?.validatorInfo?.image}}
              style={styles.imageStyle}
            />
            <View style={styles.flex1}>
              <Text style={styles.titleItem} numberOfLines={1}>
                {item?.validatorInfo?.name}
              </Text>
              <Text
                style={[
                  styles.statusText,
                  item?.status?.includes('ing') && {color: theme.gray},
                ]}
                numberOfLines={1}>
                {item?.status}
              </Text>
            </View>
          </View>
          <View style={styles.rightRowView}>
            <View>
              <Text style={styles.balanceStyle}>{`${
                item?.stakedAmount ?? item?.amount
              } ${currentCoin?.symbol}`}</Text>
              <Text
                style={
                  styles.fiatStyle
                }>{`${currencySymbol[localCurrency]}${item?.fiatAmount}`}</Text>
            </View>
            {isWithdraw && (
              <KeyboardArrow height="30" width="30" style={styles.arrow} />
            )}
          </View>
        </View>
        {hasReward && showReward && (
          <View style={styles.rewardCard}>
            <View style={styles.rewardAccentBar} />
            {rewardLogo ? (
              <FastImage
                source={{uri: rewardLogo}}
                style={styles.rewardTokenLogo}
              />
            ) : (
              <View style={styles.rewardTokenPlaceholder}>
                <Text style={styles.rewardTokenPlaceholderText}>
                  {rewardSymbol?.[0] ?? '?'}
                </Text>
              </View>
            )}
            <View style={styles.rewardTextGroup}>
              <Text style={styles.rewardTitle}>Rewards Earned</Text>
              <Text style={styles.rewardSymbolText}>{rewardSymbol}</Text>
            </View>
            <Text style={styles.rewardValueText}>{`+${rewardAmount.toFixed(
              6,
            )}`}</Text>
            {isWithdraw && typeof handleClaimReward === 'function' && (
              <TouchableOpacity
                onPress={() => handleClaimReward(rewardAmount, item)}
                style={styles.claimButton}>
                <Text style={styles.claimButtonText}>Claim</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {(item?.status?.toLowerCase() === 'activating' ||
          item?.status?.toLowerCase() === 'deactivating') &&
          isWithdraw &&
          estimateEpochTimestamp && (
            <Text style={styles.remaningTime}>
              {`Estimate remaining ${estimateEpochTimestamp}`}
            </Text>
          )}
      </View>
    </TouchableOpacity>
  );
};

const myStyles = theme =>
  StyleSheet.create({
    flex1: {
      flex: 1,
    },
    rowView: {
      paddingLeft: 20,
      paddingRight: 12,
      borderBottomWidth: 0.5,
      borderColor: theme.gray,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    subRowView: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 8,
    },
    rightRowView: {
      flexDirection: 'row',
    },
    imageStyle: {
      height: 40,
      width: 40,
      marginRight: 12,
      borderRadius: 40,
    },
    titleItem: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      flexShrink: 1,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    statusText: {
      color: theme.background,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      flexShrink: 1,
      fontWeight: '500',
      textTransform: 'uppercase',
      marginTop: 4,
    },
    balanceStyle: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
    },
    arrow: {
      fill: theme.gray,
    },
    fiatStyle: {
      color: theme.primary,
      fontSize: 13,
      fontFamily: 'Roboto',
      textAlign: 'right',
      marginTop: 4,
      fontWeight: '600',
    },
    rewardCard: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'stretch',
      marginTop: 10,
      paddingVertical: 10,
      paddingRight: 12,
      backgroundColor: theme.lightBackground,
      borderRadius: 10,
      overflow: 'hidden',
    },
    rewardAccentBar: {
      width: 4,
      alignSelf: 'stretch',
      backgroundColor: theme.successBottom,
      marginRight: 10,
    },
    rewardTokenLogo: {
      width: 28,
      height: 28,
      borderRadius: 14,
      marginRight: 10,
    },
    rewardTokenPlaceholder: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.successBottom,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    rewardTokenPlaceholderText: {
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
      color: '#FFFFFF',
    },
    rewardTextGroup: {
      flex: 1,
    },
    rewardTitle: {
      fontSize: 11,
      fontFamily: 'Roboto-Regular',
      fontWeight: '500',
      color: theme.gray,
    },
    rewardSymbolText: {
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
      color: theme.font,
      marginTop: 2,
    },
    rewardValueText: {
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
      color: theme.successBottom,
    },
    claimButton: {
      marginLeft: 10,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.successBottom,
      borderRadius: 8,
    },
    claimButtonText: {
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
      color: '#FFFFFF',
    },
    remaningTime: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      fontWeight: '500',
      marginTop: 4,
    },
  });

export default StakingItem;
