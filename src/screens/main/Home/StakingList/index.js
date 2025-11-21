import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  FlatList,
  RefreshControl,
} from 'react-native';
import myStyles from './StakingListStyles';
import {useSelector, useDispatch} from 'react-redux';
import {Provider, Portal} from 'react-native-paper';

import {ThemeContext} from 'theme/ThemeContext';
import {selectCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import Loading from 'components/Loading';
import StakingItem from 'components/StakingItem';
import {refreshCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {setSelectedVotes} from 'dok-wallet-blockchain-networks/redux/staking/stakingSlice';
import {
  isShowUnstakingButton,
  isShowVoteButton,
  isSupportEpochTime,
  multiplyBNWithFixed,
} from 'dok-wallet-blockchain-networks/helper';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
const StakingList = ({navigation}) => {
  const currentCoin = useSelector(selectCurrentCoin);
  const staking = Array.isArray(currentCoin?.staking)
    ? currentCoin?.staking
    : [];
  const stakingInfo = useMemo(() => {
    return Array.isArray(currentCoin?.stakingInfo)
      ? currentCoin?.stakingInfo
      : [];
  }, [currentCoin?.stakingInfo]);

  const unstakingDisableText = useMemo(() => {
    return stakingInfo.find(item => item.label === 'disabled_unstaking')?.value;
  }, [stakingInfo]);

  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dispatch = useDispatch();
  const isShowUnstaking = isShowUnstakingButton(currentCoin?.chain_name);
  const isShowVote = isShowVoteButton(currentCoin?.chain_name);

  const estimateEpochTimestamp = useMemo(() => {
    const isEpochTime = isSupportEpochTime(currentCoin?.chain_name);
    const tempStakingInfo = Array.isArray(currentCoin?.stakingInfo)
      ? currentCoin?.stakingInfo
      : [];
    if (isEpochTime) {
      return tempStakingInfo?.find(item => item?.label === 'Epoch ends in')
        ?.value;
    }
    return null;
  }, [currentCoin?.chain_name, currentCoin?.stakingInfo]);

  useEffect(() => {
    if (currentCoin?.address) {
      dispatch(refreshCurrentCoin({isFetchStaking: true}))
        .unwrap()
        .then(() => {
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await dispatch(refreshCurrentCoin({isFetchStaking: true})).unwrap();
    setIsRefreshing(false);
  }, [dispatch]);

  const renderItem = useCallback(
    ({item}) => {
      return (
        <StakingItem
          item={item}
          isWithdraw={true}
          estimateEpochTimestamp={estimateEpochTimestamp}
        />
      );
    },
    [estimateEpochTimestamp],
  );

  const onPressBoxItem = useCallback(
    (buttonTitle, buttonValue) => {
      const fiatAmount = multiplyBNWithFixed(
        buttonValue,
        currentCoin?.currencyRate,
        2,
      );
      navigation.navigate('WithdrawStaking', {
        selectedStake: {
          amount: buttonValue,
          fiatAmount,
        },
        ...(buttonTitle === 'Withdraw'
          ? {isWithdrawStaking: true}
          : {isStakingRewards: true}),
        hideResource: true,
      });
    },
    [currentCoin?.currencyRate, navigation],
  );

  const renderBoxItem = (title, value, buttonLabel, buttonValue, type) => {
    if (type === 'hidden') {
      return null;
    }
    return (
      <View style={styles.itemView} key={title}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.rightItemView}>
          <Text style={styles.boxBalance} numberOfLines={1}>
            {value}
          </Text>
          {!!buttonLabel && (
            <TouchableOpacity
              style={styles.buttonStyle}
              onPress={() => onPressBoxItem(buttonLabel, buttonValue)}>
              <Text style={styles.buttonTitle}>{buttonLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (!currentCoin) {
    return null;
  }
  return (
    <Provider>
      <Portal>
        <DokSafeAreaView style={styles.container}>
          {isLoading ? (
            <Loading />
          ) : (
            <FlatList
              contentContainerStyle={styles.containerContainerStyle}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                />
              }
              data={staking}
              renderItem={renderItem}
              ListHeaderComponent={
                <View>
                  <View style={styles.box}>
                    {renderBoxItem(
                      'Available Balance',
                      `${currentCoin?.totalAmount} ${currentCoin?.symbol}`,
                    )}
                    {stakingInfo.map(item =>
                      renderBoxItem(
                        item.label,
                        `${item.value}`,
                        item.buttonLabel,
                        item.buttonValue,
                        item.type,
                      ),
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.btn}
                    onPress={() => {
                      navigation.navigate('CreateStaking');
                    }}>
                    <Text style={styles.btnText}>{'Create Staking'}</Text>
                  </TouchableOpacity>
                  {isShowVote && (
                    <TouchableOpacity
                      style={styles.btn}
                      onPress={() => {
                        dispatch(setSelectedVotes(null));
                        navigation.navigate('VoteStaking');
                      }}>
                      <Text style={styles.btnText}>{'Validators'}</Text>
                    </TouchableOpacity>
                  )}
                  {isShowUnstaking && (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.btn,
                          !!unstakingDisableText && {
                            backgroundColor: theme.gray,
                            marginBottom: 4,
                          },
                        ]}
                        disabled={!!unstakingDisableText}
                        onPress={() => {
                          navigation.navigate('WithdrawStaking', {
                            isDeactivateStaking: true,
                          });
                        }}>
                        <Text style={styles.btnText}>{'Unstaking'}</Text>
                      </TouchableOpacity>
                      {!!unstakingDisableText && (
                        <Text style={styles.errorTitle}>
                          {unstakingDisableText}
                        </Text>
                      )}
                    </>
                  )}
                  <Text style={styles.stakingTitle}>Active Staking</Text>
                </View>
              }
            />
          )}
        </DokSafeAreaView>
      </Portal>
    </Provider>
  );
};

export default StakingList;
