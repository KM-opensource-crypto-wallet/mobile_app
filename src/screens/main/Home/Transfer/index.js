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
  getTransferDataCustomErrorCode,
  getTransferDataFeeSuccess,
  getTransferDataLoading,
  getTransferDataSubmitting,
} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSelector';
import {
  isBalanceNotAvailable,
  delay,
  getCustomizePublicAddress,
  isCustomAddressNotSupportedChain,
  isEVMChain,
  isFeesOptionChain,
  isSponsoredGasChain,
  getSponsoredGasTokenSymbol,
  SPONSOR_EMPTY_CODE,
} from 'dok-wallet-blockchain-networks/helper';
import useAdvancedFees from 'hooks/useAdvancedFees';
import SponsoredGasToggle from 'components/SponsoredGasToggle';
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
  setCurrentTransferData,
} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSlice';
import ScurvedIcon from 'assets/images/icons/S-curved.svg';
import {
  selectExchangeAmountFrom,
  selectExchangeAmountTo,
  selectExchangeFromAsset,
  selectExchangeFromWallet,
  selectExchangeLoading,
  selectExchangeToAddress,
  selectExchangeToAsset,
  selectExchangeToName,
  selectSelectedExchangeChain,
} from 'dok-wallet-blockchain-networks/redux/exchange/exchangeSelectors';
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

// Single source of truth for the per-mode values that the estimate-fee poll,
// sendFunds submit, duplicate-transaction check and fiat display all read.
// Divergent fields are paired (…ForEstimate / …ForSend) because the two
// payloads intentionally differ per mode; each pair notes the inline site it
// reproduces.
const buildTransferContext = ({
  transferData,
  flags,
  selectedFromAsset,
  selectedFromWallet,
  amountFrom,
  currentWallet,
}) => {
  const {
    isSendFundScreen,
    isExchangeScreen,
    isSendNFT,
    isStakingScreen,
    isVoteStakingScreen,
    isSellCryptoScreen,
    isBatchTransaction,
  } = flags;
  return {
    // fromAddress of the estimate-fee poll payload
    fromForEstimate:
      isSendFundScreen ||
      isStakingScreen ||
      isSellCryptoScreen ||
      isBatchTransaction
        ? transferData?.currentCoin?.address
        : isExchangeScreen
        ? selectedFromAsset?.address
        : transferData?.selectedNFT?.coin?.address,
    // `from` of the sendFunds payload (mode set differs from fromForEstimate)
    fromForSend:
      isStakingScreen ||
      isSendNFT ||
      isVoteStakingScreen ||
      isSellCryptoScreen ||
      isBatchTransaction
        ? transferData?.currentCoin?.address
        : null,
    // `amount` of the estimate-fee poll payload
    amountForEstimate:
      isSendFundScreen || isStakingScreen || isSellCryptoScreen
        ? transferData?.amount
        : isExchangeScreen
        ? amountFrom
        : null,
    // `amount` of the sendFunds payload (same ternary, but falls back to '0')
    amountForSend:
      isSendFundScreen || isStakingScreen || isSellCryptoScreen
        ? transferData?.amount
        : isExchangeScreen
        ? amountFrom
        : '0',
    // `contractAddress` of the estimate-fee poll payload
    contractAddressForEstimate: isSendNFT
      ? transferData?.selectedNFT?.token_address ||
        transferData?.selectedNFT?.associatedTokenAddress
      : transferData?.currentCoin?.contractAddress,
    // `contractAddress` of the sendFunds payload (non-NFT modes send null)
    contractAddressForSend: isSendNFT
      ? transferData?.selectedNFT?.token_address ||
        transferData?.selectedNFT?.associatedTokenAddress
      : null,
    // `tokenAmount` of the estimate-fee poll payload (defaults to 1)
    nftTokenAmountForEstimate: transferData?.selectedNFT?.amount || 1,
    // `tokenAmount` of the sendFunds payload (no default)
    nftTokenAmountForSend: transferData?.selectedNFT?.amount,
    // poll `selectedWallet` == sendFunds `currentWallet`
    walletForTx: isExchangeScreen
      ? selectedFromWallet
      : isSendNFT
      ? currentWallet
      : null,
    // `selectedCoin` of the estimate-fee poll payload
    coinForEstimate: isExchangeScreen
      ? selectedFromAsset
      : isSendNFT
      ? transferData?.currentCoin
      : null,
    // currencyRate of the fiat total block
    currencyRateForFiat:
      (isSendFundScreen || isStakingScreen
        ? transferData?.currentCoin?.currencyRate
        : isExchangeScreen
        ? selectedFromAsset?.currencyRate
        : '0') || '0',
    // Shared plain fields both payloads read verbatim.
    nonce: transferData?.nonce,
    estimateGas: transferData?.estimateGas,
    toAddress: transferData?.toAddress,
    memo: transferData?.memo,
    balance: transferData?.currentCoin?.totalAmount,
    currentCoin: transferData?.currentCoin,
    contract_type: transferData?.selectedNFT?.contract_type,
    mint: transferData?.selectedNFT?.mint,
    tokenId: transferData?.selectedNFT?.token_id,
    validatorPubKey: transferData?.validatorPubKey,
    stakingBalance: transferData?.stakingBalance,
    resourceType: transferData?.resourceType,
    stakingAddress: transferData?.stakingAddress,
    stakingProviderName: transferData?.stakingProviderName,
    tokenDecimals: transferData?.currentCoin?.decimal,
    isMaxCheckbox: transferData?.isMaxCheckbox,
    selectedVotes: transferData?.selectedVotes,
    calls: transferData?.calls,
    transactionsData: transferData?.transactionsData,
    numberOfStakeAccount: transferData?.currentCoin?.staking?.length || 0,
    validatorName: transferData?.validatorName,
    displayValidators: transferData?.displayValidators,
    nftName:
      transferData?.selectedNFT?.name || transferData?.selectedNFT?.symbol,
    nftTokenId: transferData?.selectedNFT?.token_id,
    nftImage: transferData?.selectedNFT?.metadata?.image,
    chainName: transferData?.currentCoin?.chain_name,
    symbol: transferData?.currentCoin?.symbol,
  };
};

