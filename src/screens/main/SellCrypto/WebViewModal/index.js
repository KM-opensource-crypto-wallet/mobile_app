import React, {useContext, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {ThemeContext} from 'theme/ThemeContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {IS_ANDROID} from 'utils/dimensions';
import myStyles from './WebViewModalStyles';

const getHost = urlString => {
  try {
    return new URL(urlString).host;
  } catch (e) {
    return '';
  }
};

export const WebViewModal = props => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const insets = useSafeAreaInsets();
  const [currentUrl, setCurrentUrl] = useState('');

  // The modal renders in its own window with statusBarTranslucent, where
  // SafeAreaView reports no insets - on Android the app is not edge-to-edge
  // so insets.top is 0 while the window still draws under the status bar.
  // Pad manually and fall back to the status bar height.
  const topInset = Math.max(
    insets.top,
    IS_ANDROID ? StatusBar.currentHeight || 0 : 0,
  );
  const displayHost = getHost(currentUrl) || getHost(props.uri);

  const closeModal = (success, data) => {
    setCurrentUrl('');
    props.onClose?.(success, data);
  };

  const onCloseHandler = () => {
    closeModal();
  };

  function getQueryParams(urlString) {
    // Create a URL object
    const url = new URL(urlString);

    // Retrieve the URLSearchParams object
    const searchParams = url.searchParams;

    // Build a standard JS object from the parameters
    const paramsObj = {};
    for (const [key, value] of searchParams.entries()) {
      paramsObj[key] = value;
    }
    return paramsObj;
  }

  const onShouldStartLoadWithRequest = request => {
    if (
      request.url.startsWith('https://dokwallet.app') ||
      request.url.startsWith('https://www.dokwallet.app')
    ) {
      const queryParams = getQueryParams(request.url);
      closeModal(true, queryParams);
      return false;
    }
    return true;
  };

  const onNavigationStateChange = navState => {
    setCurrentUrl(navState?.url || '');
  };

  const onWebViewError = syntheticEvent => {
    const {nativeEvent} = syntheticEvent;
    console.warn('WebView error:', nativeEvent);
    closeModal(false);
  };

  return (
    <Modal
      animationType="slide"
      visible={props.visible}
      statusBarTranslucent={true}
      onRequestClose={onCloseHandler}>
      <View style={[styles.container, {paddingBottom: insets.bottom}]}>
        <View style={[styles.headerContainer, {paddingTop: topInset}]}>
          <View style={styles.header}>
            <View style={styles.headerCenter}>
              {!!props.title && (
                <Text style={styles.title} numberOfLines={1}>
                  {props.title}
                </Text>
              )}
              {!!displayHost && (
                <Text style={styles.domain} numberOfLines={1}>
                  {displayHost}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.doneButton}
              hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
              onPress={onCloseHandler}>
              <Text style={styles.doneText}>{'Done'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <WebView
          originWhitelist={['http://', 'https://', 'about:']}
          source={{uri: props.uri}}
          style={styles.webview}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          onNavigationStateChange={onNavigationStateChange}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          allowsBackForwardNavigationGestures={false}
          cacheEnabled={false}
          sharedCookiesEnabled={false}
          onError={onWebViewError}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={theme.background} />
            </View>
          )}
        />
      </View>
    </Modal>
  );
};
