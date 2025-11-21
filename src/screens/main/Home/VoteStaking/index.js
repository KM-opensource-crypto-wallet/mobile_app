import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import myStyles from './VoteStakingStyle';
import {Keyboard, Text, TouchableOpacity, View} from 'react-native';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import {IS_ANDROID} from 'utils/dimensions';
import {ThemeContext} from 'theme/ThemeContext';

import {
  calculateEstimateFee,
  setCurrentTransferData,
} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSlice';
import {KeyboardAwareFlatList} from 'react-native-keyboard-aware-scroll-view';
import {selectCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {
  isValidObject,
  validateNumber,
} from 'dok-wallet-blockchain-networks/helper';
import {
  fetchValidatorByChain,
  onAddVotes,
  onChangeVotes,
  onMinusVotes,
} from 'dok-wallet-blockchain-networks/redux/staking/stakingSlice';
import {
  countSelectedVotes,
  getSelectedVotes,
  getStakingLoading,
  getStakingValidatorsByChain,
} from 'dok-wallet-blockchain-networks/redux/staking/stakingSelectors';
import Loading from 'components/Loading';
import {setExchangeSuccess} from 'dok-wallet-blockchain-networks/redux/exchange/exchangeSlice';
import ValidatorItem from 'components/ValidatorItem';
import {Searchbar} from 'react-native-paper';
import Animated, {useSharedValue, withTiming} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {DokSafeAreaView} from 'components/DokSafeAreaView';

const VoteStaking = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const currentCoin = useSelector(selectCurrentCoin);
  const validators = useSelector(getStakingValidatorsByChain, shallowEqual);
  const [validatorsList, setValidatorsList] = useState(validators.slice(0, 20));
  const [searchQuery, setSearchQuery] = useState('');
  const selectedVotes = useSelector(getSelectedVotes);
  const displayItemRef = useRef(20);
  const availableAmount = useMemo(() => {
    const amount = currentCoin?.stakingBalance || '0';
    const stakingBalanceNumber = validateNumber(amount);
    if (stakingBalanceNumber) {
      return Math.floor(stakingBalanceNumber);
    }
    return 0;
  }, [currentCoin]);
  const bottomValue = useSharedValue(0);
  const {bottom} = useSafeAreaInsets();
  const isMountedRef = useRef(false);
  const initialSelectedVotes = useRef(null);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardWillShow', e => {
      bottomValue.value = withTiming(
        -(e.endCoordinates.height - (86 + bottom)),
        {
          duration: e.duration,
        },
      );
    });
    const hideSubscription = Keyboard.addListener('keyboardWillHide', e => {
      bottomValue.value = withTiming(0, {
        duration: e.duration,
      });
    });
    isMountedRef.current = true;
    return () => {
      showSubscription?.remove?.();
      hideSubscription?.remove?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setValidatorsList(validators.slice(0, displayItemRef.current));
  }, [validators]);

  const selectedTotal = useSelector(countSelectedVotes);

  const isLoading = useSelector(getStakingLoading);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchValidatorByChain({chain_name: currentCoin?.chain_name}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    if (
      !isLoading &&
      isMountedRef.current &&
      !initialSelectedVotes.current &&
      selectedVotes
    ) {
      initialSelectedVotes.current = selectedVotes;
    }
  }, [isLoading, selectedVotes]);

  const handleSubmitForm = async values => {
    const selectedValidators = Object.keys(selectedVotes);
    const displayValidators = [];
    const finalSelectedVotes = {};
    selectedValidators.forEach(item => {
      const tempValidator = validators.find(
        subItem => subItem?.validatorAddress === item,
      );
      if (tempValidator && selectedVotes[item]) {
        displayValidators.push({
          ...tempValidator,
          votes: selectedVotes[item],
        });
        finalSelectedVotes[item] = selectedVotes[item];
      }
    });
    dispatch(
      setCurrentTransferData({
        selectedVotes: finalSelectedVotes,
        currentCoin,
        amount: values?.amount,
        displayValidators,
        isSendFunds: false,
      }),
    );
    dispatch(
      calculateEstimateFee({
        isFetchNonce: true,
        fromAddress: currentCoin?.address,
        amount: values?.amount,
        selectedVotes: finalSelectedVotes,
        balance: availableAmount,
        isCreateVote: true,
      }),
    );
    dispatch(setExchangeSuccess(false));
    navigation.navigate('Transfer', {
      fromScreen: 'VoteStaking',
      isCreateVote: true,
    });
  };

  const handleSearch = useCallback(
    value => {
      setSearchQuery(value);
      if (value) {
        setValidatorsList(
          validators.filter(item =>
            item?.name?.toLowerCase().includes(value?.toLowerCase()),
          ),
        );
      } else {
        setValidatorsList(validators.slice(0, displayItemRef.current));
      }
    },
    [validators],
  );

  const onEndReached = useCallback(() => {
    if (!searchQuery && validatorsList?.length !== validators?.length) {
      displayItemRef.current += 20;
      setValidatorsList(validators.slice(0, displayItemRef.current));
    }
  }, [searchQuery, validators, validatorsList?.length]);

  const onPressAdd = useCallback(
    address => {
      dispatch(onAddVotes({address}));
    },
    [dispatch],
  );

  const onPressMinus = useCallback(
    address => {
      dispatch(onMinusVotes({address}));
    },
    [dispatch],
  );

  const onChangeText = useCallback(
    (address, value) => {
      dispatch(onChangeVotes({address, value}));
    },
    [dispatch],
  );

  const renderItem = useCallback(
    ({item}) => (
      <ValidatorItem
        item={item}
        selectedVotes={selectedVotes}
        onPressAdd={onPressAdd}
        onPressMinus={onPressMinus}
        onChangeText={onChangeText}
      />
    ),
    [onChangeText, onPressAdd, onPressMinus, selectedVotes],
  );

  if (isLoading) {
    return <Loading />;
  }

  const isValid =
    availableAmount >= selectedTotal &&
    JSON.stringify(initialSelectedVotes.current) !==
      JSON.stringify(selectedVotes) &&
    selectedTotal > 0;

  return (
    <DokSafeAreaView style={styles.container}>
      <View style={styles.container}>
        <Searchbar
          placeholder="Search"
          value={searchQuery}
          style={styles.input}
          onChangeText={handleSearch}
        />
        <KeyboardAwareFlatList
          style={styles.flatlistStyle}
          enableOnAndroid={true}
          {...(IS_ANDROID ? {extraScrollHeight: 30} : {})}
          keyboardShouldPersistTaps={'always'}
          keyboardOpeningTime={Number.MAX_SAFE_INTEGER}
          keyExtractor={item => item.validatorAddress}
          data={validatorsList}
          contentContainerStyle={styles.contentContainerStyle}
          renderItem={renderItem}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          getItemLayout={(data, index) => ({
            length: 60,
            offset: 60 * index,
            index,
          })}
          onEndReached={onEndReached}
          removeClippedSubviews={true}
        />
        <Animated.View
          style={[
            styles.bottomContainer,
            {
              transform: [
                {
                  translateY: bottomValue,
                },
              ],
            },
          ]}>
          <View style={styles.bottomView}>
            <Text style={styles.itemDescriptionTitle}>
              {'Selected / Total = '}
              <Text
                style={
                  styles.itemDescription
                }>{`${selectedTotal} / ${availableAmount}`}</Text>
            </Text>
          </View>
          <TouchableOpacity
            disabled={!isValid}
            style={{
              ...styles.button,
              backgroundColor: isValid ? theme.background : theme.gray,
            }}
            onPress={handleSubmitForm}>
            <Text style={styles.buttonTitle}>Next</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </DokSafeAreaView>
  );
};

export default VoteStaking;
