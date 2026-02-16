import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {View, Text, ScrollView, TouchableOpacity} from 'react-native';
import KeyboardArrow from 'assets/images/icons/keyboard-arrow-right.svg';
import {useDispatch, useSelector} from 'react-redux';
import TransactionsIcon from 'assets/images/send//trans.svg';
import myStyles from './TransactionsStyles';
import {ThemeContext} from 'theme/ThemeContext';
import {getLocalCurrency} from 'dok-wallet-blockchain-networks/redux/settings/settingsSelectors';
import {currencySymbol} from 'data/currency';
import {
  getPendingTransactions,
  selectCurrentCoin,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import dayjs from 'dayjs';
import {InAppBrowser} from 'react-native-inappbrowser-reborn';
import {inAppBrowserOptions} from 'utils/common';
import {
  isPendingTransactionSupportedChain,
  isTransactionListNotSupported,
} from 'dok-wallet-blockchain-networks/helper';
import IoniconIcon from 'react-native-vector-icons/Ionicons';
import ModalCancelPendingTransactions from 'components/ModalCancelPendingTransaction';
import {calculateEstimateFeeForPendingTransaction} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSlice';
import {getPendingTransferData} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSelector';
import {sendPendingTransactions} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import {useNavigation} from '@react-navigation/native';
import Spinner from 'components/Spinner';

const Transactions = ({renderList, selectedAddress}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();
  const pendingTransferData = useSelector(getPendingTransferData);
  const selectedTransactionRef = useRef(null);
  const isCancelTransactionRef = useRef(null);
  const navigation = useNavigation();

  const [list, setList] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  // console.log("list:", list);
  const currentCoin = useSelector(selectCurrentCoin);
  const localCurrency = useSelector(getLocalCurrency);
  const isTransactionNotSuppoted = useMemo(
    () =>
      isTransactionListNotSupported(currentCoin?.chain_name, currentCoin?.type),
    [currentCoin?.chain_name, currentCoin?.type],
  );

  // useEffect(() => {
  //  setList(currentCoin.transactions);
  // }, [currentCoin]);

  useEffect(() => {
    setList(renderList);
  }, [renderList]);

  const calculatePendingTransaction = useCallback(
    tx => {
      setShowCancelModal(true);
      dispatch(
        calculateEstimateFeeForPendingTransaction({
          fromAddress: tx?.extraPendingTransactionData?.from,
          toAddress: tx?.extraPendingTransactionData?.to,
          value: tx?.extraPendingTransactionData?.value,
          data: tx?.extraPendingTransactionData?.data,
          nonce: tx?.extraPendingTransactionData?.nonce,
          isCancelTransaction: true,
        }),
      );
      selectedTransactionRef.current = tx;
    },
    [dispatch],
  );

  const onPressSpeedUp = useCallback(
    tx => {
      calculatePendingTransaction(tx);
      isCancelTransactionRef.current = false;
    },
    [calculatePendingTransaction],
  );
  const onPressCancel = useCallback(
    tx => {
      calculatePendingTransaction(tx);
      isCancelTransactionRef.current = true;
    },
    [calculatePendingTransaction],
  );

  const onPressYes = useCallback(() => {
    setShowCancelModal(false);
    const tx = selectedTransactionRef.current;
    dispatch(
      sendPendingTransactions({
        from: tx?.extraPendingTransactionData?.from,
        to: tx?.extraPendingTransactionData?.to,
        value: tx?.extraPendingTransactionData?.value,
        data: tx?.extraPendingTransactionData?.data,
        nonce: tx?.extraPendingTransactionData?.nonce,
        pendingTxHash: tx?.extraPendingTransactionData?.txHash,
        isCancelTransaction: isCancelTransactionRef.current,
        navigation: navigation,
      }),
    );
  }, [dispatch, navigation]);

  return (
    <>
      <ScrollView>
        {list?.length === 0 ? (
          <View style={{...styles.section, marginTop: 40}}>
            <TransactionsIcon height="114" width="114" />
            <Text style={styles.info}>
              {isTransactionNotSuppoted
                ? 'To view the latest transactions, simply click on the “View All” button'
                : 'Your transactions will be shown here. Make a payment by using wallet address or scan a QR Code'}
            </Text>
          </View>
        ) : (
          <>
            {list?.map((item, index) => {
              const isReceived =
                item?.to?.toUpperCase() === selectedAddress?.toUpperCase();
              return (
                <TouchableOpacity
                  style={styles.section}
                  onPress={async () => {
                    InAppBrowser.open(item?.url, inAppBrowserOptions).then();
                    // const supported = await Linking.canOpenURL(item.url);

                    // if (supported) {
                    //   // Opening the link with some app, if the URL scheme is "http" the web link should be opened by some browser in the mobile
                    //   await Linking.openURL(item.url);
                    // } else {
                    //   console.log(`Don't know how to open this URL: ${item.url}`);
                    // }
                  }}
                  key={index}>
                  <>
                    <View style={styles.list}>
                      <View style={styles.box}>
                        <View style={styles.item}>
                          <Text style={styles.title}>{item.link}</Text>
                          <View style={{flexDirection: 'row'}}>
                            <Text style={styles.text}>
                              {dayjs(item.date).format('DD.MM.YYYY')}
                            </Text>
                            <Text style={styles.hyphen}>&#45;</Text>
                            <Text style={styles.text}>{item.status}</Text>
                          </View>
                        </View>

                        <View style={styles.itemNumber}>
                          <View style={{flexDirection: 'row'}}>
                            <Text
                              style={{
                                ...styles.text,
                                marginRight: 5,
                                color: isReceived ? 'green' : 'red',
                              }}>
                              {item.amount}
                            </Text>
                            <Text
                              style={{
                                ...styles.text,
                                color: isReceived ? 'green' : 'red',
                              }}>
                              {currentCoin?.symbol}
                            </Text>
                          </View>
                          <Text style={styles.text}>
                            {currencySymbol[localCurrency] + item.totalCourse}
                          </Text>
                        </View>
                      </View>

                      <View>
                        <KeyboardArrow
                          height="30"
                          width="30"
                          style={styles.arrow}
                        />
                      </View>
                    </View>
                    {item.status === 'PENDING' &&
                      isPendingTransactionSupportedChain(
                        currentCoin.chain_name,
                      ) && (
                        <View style={styles.rowView}>
                          <TouchableOpacity
                            style={styles.button}
                            onPress={() => {
                              onPressSpeedUp(item);
                            }}>
                            <IoniconIcon
                              name={'trending-up'}
                              size={20}
                              color={'white'}
                            />
                            <Text style={styles.buttonTitle}>Speed Up</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.button}
                            onPress={() => {
                              onPressCancel(item);
                            }}>
                            <IoniconIcon
                              name={'close'}
                              size={20}
                              color={'white'}
                            />
                            <Text style={styles.buttonTitle}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                  </>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
      {pendingTransferData.isSubmitting && <Spinner />}
      <ModalCancelPendingTransactions
        visible={showCancelModal}
        onPressYes={onPressYes}
        onPressNo={() => {
          setShowCancelModal(false);
        }}
        pendingTransferData={pendingTransferData}
        currentCoin={currentCoin}
        localCurrency={localCurrency}
        isCancelTransaction={isCancelTransactionRef.current}
      />
    </>
  );
};

export default Transactions;
