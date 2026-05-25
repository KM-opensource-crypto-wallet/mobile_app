import React, {useState, useContext, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Switch,
  ScrollView,
} from 'react-native';
import myStyles from './SortTransactionsStyles';
import {ThemeContext} from 'theme/ThemeContext';
import IoniconIcon from 'react-native-vector-icons/Ionicons';
import {useDispatch, useSelector} from 'react-redux';
import {selectCurrentCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import {createPendingTransactionKey} from 'dok-wallet-blockchain-networks/helper';
import {
  refreshCurrentCoin,
  setPendingTransactions,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';

const SORT_OPTIONS = [
  {label: 'Date Descending', icon: 'arrow-down-outline', desc: 'Newest first'},
  {label: 'Date Ascending', icon: 'arrow-up-outline', desc: 'Oldest first'},
  {
    label: 'Amount Descending',
    icon: 'trending-up-outline',
    desc: 'Highest amount first',
  },
  {
    label: 'Amount Ascending',
    icon: 'trending-down-outline',
    desc: 'Lowest amount first',
  },
];

const FILTER_OPTIONS = [
  {label: 'None', icon: 'layers-outline'},
  {label: 'Send', icon: 'arrow-up-circle-outline'},
  {label: 'Received', icon: 'arrow-down-circle-outline'},
  {label: 'Pending', icon: 'time-outline'},
];

const SortTransactions = ({
  visible,
  hideModal,
  onPressAppy,
  currentSort,
  currentFilter,
  currentHideSmallTx,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const currentCoin = useSelector(selectCurrentCoin);
  const dispatch = useDispatch();

  const [value, setValue] = useState(currentSort ?? 'Date Descending');
  const [status, setStatus] = useState(currentFilter ?? 'None');
  const [hideSmallTx, setHideSmallTx] = useState(currentHideSmallTx ?? true);

  useEffect(() => {
    if (visible) {
      setValue(currentSort ?? 'Date Descending');
      setStatus(currentFilter ?? 'None');
      setHideSmallTx(currentHideSmallTx ?? true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleSubmit = () => {
    hideModal(false);
    onPressAppy(value, status, hideSmallTx);
  };

  const handleReset = () => {
    setValue('Date Descending');
    setStatus('None');
    setHideSmallTx(true);
  };

  const onPressClearTransactionCache = useCallback(() => {
    hideModal(false);
    const key = createPendingTransactionKey({
      chain_name: currentCoin?.chain_name,
      symbol: currentCoin?.symbol,
      address: currentCoin?.address,
    });
    dispatch(setPendingTransactions({key, value: []}));
    dispatch(refreshCurrentCoin({fetchTransaction: true}));
  }, [
    currentCoin?.address,
    currentCoin?.chain_name,
    currentCoin?.symbol,
    dispatch,
    hideModal,
  ]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => hideModal(false)}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={() => hideModal(false)}
      />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Sort & Filter</Text>
            <Text style={styles.headerSub}>
              Customise your transaction view
            </Text>
          </View>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <IoniconIcon name="refresh-outline" size={13} color={theme.title} />
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.sectionLabel}>
            <IoniconIcon
              name="swap-vertical-outline"
              size={14}
              color={theme.background}
            />
            <Text style={styles.sectionLabelText}>Sort by</Text>
          </View>

          <View style={styles.optionGroup}>
            {SORT_OPTIONS.map((opt, index) => {
              const isSelected = value === opt.label;
              const isLast = index === SORT_OPTIONS.length - 1;
              return (
                <TouchableOpacity
                  key={opt.label}
                  style={[
                    styles.optionRow,
                    isSelected && styles.optionRowSelected,
                    !isLast && styles.optionRowDivider,
                  ]}
                  onPress={() => setValue(opt.label)}
                  activeOpacity={0.7}>
                  <View
                    style={[
                      styles.optionIcon,
                      isSelected && styles.optionIconSelected,
                    ]}>
                    <IoniconIcon
                      name={opt.icon}
                      size={16}
                      color={isSelected ? theme.title : theme.font}
                    />
                  </View>
                  <View style={styles.optionText}>
                    <Text
                      style={[
                        styles.optionLabel,
                        isSelected && styles.optionLabelSelected,
                      ]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.optionDesc}>{opt.desc}</Text>
                  </View>
                  <View
                    style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sectionLabel}>
            <IoniconIcon
              name="funnel-outline"
              size={14}
              color={theme.background}
            />
            <Text style={styles.sectionLabelText}>Filter by status</Text>
          </View>

          <View style={styles.filterRow}>
            {FILTER_OPTIONS.map(opt => {
              const isSelected = status === opt.label;
              return (
                <TouchableOpacity
                  key={opt.label}
                  style={[
                    styles.filterPill,
                    isSelected && styles.filterPillSelected,
                  ]}
                  onPress={() => setStatus(opt.label)}
                  activeOpacity={0.7}>
                  <IoniconIcon
                    name={opt.icon}
                    size={15}
                    color={isSelected ? theme.title : theme.font}
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      isSelected && styles.filterPillTextSelected,
                    ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={styles.toggleIcon}>
                <IoniconIcon
                  name="eye-off-outline"
                  size={16}
                  color={theme.background}
                />
              </View>
              <View>
                <Text style={styles.toggleLabel}>Hide small transactions</Text>
                <Text style={styles.toggleDesc}>
                  Skip transactions below $1
                </Text>
              </View>
            </View>
            <Switch
              value={hideSmallTx}
              onValueChange={setHideSmallTx}
              trackColor={{false: theme.whiteOutline, true: theme.background}}
              thumbColor={theme.title}
            />
          </View>

          <TouchableOpacity style={styles.applyBtn} onPress={handleSubmit}>
            <IoniconIcon
              name="checkmark-circle-outline"
              size={18}
              color={theme.title}
            />
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cacheBtn}
            onPress={onPressClearTransactionCache}>
            <IoniconIcon
              name="trash-outline"
              size={16}
              color={theme.background}
            />
            <Text style={styles.cacheBtnText}>Clear Transaction Cache</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default SortTransactions;
