import React, {useContext} from 'react';
import {Text, View} from 'react-native';
import myStyles from './ModalAddCoinsStyles';

import {ThemeContext} from 'theme/ThemeContext';

import {SceneMap, TabBar, TabView} from 'react-native-tab-view';
import {SCREEN_WIDTH} from 'utils/dimensions';
import TabAddCoins from 'components/TabAddCoins';
import TabAddCoinGroups from 'components/TabAddCoinGroups';
import DokBottomSheet from 'components/BottomSheet';

const renderScene = SceneMap({
  add_coins: TabAddCoins,
  add_coins_group: TabAddCoinGroups,
});

const ROUTES = [
  {key: 'add_coins', title: 'Coins '},
  {key: 'add_coins_group', title: 'Coins Group '},
];

const RenderTabBar = props => {
  const {styles} = props;

  // Create options for each route
  const tabOptions = ROUTES.reduce((acc, route) => {
    acc[route.key] = {
      label: ({focused}) => (
        <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
          {route.title}
        </Text>
      ),
    };
    return acc;
  }, {});

  return (
    <TabBar
      {...props}
      indicatorStyle={styles.indicator}
      style={styles.tabBar}
      options={tabOptions}
    />
  );
};

const ModalAddCoins = ({isLightning, bottomSheetRef, onDismiss}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState(ROUTES);

  return (
    <DokBottomSheet
      bottomSheetRef={bottomSheetRef}
      snapPoints={['90%']}
      onDismiss={onDismiss}>
      <View style={styles.centeredView}>
        <TabView
          navigationState={{index, routes}}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{width: SCREEN_WIDTH}}
          renderTabBar={props => <RenderTabBar {...props} styles={styles} />}
          lazy={true}
        />
      </View>
    </DokBottomSheet>
  );
};

export default ModalAddCoins;
