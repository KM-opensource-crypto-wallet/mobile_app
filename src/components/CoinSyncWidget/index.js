import React, {useContext, useCallback, useEffect, useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {useSelector} from 'react-redux';
import {ThemeContext} from 'theme/ThemeContext';
import {MainNavigation} from 'utils/navigation';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {
  selectShouldShowWidget,
  selectWidgetData,
} from 'dok-wallet-blockchain-networks/redux/coinSync/coinSyncSelectors';
import {myStyles} from './CoinSyncWidgetStyles';

const CoinSyncWidget = () => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const [currentRoute, setCurrentRoute] = useState('');

  const shouldShowWidget = useSelector(selectShouldShowWidget);
  const widgetData = useSelector(selectWidgetData);

  const checkRoute = () => {
    const route = MainNavigation.getCurrentRouteName?.() || '';
    setCurrentRoute(route);
  };

  // Listen for route changes
  useEffect(() => {
    checkRoute();
    const interval = setInterval(checkRoute, 500);
    return () => clearInterval(interval);
  }, []);

  const handlePress = useCallback(() => {
    if (currentRoute !== 'CoinSyncScreen') {
      MainNavigation.navigate('CoinSyncScreen');
    }
  }, [currentRoute]);

  // Don't show widget if not syncing or already on CoinSyncScreen or Login screens
  if (
    !shouldShowWidget ||
    currentRoute === 'CoinSyncScreen' ||
    currentRoute === 'Login' ||
    currentRoute === 'VerifyLogin'
  ) {
    return null;
  }

  const progressPercent =
    widgetData.totalCoins > 0
      ? (widgetData.completedCoins / widgetData.totalCoins) * 100
      : 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.9}>
      <View style={styles.progressContainer}>
        <AnimatedCircularProgress
          size={44}
          width={4}
          fill={progressPercent}
          tintColor="#FFFFFF"
          backgroundColor="rgba(255, 255, 255, 0.3)"
          rotation={0}
          lineCap="round">
          {() => (
            <Text style={styles.percentText}>
              {Math.round(progressPercent)}%
            </Text>
          )}
        </AnimatedCircularProgress>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.progressText}>
          {widgetData.completedCoins}/{widgetData.totalCoins}
        </Text>
        <Text style={styles.labelText} numberOfLines={1}>
          {widgetData.isFetching ? 'Loading...' : 'Syncing coins'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default CoinSyncWidget;