// Payload of the 10s calculateEstimateFee poll. Nonce/estimateGas come from
// the context (carried fresh through transferContextRef) instead of a stale
// transferData closure.
const buildEstimateFeePayload = (ctx, flags, {feesType}) => ({
  isFetchNonce: false,
  existingNonce: ctx.nonce,
  fromAddress: ctx.fromForEstimate,
  toAddress: ctx.toAddress,
  memo: ctx.memo,
  amount: ctx.amountForEstimate,
  contractAddress: ctx.contractAddressForEstimate,
  balance: ctx.balance,
  selectedWallet: ctx.walletForTx,
  selectedCoin: ctx.coinForEstimate,
  contract_type: flags.isSendNFT ? ctx.contract_type : null,
  isNFT: flags.isSendNFT,
  mint: flags.isSendNFT ? ctx.mint : null,
  tokenId: flags.isSendNFT ? ctx.tokenId : null,
  tokenAmount: flags.isSendNFT ? ctx.nftTokenAmountForEstimate : null,
  validatorPubKey: flags.isStakingScreen ? ctx.validatorPubKey : null,
  stakingBalance: flags.isStakingScreen ? ctx.stakingBalance : null,
  resourceType: flags.isStakingScreen ? ctx.resourceType : null,
  stakingAddress: flags.isStakingScreen ? ctx.stakingAddress : null,
  selectedVotes: flags.isVoteStakingScreen ? ctx.selectedVotes : null,
  isBatchTransaction: flags.isBatchTransaction,
  isExchange: flags.isExchangeScreen,
  currentCoin: flags.isBatchTransaction ? ctx.currentCoin : null,
  calls: flags.isBatchTransaction ? ctx.calls : null,
  isCreateStaking: flags.isCreateStaking,
  isWithdrawStaking: !!flags.isWithdrawStaking,
  isStakingRewards: !!flags.isStakingRewards,
  isDeactivateStaking: !!flags.isDeactivateStaking,
  stakingProviderName:
    flags.isCreateStaking || flags.isDeactivateStaking || flags.isStakingRewards
      ? ctx.stakingProviderName
      : null,
  tokenDecimals: flags.isStakingScreen ? ctx.tokenDecimals : null,
  isMaxCheckbox: flags.isDeactivateStaking ? ctx.isMaxCheckbox : null,
  feesType,
  estimateGas: ctx.estimateGas,
});

