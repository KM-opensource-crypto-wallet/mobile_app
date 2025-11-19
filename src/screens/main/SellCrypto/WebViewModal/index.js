import React, { useContext } from 'react';
import {
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { ThemeContext } from '../../../../theme/ThemeContext';
import CloseIcon from '../../../../assets/images/icons/close.svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import myStyles from './WebViewModalStyles';

export const WebViewModal = props => {
  const { theme } = useContext(ThemeContext);
  const styles = myStyles(theme);
  const insets = useSafeAreaInsets();

  const onCloseHandler = event => {
    props.onClose?.();
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
      props.onClose?.(true, queryParams);
      return false;
    }
    return true;
  };

  const onWebViewError = syntheticEvent => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error:', nativeEvent);
    props.onClose?.(false);
  };

  return (
    <Modal
      animationType="slide"
      visible={props.visible}
      statusBarTranslucent={true}
      onRequestClose={onCloseHandler}>
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { height: insets.top - 25 }]}>
          {props.title && <Text style={styles.title}>{props.title}</Text>}
          <TouchableOpacity onPress={onCloseHandler}>
            <CloseIcon fill={theme.font} width={13} />
          </TouchableOpacity>
        </View>
        <WebView
          originWhitelist={['http://', 'https://', 'about:']}
          source={{ uri: props.uri }}
          style={styles.webview}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
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
      </SafeAreaView>
    </Modal>
  );
};
