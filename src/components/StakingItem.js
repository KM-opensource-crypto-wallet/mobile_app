import React, {useContext} from 'react';
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

const StakingItem = ({item, isWithdraw, estimateEpochTimestamp}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const navigation = useNavigation();
  const currentCoin = useSelector(selectCurrentCoin);
  const localCurrency = useSelector(getLocalCurrency);

  return (
    <TouchableOpacity
      disabled={!isWithdraw}
      onPress={() => {
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
        }
      }}>
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
              <Text
                style={
                  styles.balanceStyle
                }>{`${item?.amount} ${currentCoin?.symbol}`}</Text>
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
      // flexDirection: 'row',
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
    remaningTime: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      fontWeight: '500',
      marginTop: 4,
    },
  });

export default StakingItem;