// Payload of the sendFunds submit.
const buildSendFundsPayload = (ctx, flags, {nonce, phrase, navigation}) => ({
  to: ctx.toAddress,
  memo: ctx.memo,
  nonce,
  amount: ctx.amountForSend,
  currentCoin: ctx.currentCoin,
  currentWallet: ctx.walletForTx,
  balance: ctx.balance,
  isExchange: flags.isExchangeScreen,
  contract_type: flags.isSendNFT ? ctx.contract_type : null,
  tokenId: flags.isSendNFT ? ctx.tokenId : null,
  tokenAmount: flags.isSendNFT ? ctx.nftTokenAmountForSend : null,
  contractAddress: ctx.contractAddressForSend,
  mint: flags.isSendNFT ? ctx.mint : null,
  isNFT: flags.isSendNFT,
  isBatchTransaction: flags.isBatchTransaction,
  calls: flags.isBatchTransaction ? ctx.calls : null,
  transactionsData: flags.isBatchTransaction ? ctx.transactionsData : null,
  from: ctx.fromForSend,
  validatorPubKey: flags.isStakingScreen ? ctx.validatorPubKey : null,
  isWithdrawStaking: !!flags.isWithdrawStaking,
  isStakingRewards: !!flags.isStakingRewards,
  isCreateStaking: flags.isCreateStaking,
  stakingBalance: flags.isStakingScreen ? ctx.stakingBalance : null,
  resourceType: flags.isStakingScreen ? ctx.resourceType : null,
  selectedVotes: flags.isVoteStakingScreen ? ctx.selectedVotes : null,
  isCreateVote: !!flags.isCreateVote,
  isDeactivateStaking: !!flags.isDeactivateStaking,
  stakingProviderName:
    flags.isCreateStaking || flags.isDeactivateStaking || flags.isStakingRewards
      ? ctx.stakingProviderName
      : null,
  stakingAddress: flags.isStakingScreen ? ctx.stakingAddress : null,
  numberOfStakeAccount: flags.isStakingScreen ? ctx.numberOfStakeAccount : null,
  validatorName: flags.isStakingScreen ? ctx.validatorName : null,
  displayValidators: flags.isVoteStakingScreen ? ctx.displayValidators : null,
  nftName: flags.isSendNFT ? ctx.nftName : null,
  nftTokenId: flags.isSendNFT ? ctx.nftTokenId : null,
  nftImage: flags.isSendNFT ? ctx.nftImage : null,
  phrase,
  navigation,
});

const InfoRow = ({styles, label, value, valueStyle, numberOfLines}) => (
  <View style={styles.itemView}>
    <Text style={styles.title} numberOfLines={numberOfLines}>
      {label}
    </Text>
    <Text style={valueStyle || styles.boxBalance} numberOfLines={numberOfLines}>
      {value}
    </Text>
  </View>
);

// On EIP-1559 chains `fee` is the reserved maximum (gasLimit * maxFeePerGas);
// what the sender actually pays is `estimatedFee` (gasLimit * (baseFee + tip)).
// Non-1559 chains pay `fee` in full, so only that single row is shown. The
// per-gas parameters (max fee, priority fee) are edited in AdvancedFeesSheet.
const FeeSummaryBox = ({
  styles,
  isRefreshing,
  fee,
  feeSymbol,
  maxTotalDisplay,
  isEip1559,
  estimatedFee,
  children,
}) => {
  const formatFee = value =>
    isRefreshing ? 'Refreshing' : `${value || '0'} ${feeSymbol}`;
  return (
    <View style={styles.box}>
      {children}
      {isEip1559 ? (
        <>
          <InfoRow
            styles={styles}
            label={'Estimated Fee'}
            value={formatFee(estimatedFee ?? fee)}
          />
          <InfoRow styles={styles} label={'Max Fee'} value={formatFee(fee)} />
        </>
      ) : (
        <InfoRow styles={styles} label={'Network Fee'} value={formatFee(fee)} />
      )}
      {maxTotalDisplay != null && (
        <InfoRow styles={styles} label={'Max Total'} value={maxTotalDisplay} />
      )}
    </View>
  );
};

const TransferDetailsBox = ({styles, transferData, chainName, children}) => (
  <View style={styles.box}>
    <InfoRow
      styles={styles}
      label={'Chain'}
      value={transferData?.currentCoin?.chain_display_name}
    />
    <InfoRow
      styles={styles}
      label={'Asset'}
      value={`${transferData?.currentCoin?.name} (${transferData?.currentCoin?.symbol})`}
    />
    <InfoRow
      styles={styles}
      label={'From'}
      value={`${
        isCustomAddressNotSupportedChain(chainName)
          ? transferData?.currentCoin?.address
          : getCustomizePublicAddress(transferData?.currentCoin?.address)
      }`}
    />
    <InfoRow
      styles={styles}
      label={'To'}
      value={`${
        isCustomAddressNotSupportedChain(chainName)
          ? transferData?.toAddress
          : getCustomizePublicAddress(transferData?.toAddress)
      }`}
    />
    {!!transferData?.validName && (
      <InfoRow styles={styles} label={'DNS'} value={transferData?.validName} />
    )}
    {!!transferData?.memo && (
      <InfoRow styles={styles} label={'Memo'} value={transferData?.memo} />
    )}
    {children}
  </View>
);

