import { CheckBox } from '@rneui/themed';
import { DokSafeAreaView } from '../../../../components/DokSafeAreaView';
import Loading from '../../../../components/Loading';
import { getCustomizePublicAddress } from 'dok-wallet-blockchain-networks/helper';
import {
  clearSelectedUTXOs,
  setCurrentTransferData,
} from 'dok-wallet-blockchain-networks/redux/currentTransfer/currentTransferSlice';
import { selectCurrentCoin } from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import { refreshCurrentCoin } from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';
import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import {
  RefreshControl,
  ScrollView,
  SectionList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeContext } from '../../../../theme/ThemeContext';
import myStyles from './SelectUTXOsScreenStyles';

const SelectUTXOsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const currentCoin = useSelector(selectCurrentCoin);
  const { theme } = useContext(ThemeContext);
  const styles = myStyles(theme);
  const [allUTXOs, setAllUTXOs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const coinId = useMemo(() => {
    return currentCoin?._id + currentCoin?.name + currentCoin?.chain_name;
  }, [currentCoin]);

  const disableContinue = useMemo(
    () => allUTXOs.every(item => !item.isSelected),
    [allUTXOs],
  );

  useEffect(() => {
    if (!currentCoin?.UTXOs) {
      return;
    }

    setAllUTXOs(
      currentCoin.UTXOs.map(item => ({
        ...item,
        isSelected: false,
        data: item.data
          .map(tx => ({
            ...tx,
            isSelected: false,
          }))
          .sort((a, b) => a.vout - b.vout),
      })),
    );
  }, [currentCoin?.UTXOs]);

  useEffect(() => {
    if (currentCoin?.address) {
      dispatch(refreshCurrentCoin({ fetchUTXOs: true }))
        .unwrap()
        .then(() => {
          setIsLoading(false);
        })
        .catch(e => {
          setIsLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coinId, dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(refreshCurrentCoin({ fetchUTXOs: true })).unwrap();
    setRefreshing(false);
  }, [dispatch]);

  const onSelectAll = useCallback(() => {
    setAllUTXOs(prev => {
      const allSelected = prev.every(item => item.isSelected);
      const newValue = !allSelected;
      return prev.map(item => ({
        ...item,
        isSelected: newValue,
        data: item.data.map(tx => ({ ...tx, isSelected: newValue })),
      }));
    });
  }, [setAllUTXOs]);

  const onSelectChange = (label, txid = null, vout = null) => {
    setAllUTXOs(prev =>
      prev.map(item => {
        if (item.label !== label) {
          return item;
        }
        if (!txid) {
          const toggled = !item.isSelected;
          return {
            ...item,
            isSelected: toggled,
            data: item.data.map(tx => ({ ...tx, isSelected: toggled })),
          };
        }
        const updatedData = item.data.map(tx =>
          tx.vout === +vout && tx.txid === txid
            ? { ...tx, isSelected: !tx.isSelected }
            : tx,
        );
        const isSelected = updatedData.some(tx => tx.isSelected);
        return {
          ...item,
          data: updatedData,
          isSelected,
        };
      }),
    );
  };

  useLayoutEffect(() => {
    if (allUTXOs.length > 0) {
      const headerRight = () => (
        <View style={{ marginRight: 8 }}>
          <TouchableOpacity
            style={styles.optionMenu}
            onPress={() => onSelectAll()}>
            <Text style={styles.optionText}>
              {allUTXOs.every(item => item.isSelected)
                ? 'Deselect All'
                : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>
      );
      navigation.setOptions({ headerRight });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, theme.font, allUTXOs, onSelectAll]);

  if (!currentCoin) {
    return null;
  }
  return (
    <>
      <DokSafeAreaView
        style={styles.container}
        edges={['left', 'bottom', 'right']}>
        {isLoading ? (
          <Loading />
        ) : (
          <View style={styles.container}>
            <ScrollView
              contentContainerStyle={styles.containerContainerStyle}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }>
              <SectionList
                sections={allUTXOs}
                keyExtractor={item => item.txid + item.vout}
                ListHeaderComponent={<View style={{ height: 14 }} />}
                contentContainerStyle={
                  styles.sectionListContainerContainerStyle
                }
                ListEmptyComponent={
                  <View style={styles.emptyView}>
                    <Text style={styles.emptyText}>{'No UTXOs available'}</Text>
                  </View>
                }
                renderSectionHeader={({ section }) => (
                  <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => onSelectChange(section.label)}>
                    <CheckBox
                      size={24}
                      checkedColor={theme.background}
                      checked={section.isSelected}
                      iconType="material-community"
                      checkedIcon="checkbox-marked"
                      containerStyle={styles.checkboxStyle}
                      uncheckedIcon="checkbox-blank-outline"
                      onChange={() => onSelectChange(section.label)}
                    />
                    <Text style={styles.headerTitle}>
                      {getCustomizePublicAddress(section.label)} (
                      {section.data.reduce(
                        (acc, item) => (acc += item.value),
                        0,
                      )}
                      )
                    </Text>
                  </TouchableOpacity>
                )}
                renderItem={({ item, section }) => (
                  <TouchableOpacity
                    style={styles.rowView}
                    onPress={() =>
                      onSelectChange(
                        section.label,
                        item.txid,
                        item.vout.toString(),
                      )
                    }>
                    <CheckBox
                      size={24}
                      checkedColor={theme.background}
                      checked={item.isSelected}
                      iconType="material-community"
                      checkedIcon="checkbox-marked"
                      containerStyle={styles.checkboxStyle}
                      uncheckedIcon="checkbox-blank-outline"
                      onChange={() =>
                        onSelectChange(
                          section.label,
                          item.txid,
                          item.vout.toString(),
                        )
                      }
                    />
                    <Text style={styles.rowLabel}>
                      {item.vout}. {getCustomizePublicAddress(item.txid)} (
                      {item.value})
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </ScrollView>
            <TouchableOpacity
              disabled={disableContinue}
              style={[
                styles.btn,
                styles.shadow,
                disableContinue && styles.btnDisabled,
              ]}
              onPress={() => {
                const selectedUTXOs = allUTXOs.flatMap(item =>
                  item.data.filter(tx => tx.isSelected),
                );
                const selectedUTXOsValue = selectedUTXOs.reduce(
                  (acc, item) => (acc += item.value),
                  0,
                );
                dispatch(
                  setCurrentTransferData({
                    selectedUTXOsValue,
                    selectedUTXOs,
                    isSendFunds: false,
                  }),
                );
                navigation.navigate('SendFunds');
              }}>
              <Text style={styles.btnText}>{'continue'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </DokSafeAreaView>
    </>
  );
};

export default SelectUTXOsScreen;
