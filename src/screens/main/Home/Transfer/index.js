import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
  useLayoutEffect,
} from 'react';
import myStyles from './TransferStyles';
import {
  TouchableOpacity,
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  Linking,
} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';
import {
  getLocalCurrency,
  isFeesOptions,
} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {IS_ANDROID, SCREEN_WIDTH, useFloatingHeight} from 'utils/dimensions';
import {sendFunds} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {ThemeContext} from 'theme/ThemeContext';
import {
  getTransferData,
  getTransferDataCustomError,
  getTransferDataFeesOptions,
  getTransferDataFeeSuccess,
  getTransferDataLoading,
  getTransferDataSubmitting,
} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSelector';
import {
  isBalanceNotAvailable,
  delay,
  getCustomizePublicAddress,
  isCustomAddressNotSupportedChain,
  validateNumberInInput,
  isEVMChain,
  isFeesOptionChain,
  GAS_CURRENCY,
} from 'dok-wallet-blockchain-networks/helper';
import ModalConfirmTransaction from 'components/ModalConfirmTransaction';
import Spinner from 'components/Spinner';
import {currencySymbol} from 'data/currency';
import {
  getBalanceForNativeCoin,
  getCurrentWalletPhrase,
  selectCurrentWallet,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import Loading from 'components/Loading';
import BigNumber from 'bignumber.js';
import {
  calculateEstimateFee,
  updateFees,
} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSlice';
import ScurvedIcon from 'assets/images/icons/S-curved.svg';
import {getExchange} from 'dok-wallet-blockchain-networks/redux/exchange/exchangeSelectors';
import FastImage from '@d11/react-native-fast-image';
import DefaultDokWalletImage from 'components/DefaultDokWalletImage';
import ValidatorItem from 'components/ValidatorItem';
import {TextInput} from 'react-native-paper';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {getSellCryptoRequestDetails} from 'dok-wallet-blockchain-networks/redux/sellCrypto/sellCryptoSelectors';
import {DokSafeAreaView} from 'components/DokSafeAreaView';

const Transfer = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const localCurrency = useSelector(getLocalCurrency);
  const transferData = useSelector(getTransferData);
  const isSubmitting = useSelector(getTransferDataSubmitting);
  const isLoading = useSelector(getTransferDataLoading);
  const feeSuccess = useSelector(getTransferDataFeeSuccess);
  const customError = useSelector(getTransferDataCustomError);
  const balance = useSelector(getBalanceForNativeCoin);
  const phrase = useSelector(getCurrentWalletPhrase);
  const sellCryptoRequestDetails = useSelector(getSellCryptoRequestDetails);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isFetchingFeesAgain, setIsFetchingFeesAgain] = useState(false);
  const [selectedFeesType, setSelectedFeesType] = useState('recommended');
  const [customFees, setCustomFees] = useState('');
  const selectedFeesTypeRef = useRef('recommended');
  const isFetchingRef = useRef(false);
  const isPauseCalculateFees = useRef(false);
  const [isFetchedSuccessful, setIsFetchedSuccessful] = useState('null');
  const floatingHeight = useFloatingHeight();
  const dispatch = useDispatch();
  const currentWallet = useSelector(selectCurrentWallet);
  const fromScreen = route?.params?.fromScreen;
  const redirect_url = route?.params?.redirect_url;
  const {
    selectedFromAsset,
    selectedFromWallet,
    selectedToAsset,
    amountFrom,
    amountTo,
    isLoading: isExchangeLoading,
    success: isExchangeSuccess,
    exchangeToName,
    exchangeToAddress,
    selectedExchangeChain,
  } = useSelector(getExchange);
  const [localImage, setLocalImage] = useState(
    transferData?.selectedNFT?.metadata?.image,
  );

  const isExchangeScreen = fromScreen === 'Exchange';
  const isSendFundScreen = fromScreen === 'SendFunds';
  const isSendNFT = fromScreen === 'SendNFT';
  const isStakingScreen = fromScreen === 'Staking';
  const isVoteStakingScreen = fromScreen === 'VoteStaking';
  const isSellCryptoScreen = fromScreen === 'SellCrypto';
  const isDeactivateStaking = route?.params?.isDeactivateStaking;
  const isWithdrawStaking = route?.params?.isWithdrawStaking;
  const isStakingRewards = route?.params?.isStakingRewards;
  const isCreateStaking = route?.params?.isCreateStaking;
  const isCreateVote = route?.params?.isCreateVote;

  const chainName = isExchangeScreen
    ? selectedFromAsset?.chain_name
    : transferData?.currentCoin?.chain_name;

  const convertedChainName = isEVMChain(chainName) ? 'ethereum' : chainName;

  const isFeesOptionsEnabled = useSelector(isFeesOptions);
  const feesOptions = useSelector(getTransferDataFeesOptions);

  useEffect(() => {
    if (feesOptions?.[0]?.gasPrice) {
      setCustomFees(feesOptions?.[0]?.gasPrice);
    }
  }, [feesOptions]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isSendFundScreen
        ? 'Transfer'
        : isExchangeScreen
        ? 'Swap Confirm'
        : isSellCryptoScreen
        ? 'Sell Crypto Confirm'
        : isSendNFT
        ? 'Transfer NFT'
        : isCreateStaking
        ? 'Confirm Staking'
        : isCreateVote
        ? 'Confirm Validators'
        : isWithdrawStaking
        ? 'Confirm Withdraw Staking'
        : isDeactivateStaking
        ? 'Confirm Deactivate Staking'
        : isStakingRewards
        ? 'Confirm Staking Rewards'
        : '',
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWithdrawStaking, isDeactivateStaking, isStakingRewards, isSendNFT]);

  useEffect(() => {
    if (
      (isExchangeSuccess && isExchangeScreen) ||
      ((isSendFundScreen ||
        isSellCryptoScreen ||
        isSendNFT ||
        isStakingScreen) &&
        feeSuccess)
    ) {
      setIsFetchedSuccessful('true');
      let timeout = setInterval(() => {
        if (!isFetchingRef.current && !isPauseCalculateFees.current) {
          setIsFetchingFeesAgain(true);

          isFetchingRef.current = true;

          dispatch(
            calculateEstimateFee({
              fromAddress:
                isSendFundScreen || isStakingScreen || isSellCryptoScreen
                  ? transferData?.currentCoin?.address
                  : isExchangeScreen
                  ? selectedFromAsset?.address
                  : transferData?.selectedNFT?.coin?.address,
              toAddress: transferData.toAddress,
              memo: transferData.memo,
              amount:
                isSendFundScreen || isStakingScreen || isSellCryptoScreen
                  ? transferData?.amount
                  : isExchangeScreen
                  ? amountFrom
                  : null,
              contractAddress: isSendNFT
                ? transferData?.selectedNFT?.token_address ||
                  transferData?.selectedNFT?.associatedTokenAddress
                : transferData?.currentCoin?.contractAddress,
              balance: transferData?.currentCoin?.totalAmount,
              selectedWallet: isExchangeScreen
                ? selectedFromWallet
                : isSendNFT
                ? currentWallet
                : null,
              selectedCoin: isExchangeScreen
                ? selectedFromAsset
                : isSendNFT
                ? transferData?.currentCoin
                : null,
              contract_type: isSendNFT
                ? transferData?.selectedNFT?.contract_type
                : null,
              isNFT: isSendNFT,
              mint: isSendNFT ? transferData?.selectedNFT?.mint : null,
              tokenId: isSendNFT ? transferData?.selectedNFT?.token_id : null,
              tokenAmount: isSendNFT
                ? transferData?.selectedNFT?.amount || 1
                : null,
              validatorPubKey: isStakingScreen
                ? transferData?.validatorPubKey
                : null,
              stakingBalance: isStakingScreen
                ? transferData?.stakingBalance
                : null,
              resourceType: isStakingScreen ? transferData?.resourceType : null,
              stakingAddress: isStakingScreen
                ? transferData?.stakingAddress
                : null,
              selectedVotes: isVoteStakingScreen
                ? transferData?.selectedVotes
                : null,
              isCreateStaking: isCreateStaking,
              isWithdrawStaking: !!isWithdrawStaking,
              isStakingRewards: !!isStakingRewards,
              isDeactivateStaking: !!isDeactivateStaking,
              feesType: selectedFeesTypeRef.current,
              estimateGas: transferData?.estimateGas,
            }),
          )
            .unwrap()
            .then(resp => {
              setIsFetchingFeesAgain(false);
              isFetchingRef.current = false;
              setIsFetchedSuccessful(resp ? 'true' : 'false');
            });
        }
      }, 10000);
      return () => {
        clearTimeout(timeout);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeSuccess, isExchangeSuccess]);

  useEffect(() => {
    setLocalImage(transferData?.selectedNFT?.metadata?.image);
  }, [transferData?.selectedNFT?.metadata?.image]);

  const submitTransferData = useCallback(async () => {
    return await dispatch(
      sendFunds({
        to: transferData.toAddress,
        memo: transferData.memo,
        amount:
          isSendFundScreen || isStakingScreen || isSellCryptoScreen
            ? transferData?.amount
            : isExchangeScreen
            ? amountFrom
            : '0',
        currentCoin: transferData?.currentCoin,
        currentWallet: isExchangeScreen
          ? selectedFromWallet
          : isSendNFT
          ? currentWallet
          : null,
        balance: transferData?.currentCoin?.totalAmount,
        isExchange: isExchangeScreen,
        contract_type: isSendNFT
          ? transferData?.selectedNFT?.contract_type
          : null,
        tokenId: isSendNFT ? transferData?.selectedNFT?.token_id : null,
        tokenAmount: isSendNFT ? transferData?.selectedNFT?.amount : null,
        contractAddress: isSendNFT
          ? transferData?.selectedNFT?.token_address ||
            transferData?.selectedNFT?.associatedTokenAddress
          : null,
        mint: isSendNFT ? transferData?.selectedNFT?.mint : null,
        isNFT: isSendNFT,
        from:
          isStakingScreen ||
          isSendNFT ||
          isVoteStakingScreen ||
          isSellCryptoScreen
            ? transferData?.currentCoin?.address
            : null,
        validatorPubKey: isStakingScreen ? transferData?.validatorPubKey : null,
        isWithdrawStaking: !!isWithdrawStaking,
        isStakingRewards: !!isStakingRewards,
        isCreateStaking: isCreateStaking,
        stakingBalance: isStakingScreen ? transferData?.stakingBalance : null,
        resourceType: isStakingScreen ? transferData?.resourceType : null,
        selectedVotes: isVoteStakingScreen ? transferData?.selectedVotes : null,
        isCreateVote: !!isCreateVote,
        isDeactivateStaking: !!isDeactivateStaking,
        stakingAddress: isStakingScreen ? transferData?.stakingAddress : null,
        numberOfStakeAccount: isStakingScreen
          ? transferData?.currentCoin?.staking?.length || 0
          : null,
        phrase,
        navigation,
      }),
    ).unwrap();
  }, [
    dispatch,
    transferData.toAddress,
    transferData.memo,
    transferData?.amount,
    transferData?.currentCoin,
    transferData?.selectedNFT?.contract_type,
    transferData?.selectedNFT?.token_id,
    transferData?.selectedNFT?.amount,
    transferData?.selectedNFT?.token_address,
    transferData?.selectedNFT?.associatedTokenAddress,
    transferData?.selectedNFT?.mint,
    transferData?.validatorPubKey,
    transferData?.stakingBalance,
    transferData?.resourceType,
    transferData?.selectedVotes,
    transferData?.stakingAddress,
    isSendFundScreen,
    isStakingScreen,
    isExchangeScreen,
    amountFrom,
    selectedFromWallet,
    isSendNFT,
    currentWallet,
    isVoteStakingScreen,
    isWithdrawStaking,
    isStakingRewards,
    isCreateStaking,
    isCreateVote,
    isDeactivateStaking,
    phrase,
    navigation,
    isSellCryptoScreen,
  ]);

  const onSuccess = useCallback(async () => {
    setShowConfirmModal(false);
    await delay(300);
    const {tx_hash, status} = await submitTransferData();
    if (redirect_url && tx_hash) {
      try {
        const decodedUrl = decodeURIComponent(redirect_url);
        const link = `${decodedUrl}&tx_hash=${tx_hash}&status=${status}`;
        await Linking.openURL(link);
      } catch (error) {
        console.error('Failed to open redirect URL:', error);
      }
    }
  }, [redirect_url, submitTransferData]);

  const handleSubmitForm = () => {
    setShowConfirmModal(true);
    isPauseCalculateFees.current = true;
  };

  const isDisabled = isBalanceNotAvailable(
    transferData?.selectedUTXOsValue || balance,
    transferData?.transactionFee,
    isExchangeScreen && selectedFromAsset?.type === 'coin' ? amountFrom : null,
  );

  const onChangeCustomFees = text => {
    const tempValues = validateNumberInInput(
      text,
      transferData?.currentCoin?.decimal,
    );
    setCustomFees(tempValues || '0');
    dispatch(updateFees({gasPrice: tempValues || '0', convertedChainName}));
  };

  const currencyRate =
    (isSendFundScreen || isStakingScreen
      ? transferData?.currentCoin?.currencyRate
      : isExchangeScreen
      ? selectedFromAsset?.currencyRate
      : '0') || '0';
  const amount =
    (isSendFundScreen || isStakingScreen || isSellCryptoScreen
      ? transferData?.amount
      : isExchangeScreen
      ? amountFrom
      : '0') || '0';
  const currentRateBN = new BigNumber(currencyRate);
  const amountBN = new BigNumber(amount);
  const priceValue = currentRateBN.multipliedBy(amountBN);
  const fiatEstimateFee = transferData?.fiatEstimateFee || '0';
  const fiatEstimateFeeBN = new BigNumber(fiatEstimateFee);
  const totalValue = priceValue.plus(fiatEstimateFeeBN).toFixed(2);

  const renderSendFundUI = () => {
    return (
      <View style={styles.formInput}>
        <Text style={styles.amountTitle}>{`-${transferData?.amount || 0} ${
          transferData?.currentCoin?.symbol || ''
        }`}</Text>
        <Text style={styles.boxBalance}>
          {currencySymbol[localCurrency] || ''}
          {priceValue?.toFixed(2) || '0'}
        </Text>
        <View style={styles.box}>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Chain'}</Text>
            <Text style={styles.boxBalance}>
              {transferData?.currentCoin?.chain_display_name}
            </Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Asset'}</Text>
            <Text
              style={
                styles.boxBalance
              }>{`${transferData?.currentCoin?.name} (${transferData?.currentCoin?.symbol})`}</Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'From'}</Text>
            <Text style={styles.boxBalance}>{`${
              isCustomAddressNotSupportedChain(chainName)
                ? transferData?.currentCoin?.address
                : getCustomizePublicAddress(transferData?.currentCoin?.address)
            }`}</Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'To'}</Text>
            <Text style={styles.boxBalance}>{`${
              isCustomAddressNotSupportedChain(chainName)
                ? transferData?.toAddress
                : getCustomizePublicAddress(transferData?.toAddress)
            }`}</Text>
          </View>
          {!!transferData?.validName && (
            <View style={styles.itemView}>
              <Text style={styles.title}>{'DNS'}</Text>
              <Text style={styles.boxBalance}>{transferData?.validName}</Text>
            </View>
          )}
          {!!transferData?.memo && (
            <View style={styles.itemView}>
              <Text style={styles.title}>{'Memo'}</Text>
              <Text style={styles.boxBalance}>{transferData?.memo}</Text>
            </View>
          )}
        </View>
        <View style={styles.box}>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Network Fee'}</Text>
            <Text style={styles.boxBalance}>
              {isFetchingFeesAgain
                ? 'Refreshing'
                : `${transferData?.transactionFee || '0'} ${
                    transferData?.currentCoin?.chain_symbol
                  }`}
            </Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Max Total'}</Text>
            <Text style={styles.boxBalance}>{`${currencySymbol[localCurrency]}${
              totalValue || 0
            }`}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSellCryptoUI = () => {
    return (
      <View style={styles.formInput}>
        <Text style={styles.amountTitle}>{`-${transferData?.amount || 0} ${
          transferData?.currentCoin?.symbol || ''
        }`}</Text>
        <View style={styles.box}>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Chain'}</Text>
            <Text style={styles.boxBalance}>
              {transferData?.currentCoin?.chain_display_name}
            </Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Asset'}</Text>
            <Text
              style={
                styles.boxBalance
              }>{`${transferData?.currentCoin?.name} (${transferData?.currentCoin?.symbol})`}</Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'From'}</Text>
            <Text style={styles.boxBalance}>{`${
              isCustomAddressNotSupportedChain(chainName)
                ? transferData?.currentCoin?.address
                : getCustomizePublicAddress(transferData?.currentCoin?.address)
            }`}</Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'To'}</Text>
            <Text style={styles.boxBalance}>{`${
              isCustomAddressNotSupportedChain(chainName)
                ? transferData?.toAddress
                : getCustomizePublicAddress(transferData?.toAddress)
            }`}</Text>
          </View>
          {!!transferData?.validName && (
            <View style={styles.itemView}>
              <Text style={styles.title}>{'DNS'}</Text>
              <Text style={styles.boxBalance}>{transferData?.validName}</Text>
            </View>
          )}
          {!!transferData?.memo && (
            <View style={styles.itemView}>
              <Text style={styles.title}>{'Memo'}</Text>
              <Text style={styles.boxBalance}>{transferData?.memo}</Text>
            </View>
          )}
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Provider'}</Text>
            <Text style={styles.boxBalance}>
              {sellCryptoRequestDetails?.providerDisplayName}
            </Text>
          </View>
        </View>
        <View style={styles.box}>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Network Fee'}</Text>
            <Text style={styles.boxBalance}>
              {isFetchingFeesAgain
                ? 'Refreshing'
                : `${transferData?.transactionFee || '0'} ${
                    transferData?.currentCoin?.chain_symbol
                  }`}
            </Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Max Total'}</Text>
            <Text style={styles.boxBalance}>{`${currencySymbol[localCurrency]}${
              totalValue || 0
            }`}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderExchangeUI = () => {
    return (
      <View style={styles.formInput}>
        <View style={styles.box}>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Asset'}</Text>
            <Text
              style={
                styles.boxBalance
              }>{`${selectedFromAsset?.name} (${selectedFromAsset?.symbol})`}</Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'From'}</Text>
            <Text style={styles.boxBalance}>{`${getCustomizePublicAddress(
              selectedFromAsset?.address,
            )}`}</Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Chain'}</Text>
            <Text
              style={
                styles.boxBalance
              }>{`${selectedFromAsset?.chain_display_name}`}</Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Pay Amount'}</Text>
            <Text
              style={
                styles.boxBalance
              }>{`${amountFrom} ${selectedFromAsset?.symbol}`}</Text>
          </View>
        </View>
        <View style={styles.iconView}>
          <ScurvedIcon width={25} height={20} stroke={theme.background} />
        </View>
        <View style={[styles.box, {marginTop: 0}]}>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Asset'}</Text>
            <Text
              style={
                styles.boxBalance
              }>{`${selectedToAsset?.name} (${selectedToAsset?.symbol})`}</Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'To'}</Text>
            <Text style={styles.boxBalance}>{`${getCustomizePublicAddress(
              exchangeToAddress,
            )}`}</Text>
          </View>
          {!!exchangeToName && (
            <View style={styles.itemView}>
              <Text style={styles.title}>{'DNS'}</Text>
              <Text style={styles.boxBalance}>{exchangeToName}</Text>
            </View>
          )}
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Chain'}</Text>
            <Text
              style={
                styles.boxBalance
              }>{`${selectedToAsset?.chain_display_name}`}</Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Receive Amount'}</Text>
            <Text
              style={
                styles.boxBalance
              }>{`${amountTo} ${selectedToAsset?.symbol}`}</Text>
          </View>
        </View>
        <View style={styles.box}>
          {!!selectedExchangeChain?.providerName && (
            <View style={styles.itemView}>
              <Text style={styles.title}>{'Exchange Provider'}</Text>
              <Text style={[styles.boxBalance, {textTransform: 'capitalize'}]}>
                {selectedExchangeChain?.providerName}
              </Text>
            </View>
          )}
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Network Fee'}</Text>
            <Text style={styles.boxBalance}>
              {isFetchingFeesAgain
                ? 'Refreshing'
                : `${transferData?.transactionFee || '0'} ${
                    selectedFromAsset?.chain_symbol
                  }`}
            </Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Max Total'}</Text>
            <Text style={styles.boxBalance}>{`${currencySymbol[localCurrency]}${
              totalValue || 0
            }`}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSendNFTUI = () => {
    return (
      <View style={styles.formInput}>
        <View style={styles.centerView}>
          {localImage ? (
            <FastImage
              source={{uri: localImage}}
              style={styles.imageStyle}
              resizeMode={'contain'}
              onError={() => {
                setLocalImage(null);
              }}
            />
          ) : (
            <DefaultDokWalletImage height={60} width={60} />
          )}
        </View>
        <View style={styles.box}>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Name'}</Text>
            <Text style={styles.boxBalance}>{`${
              transferData?.selectedNFT?.name ||
              transferData?.selectedNFT?.symbol
            } ${
              transferData?.selectedNFT?.token_id
                ? `(${transferData?.selectedNFT?.token_id})`
                : ''
            }`}</Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Chain'}</Text>
            <Text style={styles.boxBalance}>
              {transferData?.currentCoin?.chain_display_name}
            </Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'From'}</Text>
            <Text style={styles.boxBalance}>{`${getCustomizePublicAddress(
              transferData?.currentCoin?.address,
            )}`}</Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'To'}</Text>
            <Text style={styles.boxBalance}>{`${getCustomizePublicAddress(
              transferData?.toAddress,
            )}`}</Text>
          </View>
          {!!transferData?.validName && (
            <View style={styles.itemView}>
              <Text style={styles.title}>{'DNS'}</Text>
              <Text style={styles.boxBalance}>{transferData?.validName}</Text>
            </View>
          )}
        </View>
        <View style={styles.box}>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Network Fee'}</Text>
            <Text style={styles.boxBalance}>
              {isFetchingFeesAgain
                ? 'Refreshing'
                : `${transferData?.transactionFee || '0'} ${
                    transferData?.currentCoin?.chain_symbol
                  }`}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderStakingUI = () => {
    return (
      <View style={styles.formInput}>
        <Text style={styles.amountTitle}>{`-${transferData?.amount || 0} ${
          transferData?.currentCoin?.symbol || ''
        }`}</Text>
        <Text style={styles.boxBalance}>
          {currencySymbol[localCurrency] || ''}
          {priceValue?.toFixed(2) || '0'}
        </Text>
        <View style={styles.box}>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Chain'}</Text>
            <Text style={styles.boxBalance}>
              {transferData?.currentCoin?.chain_display_name}
            </Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Asset'}</Text>
            <Text
              style={
                styles.boxBalance
              }>{`${transferData?.currentCoin?.name} (${transferData?.currentCoin?.symbol})`}</Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'From'}</Text>
            <Text style={styles.boxBalance}>{`${getCustomizePublicAddress(
              transferData?.currentCoin?.address,
            )}`}</Text>
          </View>
          {!!transferData?.validatorPubKey && (
            <View style={styles.itemView}>
              <Text style={styles.title}>{'Validator Address'}</Text>
              <Text style={styles.boxBalance}>{`${getCustomizePublicAddress(
                transferData?.validatorPubKey,
              )}`}</Text>
            </View>
          )}
          {!!transferData?.validatorName && (
            <View style={styles.itemView}>
              <Text style={styles.title} numberOfLines={1}>
                {'Validator Name'}
              </Text>
              <Text style={styles.boxBalance} numberOfLines={1}>
                {transferData?.validatorName}
              </Text>
            </View>
          )}
          {!!transferData?.resourceType && (
            <View style={styles.itemView}>
              <Text style={styles.title}>{'Resource Type'}</Text>
              <Text style={styles.boxBalance}>
                {transferData?.resourceType}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.box}>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Network Fee'}</Text>
            <Text style={styles.boxBalance}>
              {isFetchingFeesAgain
                ? 'Refreshing'
                : `${transferData?.transactionFee || '0'} ${
                    transferData?.currentCoin?.chain_symbol
                  }`}
            </Text>
          </View>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Max Total'}</Text>
            <Text style={styles.boxBalance}>{`${currencySymbol[localCurrency]}${
              totalValue || 0
            }`}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderVotingUI = () => {
    const displayValidators = Array.isArray(transferData?.displayValidators)
      ? transferData?.displayValidators
      : [];

    return (
      <View style={styles.formInput}>
        {displayValidators?.map(item => (
          <ValidatorItem
            item={item}
            hideInput={true}
            key={item.validatorAddress}
            containerStyle={{marginHorizontal: 0, width: SCREEN_WIDTH - 40}}
          />
        ))}
        <View style={styles.box}>
          <View style={styles.itemView}>
            <Text style={styles.title}>{'Network Fee'}</Text>
            <Text style={styles.boxBalance}>
              {isFetchingFeesAgain
                ? 'Refreshing'
                : `${transferData?.transactionFee || '0'} ${
                    transferData?.currentCoin?.chain_symbol
                  }`}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <DokSafeAreaView style={styles.mainView}>
      {!!isSubmitting && <Spinner />}
      {(isLoading || isExchangeLoading) && !isFetchingFeesAgain ? (
        <Loading />
      ) : feeSuccess || isExchangeSuccess || isFetchedSuccessful === 'true' ? (
        <KeyboardAwareScrollView
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          bounces={false}
          keyboardShouldPersistTaps={'always'}
          {...(IS_ANDROID ? {extraScrollHeight: 30} : {})}
          // enableResetScrollToCoords={false}
          keyboardOpeningTime={Number.MAX_SAFE_INTEGER}
          contentContainerStyle={styles.contentContainerStyle}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View
              style={{
                ...styles.container,
                paddingVertical: floatingHeight > 400 ? 40 : 10,
              }}>
              {isSendFundScreen
                ? renderSendFundUI()
                : isExchangeScreen
                ? renderExchangeUI()
                : isSellCryptoScreen
                ? renderSellCryptoUI()
                : isSendNFT
                ? renderSendNFTUI()
                : isStakingScreen
                ? renderStakingUI()
                : renderVotingUI()}
              {isFeesOptionsEnabled &&
                isFeesOptionChain(convertedChainName) &&
                !!feesOptions?.length &&
                !isExchangeScreen && (
                  <View>
                    <View style={styles.feesOptionContainer}>
                      <TouchableOpacity
                        onPress={() => {
                          isPauseCalculateFees.current = false;
                          setSelectedFeesType('recommended');
                          selectedFeesTypeRef.current = 'recommended';
                          dispatch(
                            updateFees({
                              gasPrice: feesOptions?.[0].gasPrice,
                              convertedChainName,
                            }),
                          );
                        }}
                        style={[
                          styles.feesOptionsItem,
                          selectedFeesType?.toLowerCase() ===
                            feesOptions?.[0]?.title?.toLowerCase() && {
                            borderColor: theme.background,
                            borderWidth: 3,
                          },
                        ]}>
                        <Text numberOfLines={1} style={styles.feesOptionTitle}>
                          {`${feesOptions?.[0].title}`}
                        </Text>
                        <Text style={styles.feesOptionDescription}>
                          {`${feesOptions?.[0].gasPrice} ${GAS_CURRENCY[convertedChainName]}`}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.feesOptionsItem,
                          selectedFeesType?.toLowerCase() ===
                            feesOptions?.[1]?.title?.toLowerCase() && {
                            borderColor: theme.background,
                            borderWidth: 3,
                          },
                        ]}
                        onPress={() => {
                          isPauseCalculateFees.current = false;
                          setSelectedFeesType('normal');
                          selectedFeesTypeRef.current = 'normal';
                          dispatch(
                            updateFees({
                              gasPrice: feesOptions?.[1].gasPrice,
                              convertedChainName,
                            }),
                          );
                        }}>
                        <Text
                          numberOfLines={1}
                          style={
                            styles.feesOptionTitle
                          }>{`${feesOptions?.[1].title}`}</Text>
                        <Text style={styles.feesOptionDescription}>
                          {`${feesOptions?.[1].gasPrice} ${GAS_CURRENCY[convertedChainName]}`}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.feesOptionsItem,
                          selectedFeesType?.toLowerCase() === 'custom' && {
                            borderColor: theme.background,
                            borderWidth: 3,
                          },
                        ]}
                        onPress={() => {
                          isPauseCalculateFees.current = true;
                          setSelectedFeesType('custom');
                          selectedFeesTypeRef.current = 'custom';
                        }}>
                        <Text style={styles.feesOptionTitle}>{'Custom'}</Text>
                      </TouchableOpacity>
                    </View>
                    {selectedFeesType === 'custom' && (
                      <>
                        <TextInput
                          style={styles.input}
                          label="Gas price"
                          textColor={theme.font}
                          placeholder={'Enter Gas price'}
                          theme={{
                            colors: {
                              onSurfaceVariant: '#989898',
                              primary: '#989898',
                            },
                          }}
                          outlineColor={'#989898'}
                          activeOutlineColor={theme.borderActiveColor}
                          keyboardType={'numeric'}
                          autoCapitalize="none"
                          returnKeyType="done"
                          mode="outlined"
                          blurOnSubmit={false}
                          name="customFees"
                          autoFocus={true}
                          onChangeText={onChangeCustomFees}
                          value={customFees}
                        />
                      </>
                    )}
                  </View>
                )}
              {isDisabled && (
                <Text
                  style={
                    styles.errorText
                  }>{`You don't have enough balance for make transaction you require ${transferData?.transactionFee} ${transferData?.currentCoin?.chain_symbol} to complete the transaction `}</Text>
              )}
              <TouchableOpacity
                disabled={isDisabled || isFetchingFeesAgain}
                style={{
                  ...styles.button,
                  backgroundColor:
                    isDisabled || isFetchingFeesAgain
                      ? '#708090'
                      : theme.background,
                }}
                onPress={handleSubmitForm}>
                <Text style={styles.buttonTitle}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAwareScrollView>
      ) : (
        <View style={styles.emptyView}>
          <Text style={styles.title}>
            {customError
              ? customError?.toString()
              : 'Something went wrong in generating transaction fees'}
          </Text>
        </View>
      )}
      <ModalConfirmTransaction
        hideModal={() => {
          setShowConfirmModal(false);
          isPauseCalculateFees.current = false;
        }}
        visible={showConfirmModal}
        onSuccess={onSuccess}
      />
    </DokSafeAreaView>
  );
};

export default Transfer;
