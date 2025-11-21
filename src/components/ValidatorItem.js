import React, {memo, useCallback, useContext} from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import {SCREEN_WIDTH} from 'utils/dimensions';
import AddIcon from 'assets/images/icons/add-icon.svg';
import MinusIcon from 'assets/images/icons/minus-icon.svg';
import {validateNumber} from '../../dok-wallet-blockchain-networks/helper';

const ValidatorItem = ({
  item,
  selectedVotes,
  onPressAdd,
  onPressMinus,
  onChangeText,
  hideInput,
  containerStyle,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const closeKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);
  const onLocalPressAdd = useCallback(() => {
    onPressAdd(item?.validatorAddress);
  }, [item?.validatorAddress, onPressAdd]);

  const onLocalPressMinus = useCallback(() => {
    onPressMinus(item?.validatorAddress);
  }, [item?.validatorAddress, onPressMinus]);

  const onLocalChangeText = useCallback(
    value => {
      onChangeText(item?.validatorAddress, value);
    },
    [item?.validatorAddress, onChangeText],
  );

  const isHaveVote = validateNumber(selectedVotes?.[item?.validatorAddress]);
  return (
    <TouchableWithoutFeedback onPress={closeKeyboard}>
      <View
        style={[
          styles.itemView,
          isHaveVote && {borderColor: theme.background},
          containerStyle && containerStyle,
        ]}>
        <View style={styles.leftView}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item?.name}
          </Text>
          <Text style={styles.itemDescriptionTitle} numberOfLines={1}>
            {'Voted: '}
            <Text style={styles.itemDescription} numberOfLines={1}>
              {item.activated_stake}
            </Text>
          </Text>
          <Text style={styles.itemDescriptionTitle} numberOfLines={1}>
            {'APY: '}
            <Text style={styles.itemDescription} numberOfLines={1}>
              {item.apy_estimate}
            </Text>
          </Text>
        </View>
        {hideInput ? (
          <Text style={styles.voteTitle}>{`${item?.votes} TP` || ''}</Text>
        ) : (
          <View style={styles.rightView}>
            <TouchableOpacity
              style={styles.buttonStyle}
              onPress={onLocalPressMinus}>
              <MinusIcon width="24" height="24" stroke={theme.font} />
            </TouchableOpacity>
            <TextInput
              style={styles.textInputStyle}
              value={selectedVotes?.[item?.validatorAddress]?.toString() || '0'}
              onChangeText={onLocalChangeText}
              keyboardType={'number-pad'}
            />
            <TouchableOpacity
              style={styles.buttonStyle}
              onPress={onLocalPressAdd}>
              <AddIcon width="24" height="24" stroke={theme.font} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const myStyles = theme =>
  StyleSheet.create({
    itemView: {
      height: 60,
      width: SCREEN_WIDTH - 32,
      marginHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
      borderWidth: 1,
      borderColor: theme.headerBorder,
      marginTop: 16,
      borderRadius: 8,
      paddingHorizontal: 8,
    },
    leftView: {
      justifyContent: 'center',
      flex: 1,
      marginRight: 8,
    },
    itemTitle: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      flexShrink: 1,
      fontWeight: '600',
    },
    itemDescription: {
      color: theme.primary,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      marginTop: 2,
      fontWeight: '400',
    },
    itemDescriptionTitle: {
      color: theme.font,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      marginTop: 2,
      fontWeight: '500',
    },
    voteTitle: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
    },
    rightView: {
      width: 140,
      height: 50,
      backgroundColor: theme.walletItemColor,
      borderRadius: 8,
      flexDirection: 'row',
    },
    buttonStyle: {
      height: 50,
      width: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textInputStyle: {
      width: 80,
      height: 50,
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      backgroundColor: theme.walletItemColor,
      borderRadius: 8,
      textAlign: 'center',
    },
  });

export default memo(ValidatorItem, (prevProps, nextProps) => {
  const previousItem = prevProps.item;
  const nextItem = nextProps.item;
  const previousSelectedVotes = prevProps.selectedVotes;
  const nextSelectedVotes = nextProps.selectedVotes;
  return (
    previousSelectedVotes?.[previousItem?.validatorAddress] ===
    nextSelectedVotes?.[nextItem?.validatorAddress]
  );
});