const Transfer = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const localCurrency = useSelector(getLocalCurrency);
  const transferData = useSelector(getTransferData);
  const isSubmitting = useSelector(getTransferDataSubmitting);
  const isLoading = useSelector(getTransferDataLoading);
  const feeSuccess = useSelector(getTransferDataFeeSuccess);
  const customError = useSelector(getTransferDataCustomError);
  const customErrorCode = useSelector(getTransferDataCustomErrorCode);
  const balance = useSelector(getBalanceForNativeCoin);
  const phrase = useSelector(getCurrentWalletPhrase);
  const failedTransaction = useSelector(getFailedTransaction);
  const sellCryptoRequestDetails = useSelector(getSellCryptoRequestDetails);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isFetchingFeesAgain, setIsFetchingFeesAgain] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const isFetchingRef = useRef(false);
  const isPauseCalculateFees = useRef(false);
  const [estimateStatus, setEstimateStatus] = useState('pending'); // 'pending' | 'success' | 'failed'
  const floatingHeight = useFloatingHeight();
  const dispatch = useDispatch();
  const currentWallet = useSelector(selectCurrentWallet);
  const fromScreen = route?.params?.fromScreen;
  const redirect_url = route?.params?.redirect_url;
  const meta = route?.params?.meta;
  const selectedFromAsset = useSelector(selectExchangeFromAsset);
  const selectedFromWallet = useSelector(selectExchangeFromWallet);
  const selectedToAsset = useSelector(selectExchangeToAsset);
  const amountFrom = useSelector(selectExchangeAmountFrom);
  const amountTo = useSelector(selectExchangeAmountTo);
  const isExchangeLoading = useSelector(selectExchangeLoading);
  const exchangeToName = useSelector(selectExchangeToName);
  const exchangeToAddress = useSelector(selectExchangeToAddress);
  const selectedExchangeChain = useSelector(selectSelectedExchangeChain);
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

  const flags = useMemo(
    () => ({
      isSendFundScreen,
      isExchangeScreen,
      isSendNFT,
      isStakingScreen,
      isVoteStakingScreen,
      isSellCryptoScreen,
      isBatchTransaction,
      isCreateStaking,
      isWithdrawStaking,
      isDeactivateStaking,
      isStakingRewards,
      isCreateVote,
    }),
    [
      isSendFundScreen,
      isExchangeScreen,
      isSendNFT,
      isStakingScreen,
      isVoteStakingScreen,
      isSellCryptoScreen,
      isBatchTransaction,
      isCreateStaking,
      isWithdrawStaking,
      isDeactivateStaking,
      isStakingRewards,
      isCreateVote,
    ],
  );

  const transferContext = useMemo(
    () =>
      buildTransferContext({
        transferData,
        flags,
        selectedFromAsset,
        selectedFromWallet,
        amountFrom,
        currentWallet,
      }),
    [
      transferData,
      flags,
      selectedFromAsset,
      selectedFromWallet,
      amountFrom,
      currentWallet,
    ],
  );
  // Fresh context for long-lived closures (the 10s poll interval).
  const transferContextRef = useRef();
  transferContextRef.current = transferContext;

  const quoteExpiresAt = useMemo(() => {
    if (transferData?.payGasWithToken) {
      return transferData?.sponsoredQuote?.expiresAt || null;
    }
    // Quote TTLs only exist for exchange flows. Gating on the screen flag
    // keeps a leftover quote window from a flow that skipped the entry
    // reset from ever blocking a plain send with "Quote expired".
    if (!flags.isExchangeScreen) {
      return null;
    }
    const created = transferData?.quoteCreatedAt;
    const ttl = transferData?.quoteTtlSeconds;
    return created && ttl ? created + ttl * 1000 : null;
  }, [
    flags.isExchangeScreen,
    transferData?.payGasWithToken,
    transferData?.sponsoredQuote?.expiresAt,
    transferData?.quoteCreatedAt,
    transferData?.quoteTtlSeconds,
  ]);
  const [isQuoteExpired, setIsQuoteExpired] = useState(false);
  const isQuoteExpiredRef = useRef(false);

  useEffect(() => {
    if (!quoteExpiresAt) {
      isQuoteExpiredRef.current = false;
      setIsQuoteExpired(false);
      return;
    }
    const remaining = quoteExpiresAt - Date.now();
    if (remaining <= 0) {
      isQuoteExpiredRef.current = true;
      setIsQuoteExpired(true);
      return;
    }
    isQuoteExpiredRef.current = false;
    setIsQuoteExpired(false);
    const timer = setTimeout(() => {
      isQuoteExpiredRef.current = true;
      setIsQuoteExpired(true);
    }, remaining);
    return () => {
      clearTimeout(timer);
    };
  }, [quoteExpiresAt]);

  const chainName = isExchangeScreen
    ? selectedFromAsset?.chain_name
    : transferData?.currentCoin?.chain_name;

  const convertedChainName = isEVMChain(chainName) ? 'ethereum' : chainName;

  const {
    sheetProps: advancedFeesSheetProps,
    feesOptions,
    isEip1559,
    selectedFeesTypeRef,
    selectedFeesLabel,
    customNonce,
    finalNonce,
    isCustomFeesValid,
  } = useAdvancedFees({chainName, convertedChainName, isPauseCalculateFees});
  const advancedOptionsSheetRef = useRef(null);

  const sponsoredGasCoins = useMemo(() => {
    if (!isSponsoredGasChain(chainName)) {
      return [];
    }
    const items = isBatchTransaction
      ? transferData?.transactionsData?.map(item => item?.coinInfo)
      : [transferData?.currentCoin];
    if (!items?.length || items.some(item => !item?.contractAddress)) {
      return [];
    }
    return (currentWallet?.coins ?? [])
      .filter(
        coin =>
          coin?.chain_name === chainName &&
          Number(coin?.totalAmount) > 0 &&
          getSponsoredGasTokenSymbol(chainName, coin?.contractAddress),
      )
      .map(coin => ({
        symbol: getSponsoredGasTokenSymbol(chainName, coin?.contractAddress),
        contractAddress: coin?.contractAddress,
      }));
  }, [
    chainName,
    isBatchTransaction,
    transferData?.transactionsData,
    transferData?.currentCoin,
    currentWallet?.coins,
  ]);

  const payGasWithToken = !!transferData?.payGasWithToken;
  const payGasWithTokenRef = useRef(payGasWithToken);
  payGasWithTokenRef.current = payGasWithToken;
  const activeGasToken = useMemo(
    () =>
      sponsoredGasCoins.find(
        item => item.symbol === transferData?.gasTokenSymbol,
      ) || sponsoredGasCoins[0],
    [sponsoredGasCoins, transferData?.gasTokenSymbol],
  );

  const requoteSponsoredGas = useCallback(() => {
    setIsFetchingFeesAgain(true);
    isFetchingRef.current = true;
    dispatch(
      calculateEstimateFee(
        buildEstimateFeePayload(transferContextRef.current, flags, {
          feesType: selectedFeesTypeRef.current,
        }),
      ),
    )
      .unwrap()
      .then(resp => {
        setIsFetchingFeesAgain(false);
        isFetchingRef.current = false;
        setEstimateStatus(resp ? 'success' : 'failed');
      })
      .catch(() => {
        setIsFetchingFeesAgain(false);
        isFetchingRef.current = false;
        setEstimateStatus('failed');
      });
  }, [dispatch, flags, selectedFeesTypeRef]);

  const onToggleSponsoredGas = useCallback(() => {
    const next = !payGasWithToken;
    if (next) {
      isPauseCalculateFees.current = false;
    }
    dispatch(
      setCurrentTransferData({
        payGasWithToken: next,
        gasTokenSymbol: next ? activeGasToken?.symbol : null,
        gasTokenContractAddress: next ? activeGasToken?.contractAddress : null,
        sponsoredQuote: null,
      }),
    );
    requoteSponsoredGas();
  }, [dispatch, payGasWithToken, activeGasToken, requoteSponsoredGas]);

  const onSelectGasToken = useCallback(
    symbol => {
      const picked = sponsoredGasCoins.find(item => item.symbol === symbol);
      if (!picked) {
        return;
      }
      dispatch(
        setCurrentTransferData({
          gasTokenSymbol: picked.symbol,
          gasTokenContractAddress: picked.contractAddress,
          sponsoredQuote: null,
        }),
      );
      requoteSponsoredGas();
    },
    [dispatch, sponsoredGasCoins, requoteSponsoredGas],
  );

  const isFetchingSponsoredQuote =
    payGasWithToken && !transferData?.sponsoredQuote;

  const sponsoredFeeSymbol =
    payGasWithToken && activeGasToken
      ? activeGasToken.symbol
      : transferData?.currentCoin?.chain_symbol;

  const sponsoredGasToggle = activeGasToken ? (
    <SponsoredGasToggle
      tokenSymbol={activeGasToken.symbol}
      checked={payGasWithToken}
      onToggle={onToggleSponsoredGas}
    />
  ) : null;

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

  const openAdvancedOptionsSheet = useCallback(() => {
    advancedOptionsSheetRef.current?.present();
  }, []);

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

  // Latch the render/poll state machine on the first successful estimate.
  // Transfer can mount while the first estimate is still in flight, so this
  // fires whenever feeSuccess arrives rather than at mount.
  useEffect(() => {
    if (feeSuccess) {
      setEstimateStatus('success');
    }
  }, [feeSuccess]);

  useEffect(() => {
    // VoteStaking was never part of the polling mode set — keep it out so
    // its one-shot estimate isn't re-run every 10s.
    if (estimateStatus === 'success' && !isVoteStakingScreen) {
      let interval = setInterval(() => {
        if (
          !isFetchingRef.current &&
          !isPauseCalculateFees.current &&
          (!isQuoteExpiredRef.current || payGasWithTokenRef.current)
        ) {
          setIsFetchingFeesAgain(true);

          isFetchingRef.current = true;

          dispatch(
            calculateEstimateFee(
              buildEstimateFeePayload(transferContextRef.current, flags, {
                feesType: selectedFeesTypeRef.current,
              }),
            ),
          )
            .unwrap()
            .then(resp => {
              setIsFetchingFeesAgain(false);
              isFetchingRef.current = false;
              setEstimateStatus(resp ? 'success' : 'failed');
            })
            .catch(() => {
              // calculateEstimateFee rethrows expired-quote errors; the slice
              // already set customError, so flipping estimateStatus swaps the
              // form for that message. Reset the in-flight flags or polling
              // would stop permanently.
              setIsFetchingFeesAgain(false);
              isFetchingRef.current = false;
              setEstimateStatus('failed');
            });
        }
      }, 10000);
      return () => {
        clearInterval(interval);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimateStatus]);

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
        const currentFrom = transferContext.fromForEstimate;
        const currentTo = transferContext.toAddress;
        const currentAmount = transferContext.amountForSend;
        const currentContractAddress =
          transferContext.contractAddressForEstimate;

        const currentChainName = transferContext.chainName;
        const currentSymbol = transferContext.symbol;
        const currentCalls = transferContext.calls;
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
    return await dispatch(
      sendFunds(
        buildSendFundsPayload(transferContext, flags, {
          nonce: finalNonce,
          phrase,
          navigation,
        }),
      ),
    ).unwrap();
  }, [dispatch, transferContext, flags, finalNonce, phrase, navigation]);

  const onSuccess = useCallback(async () => {
    setShowConfirmModal(false);
    await delay(300);
    try {
      // Recompute expiry rather than trusting the timer: the app may have
      // been backgrounded past the deadline while the modal was open.
      if (quoteExpiresAt && Date.now() >= quoteExpiresAt) {
        isQuoteExpiredRef.current = true;
        setIsQuoteExpired(true);
        return;
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
    } finally {
      // Resume fee polling after a failed/expired send; a successful send
      // navigates away and unmounts anyway.
      isPauseCalculateFees.current = false;
    }
  }, [meta, redirect_url, submitTransferData, quoteExpiresAt]);

  const handleSubmitForm = () => {
    // The sheet can be swipe-dismissed with an invalid tip, so re-check here.
    if (!isCustomFeesValid) {
      return;
    }
    if (quoteExpiresAt && Date.now() >= quoteExpiresAt) {
      isQuoteExpiredRef.current = true;
      setIsQuoteExpired(true);
      return;
    }
    setShowConfirmModal(true);
    isPauseCalculateFees.current = true;
  };
  const isDisabled = payGasWithToken
    ? isBalanceNotAvailable(
        transferData?.currentCoin?.totalAmount,
        transferData?.transactionFee,
        isSendFundScreen ? transferData?.amount : null,
      )
    : isBalanceNotAvailable(
        transferData?.selectedUTXOsValue || balance,
        transferData?.transactionFee,
        isExchangeScreen && selectedFromAsset?.type === 'coin'
          ? amountFrom
          : isBatchTransaction
          ? nativeBalanceForBatchTransactions
          : null,
      );

  const feeSummaryProps = {
    styles,
    isRefreshing: isFetchingFeesAgain,
    fee: transferData?.transactionFee,
    feeSymbol: sponsoredFeeSymbol,
    isEip1559,
    estimatedFee: transferData?.estimatedFee,
  };

  const currencyRate = transferContext.currencyRateForFiat;
  const amount = transferContext.amountForSend || '0';
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
        <TransferDetailsBox
          styles={styles}
          transferData={transferData}
          chainName={chainName}
        />
        <FeeSummaryBox
          {...feeSummaryProps}
          maxTotalDisplay={`${currencySymbol[localCurrency]}${totalValue || 0}`}
          children={sponsoredGasToggle}
        />
      </View>
    );
  };

  const renderSellCryptoUI = () => {
    return (
      <View style={styles.formInput}>
        <Text style={styles.amountTitle}>{`-${transferData?.amount || 0} ${
          transferData?.currentCoin?.symbol || ''
        }`}</Text>
        <TransferDetailsBox
          styles={styles}
          transferData={transferData}
          chainName={chainName}>
          <InfoRow
            styles={styles}
            label={'Provider'}
            value={sellCryptoRequestDetails?.providerDisplayName}
          />
        </TransferDetailsBox>
        <FeeSummaryBox
          {...feeSummaryProps}
          maxTotalDisplay={`${currencySymbol[localCurrency]}${totalValue || 0}`}
        />
      </View>
    );
  };

  const renderExchangeUI = () => {
    return (
      <View style={styles.formInput}>
        <View style={styles.box}>
          <InfoRow
            styles={styles}
            label={'Asset'}
            value={`${selectedFromAsset?.name} (${selectedFromAsset?.symbol})`}
          />
          <InfoRow
            styles={styles}
            label={'From'}
            value={`${getCustomizePublicAddress(selectedFromAsset?.address)}`}
          />
          <InfoRow
            styles={styles}
            label={'Chain'}
            value={`${selectedFromAsset?.chain_display_name}`}
          />
          <InfoRow
            styles={styles}
            label={'Pay Amount'}
            value={`${amountFrom} ${selectedFromAsset?.symbol}`}
          />
        </View>
        <View style={styles.iconView}>
          <ScurvedIcon width={25} height={20} stroke={theme.background} />
        </View>
        <View style={[styles.box, {marginTop: 0}]}>
          <InfoRow
            styles={styles}
            label={'Asset'}
            value={`${selectedToAsset?.name} (${selectedToAsset?.symbol})`}
          />
          <InfoRow
            styles={styles}
            label={'To'}
            value={`${getCustomizePublicAddress(exchangeToAddress)}`}
          />
          {!!exchangeToName && (
            <InfoRow styles={styles} label={'DNS'} value={exchangeToName} />
          )}
          <InfoRow
            styles={styles}
            label={'Chain'}
            value={`${selectedToAsset?.chain_display_name}`}
          />
          <InfoRow
            styles={styles}
            label={'Receive Amount'}
            value={`${amountTo} ${selectedToAsset?.symbol}`}
          />
        </View>
        <FeeSummaryBox
          {...feeSummaryProps}
          feeSymbol={selectedFromAsset?.chain_symbol}
          maxTotalDisplay={`${currencySymbol[localCurrency]}${totalValue || 0}`}
          children={
            !!selectedExchangeChain?.providerName && (
              <InfoRow
                styles={styles}
                label={'Exchange Provider'}
                value={selectedExchangeChain?.providerName}
                valueStyle={[styles.boxBalance, {textTransform: 'capitalize'}]}
              />
            )
          }
        />
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
          <InfoRow
            styles={styles}
            label={'Name'}
            value={`${
              transferData?.selectedNFT?.name ||
              transferData?.selectedNFT?.symbol
            } ${
              transferData?.selectedNFT?.token_id
                ? `(${transferData?.selectedNFT?.token_id})`
                : ''
            }`}
          />
          <InfoRow
            styles={styles}
            label={'Chain'}
            value={transferData?.currentCoin?.chain_display_name}
          />
          <InfoRow
            styles={styles}
            label={'From'}
            value={`${getCustomizePublicAddress(
              transferData?.currentCoin?.address,
            )}`}
          />
          <InfoRow
            styles={styles}
            label={'To'}
            value={`${getCustomizePublicAddress(transferData?.toAddress)}`}
          />
          {!!transferData?.validName && (
            <InfoRow
              styles={styles}
              label={'DNS'}
              value={transferData?.validName}
            />
          )}
        </View>
        <FeeSummaryBox {...feeSummaryProps} />
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
          <InfoRow
            styles={styles}
            label={'Chain'}
            value={transferData?.currentCoin?.chain_display_name}
          />
          <InfoRow
            styles={styles}
            label={'Asset'}
            value={`${transferData?.currentCoin?.name} (${transferData?.currentCoin?.symbol})`}
          />
          <InfoRow
            styles={styles}
            label={'From'}
            value={`${getCustomizePublicAddress(
              transferData?.currentCoin?.address,
            )}`}
          />
          {!!transferData?.validatorPubKey && (
            <InfoRow
              styles={styles}
              label={'Validator Address'}
              value={`${getCustomizePublicAddress(
                transferData?.validatorPubKey,
              )}`}
            />
          )}
          {!!transferData?.validatorName && (
            <InfoRow
              styles={styles}
              label={'Validator Name'}
              value={transferData?.validatorName}
              numberOfLines={1}
            />
          )}
          {!!transferData?.resourceType && (
            <InfoRow
              styles={styles}
              label={'Resource Type'}
              value={transferData?.resourceType}
            />
          )}
        </View>
        <FeeSummaryBox
          {...feeSummaryProps}
          maxTotalDisplay={`${currencySymbol[localCurrency]}${totalValue || 0}`}
        />
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
        <FeeSummaryBox {...feeSummaryProps} />
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
        <FeeSummaryBox {...feeSummaryProps} children={sponsoredGasToggle} />
      </View>
    );
  };

  return (
    <DokSafeAreaView style={styles.mainView}>
      {!!isSubmitting && <Spinner />}
      {(isLoading || isExchangeLoading) && !isFetchingFeesAgain ? (
        <Loading />
      ) : feeSuccess || estimateStatus === 'success' ? (
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
              {((isFeesOptionChain(convertedChainName) &&
                !!feesOptions?.length &&
                !payGasWithToken) ||
                (payGasWithToken && sponsoredGasCoins.length > 1)) && (
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
                        {!!feesOptions?.length && !payGasWithToken && (
                          <View style={styles.advancedOptionsCardRow}>
                            <MaterialCommunityIcons
                              name="gas-station"
                              size={14}
                              color={theme.gray}
                            />
                            <Text style={styles.advancedOptionsCardValue}>
                              {selectedFeesLabel}
                            </Text>
                          </View>
                        )}
                        {payGasWithToken && !!activeGasToken && (
                          <View style={styles.advancedOptionsCardRow}>
                            <MaterialCommunityIcons
                              name="cash"
                              size={14}
                              color={theme.gray}
                            />
                            <Text style={styles.advancedOptionsCardValue}>
                              {`Gas paid in ${activeGasToken.symbol}`}
                            </Text>
                          </View>
                        )}
                        {isEVMChain(convertedChainName) && !payGasWithToken && (
                          <View style={styles.advancedOptionsCardRow}>
                            <MaterialCommunityIcons
                              name="counter"
                              size={14}
                              color={theme.gray}
                            />
                            <Text style={styles.advancedOptionsCardValue}>
                              Nonce: {customNonce || transferData?.nonce || '0'}
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
                <Text style={styles.errorText}>
                  {payGasWithToken
                    ? `Not enough ${sponsoredFeeSymbol}. This send needs the amount plus a ${transferData?.transactionFee} ${sponsoredFeeSymbol} network fee.`
                    : `You don't have enough balance for make transaction you require ${transferData?.transactionFee} ${transferData?.currentCoin?.chain_symbol} to complete the transaction `}
                </Text>
              )}
              {isQuoteExpired && (
                <Text style={styles.errorText}>
                  {payGasWithToken
                    ? 'Gas quote expired — fetching a new one.'
                    : 'Quote expired — go back and refresh the quote.'}
                </Text>
              )}
              {!isCustomFeesValid && (
                <Text style={styles.errorText}>
                  {
                    'Priority fee cannot be higher than max fee — fix it in Advanced Options.'
                  }
                </Text>
              )}
              {!isCustomFeesValid && (
                <Text style={styles.errorText}>
                  {
                    'Priority fee cannot be higher than max fee — fix it in Advanced Options.'
                  }
                </Text>
              )}
              <TouchableOpacity
                disabled={
                  isDisabled ||
                  isFetchingFeesAgain ||
                  isQuoteExpired ||
                  !isCustomFeesValid ||
                  isFetchingSponsoredQuote
                }
                style={{
                  ...styles.button,
                  backgroundColor:
                    isDisabled ||
                    isFetchingFeesAgain ||
                    isQuoteExpired ||
                    !isCustomFeesValid ||
                    isFetchingSponsoredQuote
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
          {customErrorCode === SPONSOR_EMPTY_CODE && (
            <>
              <Text style={styles.sponsorEmptyHint}>
                {`You can still send this by paying the fee yourself — go back and turn off "Pay gas fees with ${sponsoredFeeSymbol}". Or contact us and we will top it up.`}
              </Text>
              <TouchableOpacity
                style={[styles.button, styles.sponsorEmptyButton]}
                onPress={() =>
                  navigation.push('Sidebar', {
                    screen: 'ContactUs',
                    params: {canGoBack: true},
                  })
                }>
                <Text style={styles.buttonTitle}>Contact Us</Text>
              </TouchableOpacity>
            </>
          )}
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
        {...advancedFeesSheetProps}
        payGasWithToken={payGasWithToken}
        gasTokenCandidates={sponsoredGasCoins}
        selectedGasTokenSymbol={activeGasToken?.symbol}
        onSelectGasToken={onSelectGasToken}
      />
    </DokSafeAreaView>
  );
};

export default Transfer;
