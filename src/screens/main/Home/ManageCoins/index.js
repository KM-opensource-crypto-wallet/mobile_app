import React, {
  useState,
  useEffect,
  useContext,
  useLayoutEffect,
  useCallback,
  useRef,
} from 'react';
import {TouchableOpacity, View, Text} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import {useDispatch, useSelector} from 'react-redux';
import {Searchbar} from 'react-native-paper';
import myStyles from './ManageCoinsStyles';
import ModalAddToken from 'components/ModalAddToken';
import ModalAddCoins from 'components/ModalAddCoins';
import Pluscircleo from 'assets/images/icons/pluscircleo.svg';
import {ThemeContext} from 'theme/ThemeContext';
import {
  selectCoinsForCurrentWallet,
  selectCurrentWallet,
} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSelector';
import DraggableCryptoList from 'components/DraggableCryptoList';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ModalConfirm from 'components/ModalConfirm';
import {deleteCoin} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';

const ManageCoins = ({navigation, route}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalAddTokenVisible, setModalAddTokenVisible] = useState(false);
  const [contractAddress, setContractAddress] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(false);

  const allCoins = useSelector(selectCoinsForCurrentWallet);
  const currentWallet = useSelector(selectCurrentWallet);
  const [list, setList] = useState(Array.isArray(allCoins) ? allCoins : []);
  const [isSortSelected, setSortSelected] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteMode, setShowDeleteMode] = useState(false);
  const addMoreCoinsSheet = useRef();
  const qrContractAddress = route?.params?.qrContractAddress || '';
  const newDateToString = route?.params?.newDateToString;
  const routeSelectedNetwork = route?.params?.selectedNetwork;
  const selectedCoinRef = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if ((qrContractAddress || routeSelectedNetwork) && newDateToString) {
      setModalAddTokenVisible(true);
      setContractAddress(qrContractAddress);
      if (routeSelectedNetwork) {
        setSelectedNetwork(JSON.parse(routeSelectedNetwork));
      }
    }
  }, [qrContractAddress, newDateToString, routeSelectedNetwork]);

  const onToggleDeleteMode = useCallback(() => {
    setShowDeleteMode(true);
  }, []);

  const closeAllMode = useCallback(() => {
    setShowDeleteMode(false);
    setSortSelected(false);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        showDeleteMode || isSortSelected ? (
          <TouchableOpacity
            onPress={closeAllMode}
            style={styles.doneButtonStyle}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        ) : (
          <Menu>
            <MenuTrigger>
              <View style={{padding: 8}}>
                <EntypoIcon
                  size={24}
                  name={'dots-three-vertical'}
                  color={theme.font}
                />
              </View>
            </MenuTrigger>
            <MenuOptions optionsContainerStyle={styles.optionsContainer}>
              {searchQuery?.trim()?.length === 0 ? (
                <MenuOption
                  onSelect={() => {
                    setSortSelected(prevState => !prevState);
                  }}>
                  <View style={styles.optionMenu}>
                    <Icon
                      name={'sort'}
                      size={20}
                      color={isSortSelected ? theme.background : theme.font}
                    />
                    <Text style={styles.optionText}>{'Rearrange'}</Text>
                  </View>
                </MenuOption>
              ) : null}
              <MenuOption onSelect={onToggleDeleteMode}>
                <View style={styles.optionMenu}>
                  <Ionicons
                    name={'trash'}
                    resizeMode={'contain'}
                    size={20}
                    style={{marginBottom: 2}}
                    color={'red'}
                  />
                  <Text style={[styles.optionText, {color: 'red'}]}>
                    {'Delete'}
                  </Text>
                </View>
              </MenuOption>
            </MenuOptions>
          </Menu>
        ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSortSelected, searchQuery, showDeleteMode]);

  const handleSearch = query => {
    setSortSelected(false);
    setSearchQuery(query);
  };

  useEffect(() => {
    if (Array.isArray(allCoins)) {
      if (searchQuery?.trim()) {
        const newList = allCoins?.filter(item => {
          return (
            item?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
            item?.symbol?.toUpperCase()?.includes(searchQuery?.toUpperCase())
          );
        });
        setList(newList);
      } else {
        setList(allCoins);
      }
    }
  }, [allCoins, searchQuery]);

  const onPressAddMoreCoin = useCallback(() => {
    addMoreCoinsSheet?.current?.close?.();
    addMoreCoinsSheet?.current?.present?.();
  }, []);

  const onDismissAddCoinsSheet = useCallback(() => {
    addMoreCoinsSheet?.current?.close?.();
  }, []);

  const onPressDelete = useCallback(item => {
    selectedCoinRef.current = item;
    setShowConfirmModal(true);
  }, []);

  const onConfirmDelete = useCallback(() => {
    try {
      setShowConfirmModal(false);
      dispatch(deleteCoin(selectedCoinRef.current?._id));
    } catch (e) {
      console.error('Error in deletecoin', e);
    }
  }, [dispatch]);

  const onPressCancel = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  return (
    <DokSafeAreaView style={styles.container}>
      <View style={styles.mainView}>
        <View style={styles.searchView}>
          <Searchbar
            placeholder="Search"
            value={searchQuery}
            style={styles.input}
            onChangeText={handleSearch}
          />
        </View>

        <DraggableCryptoList
          number={2}
          list={list}
          showSwitch
          currentWallet={currentWallet}
          isSortSelected={isSortSelected && searchQuery?.trim().length === 0}
          showDeleteMode={showDeleteMode}
          onPressDelete={onPressDelete}
        />

        <View style={styles.btnList}>
          <TouchableOpacity style={styles.btnAdd} onPress={onPressAddMoreCoin}>
            <Pluscircleo height="24" width="24" style={styles.circle} />

            <View style={styles.box}>
              <Text style={styles.title}>Add Coin or Token</Text>
              <Text style={styles.text}>Select from the supported list</Text>
            </View>
          </TouchableOpacity>
          <ModalAddCoins
            bottomSheetRef={ref => (addMoreCoinsSheet.current = ref)}
            onDismiss={onDismissAddCoinsSheet}
          />

          <TouchableOpacity
            style={styles.btnAdd}
            onPress={() => setModalAddTokenVisible(true)}>
            <Pluscircleo height="24" width="24" style={styles.circle} />
            <View style={styles.box}>
              <Text style={styles.title}>Add Custum Token</Text>
              <Text style={styles.text}>Add any ERC20/BEP20 Token</Text>
            </View>
          </TouchableOpacity>
          {modalAddTokenVisible && (
            <ModalAddToken
              visible={modalAddTokenVisible}
              hideModal={setModalAddTokenVisible}
              navigation={navigation}
              contractAddress={contractAddress}
              selectedNetwork={selectedNetwork}
            />
          )}
        </View>
      </View>
      <ModalConfirm
        title={`Delete ${selectedCoinRef?.current?.name}?`}
        description={'Are you sure you want to delete ths coin?'}
        yesButtonTitle={'Delete'}
        noButtonTitle={'Cancel'}
        onPressNo={onPressCancel}
        onPressYes={onConfirmDelete}
        visible={showConfirmModal}
      />
    </DokSafeAreaView>
  );
};

export default ManageCoins;
