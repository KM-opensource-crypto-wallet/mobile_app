import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import myStyles from './MessageListStyles';

import {ThemeContext} from 'theme/ThemeContext';
import {useDispatch} from 'react-redux';

import {getConversation} from 'dok-wallet-blockchain-networks/redux/messages/messageSlice';
import {TabBar, TabView} from 'react-native-tab-view';
import {SCREEN_WIDTH} from 'utils/dimensions';
import Conversations from 'components/Conversations';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import ModalInfo from 'components/ModalInfo';
import {TABS_INFO} from 'dok-wallet-blockchain-networks/helper';
import {DokSafeAreaView} from 'components/DokSafeAreaView';

const renderScene = ({route}) => {
  switch (route.key) {
    case 'messages':
      return <Conversations />;
    case 'requests':
      return <Conversations isRequest={true} />;
    default:
      return null;
  }
};

const RenderTabBar = props => {
  const {styles, theme} = props;
  return (
    <TabBar
      {...props}
      renderLabel={({route, focused}) => (
        <View style={{width: '100%'}}>
          <Text
            style={[
              styles.tabBarFontStyle,
              focused && {fontWeight: 'bold', color: theme.background},
            ]}>
            {route.title}
          </Text>
        </View>
      )}
      indicatorStyle={styles.indicatorStyle}
      style={styles.tabBarStyle}
    />
  );
};

const MessageList = ({navigation}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const dispatch = useDispatch();
  const [routes] = useState([
    {key: 'messages', title: 'Messages'},
    {key: 'requests', title: 'Requests'},
  ]);
  const [index, setIndex] = useState(0);
  const fetchConversations = useCallback(() => {
    dispatch(getConversation());
  }, [dispatch]);
  const [showModalInfo, setShowModalInfo] = useState(false);
  const tabSelected = useRef(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRightStyle}>
          <TouchableOpacity
            style={styles.headerRightStyle}
            onPress={() => navigation.navigate('NewMessage')}>
            <MaterialCommunityIcons
              name={'message-plus'}
              size={28}
              color={theme.font}
            />
          </TouchableOpacity>
          <Menu>
            <MenuTrigger style={{paddingHorizontal: 4}}>
              <EntypoIcon
                size={24}
                name={'dots-three-vertical'}
                color={theme.font}
              />
            </MenuTrigger>
            <MenuOptions optionsContainerStyle={styles.optionsContainer}>
              <MenuOption
                onSelect={() => {
                  tabSelected.current = 'MESSAGES';
                  setShowModalInfo(true);
                }}
                customStyles={{optionWrapper: {padding: 0}}}>
                <View
                  style={[
                    styles.optionMenu,
                    {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.headerBorder,
                    },
                  ]}>
                  <Text style={styles.optionText}>{'What is Messages?'}</Text>
                </View>
              </MenuOption>
              <MenuOption
                onSelect={() => {
                  tabSelected.current = 'REQUESTS';
                  setShowModalInfo(true);
                }}
                customStyles={{optionWrapper: {padding: 0}}}>
                <View style={styles.optionMenu}>
                  <Text style={styles.optionText}>{'What is Request?'}</Text>
                </View>
              </MenuOption>
            </MenuOptions>
          </Menu>
        </View>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <DokSafeAreaView style={styles.container}>
      <View style={styles.container}>
        <TabView
          navigationState={{index, routes}}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{width: SCREEN_WIDTH}}
          renderTabBar={props => (
            <RenderTabBar {...props} styles={styles} theme={theme} />
          )}
        />
        <ModalInfo
          visible={showModalInfo}
          handleClose={() => {
            setShowModalInfo(false);
          }}
          title={TABS_INFO[tabSelected.current]?.title}
          message={TABS_INFO[tabSelected.current]?.message}
        />
      </View>
    </DokSafeAreaView>
  );
};

export default MessageList;
