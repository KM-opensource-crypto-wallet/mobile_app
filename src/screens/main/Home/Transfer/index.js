import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
  useLayoutEffect,
  useMemo,
} from 'react';
import myStyles from './TransferStyles';
import {
  TouchableOpacity,
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import ChevronIcon from 'assets/images/icons/keyboard-arrow-right.svg';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AdvancedFeesSheet from 'components/AdvancedFeesSheet';

import {useDispatch, useSelector} from 'react-redux';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
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
  getFailedTransaction,
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
import {
  calculateExchange,
  sendSwap,
} from 'dok-wallet-blockchain-networks/redux/exchange/exchangeSlice';
import FastImage from '@d11/react-native-fast-image';
import DefaultDokWalletImage from 'components/DefaultDokWalletImage';
import ValidatorItem from 'components/ValidatorItem';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {getSellCryptoRequestDetails} from 'dok-wallet-blockchain-networks/redux/sellCrypto/sellCryptoSelectors';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import {handleTransferRedirect} from 'utils/common';
import BatchTransactionItem from 'components/BatchTransactionItem';
import DuplicateTransactionModal from 'components/DuplicateTransactionModal';
import dayjs from 'dayjs';

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
  const failedTransaction = useSelector(getFailedTransaction);
  const sellCryptoRequestDetails = useSelector(getSellCryptoRequestDetails);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isFetchingFeesAgain, setIsFetchingFeesAgain] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
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
  const meta = route?.params?.meta;
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
  const isBatchTransaction = fromScreen === 'BatchTransaction';

  const isDeactivateStaking = route?.params?.isDeactivateStaking;
  const isWithdrawStaking = route?.params?.isWithdrawStaking;
  const isStakingRewards = route?.params?.isStakingRewards;
  const isCreateStaking = route?.params?.isCreateStaking;
  const isCreateVote = route?.params?.isCreateVote;

  const chainName = isExchangeScreen
    ? selectedFromAsset?.chain_name
    : transferData?.currentCoin?.chain_name;

  const convertedChainName = isEVMChain(chainName) ? 'ethereum' : chainName;

  const feesOptions = useSelector(getTransferDataFeesOptions);
  const [customNonce, setCustomNonce] = useState('');
  const advancedOptionsSheetRef = useRef(null);

  const nativeBalanceForBatchTransactions = useMemo(() => {
    if (isBatchTransaction && transferData?.transactionsData?.length) {
      const totalBN = transferData?.transactionsData?.reduce((sum, item) => {
        if (item?.coinInfo?.type === 'coin') {
          return sum.plus(new BigNumber(item.transferData?.amount || '0'));
        }
        return sum;
      }, new BigNumber(0));
      return totalBN.toString();
    }
    return null;
  }, [isBatchTransaction, transferData?.transactionsData]);

  useEffect(() => {
    if (feesOptions?.[0]?.gasPrice) {
      setCustomFees(feesOptions?.[0]?.gasPrice);
    }
  }, [feesOptions]);

  useEffect(() => {
    if (transferData?.nonce !== undefined && transferData?.nonce !== null) {
      setCustomNonce(String(transferData.nonce));
    }
  }, [transferData?.nonce]);

  const openAdvancedOptionsSheet = useCallback(() => {
    advancedOptionsSheetRef.current?.present();
  }, []);

  const onChangeCustomNonce = text => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setCustomNonce(numericValue);
  };

  const onSelectFeesType = useCallback(
    (type, gasPrice) => {
      if (type === 'custom') {
        isPauseCalculateFees.current = true;
        setSelectedFeesType('custom');
        selectedFeesTypeRef.current = 'custom';
      } else {
        isPauseCalculateFees.current = false;
        setSelectedFeesType(type);
        selectedFeesTypeRef.current = type;
        if (gasPrice) {
          dispatch(updateFees({gasPrice, convertedChainName}));
        }
      }
    },
    [dispatch, convertedChainName],
  );

  const getSelectedFeesLabel = useMemo(() => {
    if (selectedFeesType === 'custom') {
      return `Custom: ${customFees} ${
        GAS_CURRENCY[convertedChainName] || 'Gwei'
      }`;
    }
    const selectedOption = feesOptions?.find(
      opt => opt?.title?.toLowerCase() === selectedFeesType?.toLowerCase(),
    );
    if (selectedOption) {
      return `${selectedOption.title}: ${selectedOption.gasPrice} ${
        GAS_CURRENCY[convertedChainName] || 'Gwei'
      }`;
    }
    return 'Recommended';
  }, [selectedFeesType, customFees, feesOptions, convertedChainName]);

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
        : isBatchTransaction
        ? 'Confirm Batch Transaction'
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
        isStakingScreen ||
        isBatchTransaction) &&
        feeSuccess)
    ) {
      setIsFetchedSuccessful('true');
      let timeout = setInterval(() => {
        if (!isFetchingRef.current && !isPauseCalculateFees.current) {
          setIsFetchingFeesAgain(true);

          isFetchingRef.current = true;

          dispatch(
            calculateEstimateFee({
              isFetchNonce: false,
              existingNonce: transferData?.nonce,
              fromAddress:
                isSendFundScreen ||
                isStakingScreen ||
                isSellCryptoScreen ||
                isBatchTransaction
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
              isBatchTransaction,
              isSwapFee: isExchangeScreen,
              currentCoin: isBatchTransaction
                ? transferData?.currentCoin
                : null,
              calls: isBatchTransaction ? transferData?.calls : null,
              isCreateStaking: isCreateStaking,
              isWithdrawStaking: !!isWithdrawStaking,
              isStakingRewards: !!isStakingRewards,
              isDeactivateStaking: !!isDeactivateStaking,
              stakingProviderName:
                isCreateStaking || isDeactivateStaking || isStakingRewards
                  ? transferData?.stakingProviderName
                  : null,
              tokenDecimals: isStakingScreen
                ? transferData?.currentCoin?.decimal
                : null,
              isMaxCheckbox: isDeactivateStaking
                ? transferData?.isMaxCheckbox
                : null,
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

  useEffect(() => {
    const validateDuplicateTransaction = () => {
      const failedTimestamp = failedTransaction?.timestamp;
      if (
        failedTimestamp &&
        dayjs().diff(dayjs(failedTimestamp), 'minutes') < 5
      ) {
        const currentFrom =
          isSendFundScreen ||
          isStakingScreen ||
          isSellCryptoScreen ||
          isBatchTransaction
            ? transferData?.currentCoin?.address
            : isExchangeScreen
            ? selectedFromAsset?.address
            : transferData?.selectedNFT?.coin?.address;
        const currentTo = transferData.toAddress;
        const currentAmount =
          isSendFundScreen || isStakingScreen || isSellCryptoScreen
            ? transferData?.amount
            : isExchangeScreen
            ? amountFrom
            : '0';
        const currentContractAddress = isSendNFT
          ? transferData?.selectedNFT?.token_address ||
            transferData?.selectedNFT?.associatedTokenAddress
          : transferData?.currentCoin?.contractAddress;

        const currentChainName = transferData?.currentCoin?.chain_name;
        const currentSymbol = transferData?.currentCoin?.symbol;
        const currentCalls = transferData?.calls;
        if (
          currentFrom === failedTransaction?.fromAddress &&
          currentTo === failedTransaction?.toAddress &&
          currentAmount === failedTransaction?.amount &&
          currentContractAddress === failedTransaction?.contractAddress &&
          currentChainName === failedTransaction?.chain_name &&
          currentSymbol === failedTransaction?.symbol &&
          currentCalls?.toString() === failedTransaction?.calls?.toString()
        ) {
          setShowDuplicateModal(true);
        }
      }
    };
    validateDuplicateTransaction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitTransferData = useCallback(async () => {
    if (isExchangeScreen && isEVMChain(selectedFromAsset?.chain_name)) {
      return await dispatch(
        sendSwap({nonce: customNonce, navigation}),
      ).unwrap();
    }
    return await dispatch(
      sendFunds({
        to: transferData.toAddress,
        memo: transferData.memo,
        nonce: customNonce,
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
        isBatchTransaction,
        calls: isBatchTransaction ? transferData?.calls : null,
        transactionsData: isBatchTransaction
          ? transferData?.transactionsData
          : null,
        from:
          isStakingScreen ||
          isSendNFT ||
          isVoteStakingScreen ||
          isSellCryptoScreen ||
          isBatchTransaction
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
        stakingProviderName:
          isCreateStaking || isDeactivateStaking || isStakingRewards
            ? transferData?.stakingProviderName
            : null,
        stakingAddress: isStakingScreen ? transferData?.stakingAddress : null,
        numberOfStakeAccount: isStakingScreen
          ? transferData?.currentCoin?.staking?.length || 0
          : null,
        validatorName: isStakingScreen ? transferData?.validatorName : null,
        displayValidators: isVoteStakingScreen
          ? transferData?.displayValidators
          : null,
        nftName: isSendNFT
          ? transferData?.selectedNFT?.name || transferData?.selectedNFT?.symbol
          : null,
        nftTokenId: isSendNFT ? transferData?.selectedNFT?.token_id : null,
        nftImage: isSendNFT ? transferData?.selectedNFT?.metadata?.image : null,
        phrase,
        navigation,
      }),
    ).unwrap();
  }, [
    dispatch,
    selectedFromAsset?.chain_name,
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
    transferData?.calls,
    transferData?.transactionsData,
    transferData?.validatorPubKey,
    transferData?.stakingBalance,
    transferData?.resourceType,
    transferData?.selectedVotes,
    transferData?.stakingProviderName,
    transferData?.stakingAddress,
    transferData?.validatorName,
    transferData?.displayValidators,
    transferData?.selectedNFT?.name,
    transferData?.selectedNFT?.symbol,
    transferData?.selectedNFT?.metadata?.image,
    customNonce,
    isSendFundScreen,
    isStakingScreen,
    isSellCryptoScreen,
    isExchangeScreen,
    amountFrom,
    selectedFromWallet,
    isSendNFT,
    currentWallet,
    isBatchTransaction,
    isVoteStakingScreen,
    isWithdrawStaking,
    isStakingRewards,
    isCreateStaking,
    isCreateVote,
    isDeactivateStaking,
    phrase,
    navigation,
  ]);

  const onSuccess = useCallback(async () => {
    setShowConfirmModal(false);
    await delay(300);
    if (isExchangeScreen && transferData?.swapData) {
      await dispatch(calculateExchange())
        .unwrap()
        .catch(() => {});
    }
    const data = await submitTransferData();
    if (redirect_url && data?.tx_hash) {
      try {
        await handleTransferRedirect(
          redirect_url,
          data?.tx_hash,
          data?.status,
          meta,
        );
      } catch (error) {
        console.error('Failed to open redirect URL:', error);
      }
    }
  }, [
    dispatch,
    isExchangeScreen,
    meta,
    redirect_url,
    submitTransferData,
    transferData?.swapData,
  ]);

  const handleSubmitForm = () => {
    setShowConfirmModal(true);
    isPauseCalculateFees.current = true;
  };
  const isDisabled = isBalanceNotAvailable(
    transferData?.selectedUTXOsValue || balance,
    transferData?.transactionFee,
    isExchangeScreen && selectedFromAsset?.type === 'coin'
      ? amountFrom
      : isBatchTransaction
      ? nativeBalanceForBatchTransactions
      : null,
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

  const renderBatchTransactionUI = () => {
    const batchTransactions = Array.isArray(transferData?.transactionsData)
      ? transferData?.transactionsData
      : [];

    return (
      <View style={styles.formInput}>
        {batchTransactions?.map((item, index) => (
          <BatchTransactionItem
            key={`batch_transaction_${index}`}
            item={item}
            isSelected={false}
            isSelectionMode={false}
            localCurrency={localCurrency}
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
                : isBatchTransaction
                ? renderBatchTransactionUI()
                : renderVotingUI()}
              {/* Advanced Options Card */}
              {isFeesOptionChain(convertedChainName) &&
                !!feesOptions?.length &&
                !isExchangeScreen && (
                  <TouchableOpacity
                    style={styles.advancedOptionsCard}
                    onPress={openAdvancedOptionsSheet}
                    activeOpacity={0.7}>
                    <View style={styles.advancedOptionsCardLeft}>
                      <MaterialCommunityIcons
                        name="tune-vertical"
                        size={22}
                        color={theme.background}
                      />
                      <View style={styles.advancedOptionsCardContent}>
                        <Text style={styles.advancedOptionsCardTitle}>
                          Advanced Options
                        </Text>
                        <View style={styles.advancedOptionsCardDetails}>
                          {!!feesOptions?.length && (
                            <View style={styles.advancedOptionsCardRow}>
                              <MaterialCommunityIcons
                                name="gas-station"
                                size={14}
                                color={theme.gray}
                              />
                              <Text style={styles.advancedOptionsCardValue}>
                                {getSelectedFeesLabel}
                              </Text>
                            </View>
                          )}
                          {isEVMChain(convertedChainName) && (
                            <View style={styles.advancedOptionsCardRow}>
                              <MaterialCommunityIcons
                                name="counter"
                                size={14}
                                color={theme.gray}
                              />
                              <Text style={styles.advancedOptionsCardValue}>
                                Nonce:{' '}
                                {customNonce || transferData?.nonce || '0'}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    <ChevronIcon width={20} height={20} fill={theme.gray} />
                  </TouchableOpacity>
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
      <DuplicateTransactionModal
        visible={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
      />

      {/* Advanced Options Bottom Sheet */}
      <AdvancedFeesSheet
        ref={advancedOptionsSheetRef}
        feesOptions={feesOptions}
        selectedFeesType={selectedFeesType}
        customFees={customFees}
        customNonce={customNonce}
        chainName={convertedChainName}
        gasCurrency={GAS_CURRENCY[convertedChainName] || 'Gwei'}
        onSelectFeesType={onSelectFeesType}
        onChangeCustomFees={onChangeCustomFees}
        onChangeCustomNonce={onChangeCustomNonce}
      />
    </DokSafeAreaView>
  );
};

export default Transfer;
