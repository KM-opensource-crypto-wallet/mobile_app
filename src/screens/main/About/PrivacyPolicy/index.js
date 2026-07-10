import React from 'react';
import {View, Text} from 'react-native';
import {WebView} from 'react-native-webview';
import myStyles from './PrivacyPolicyStyles';
import {ThemeContext} from 'theme/ThemeContext';
import {useContext} from 'react';
import {inAppBrowserOptions} from 'utils/common';
import {openInAppBrowser} from 'utils/inAppBrowser';
import {URLData} from 'utils/wlData';

const PrivacyPolicy = () => {
  const uri = URLData.privacyPolicy;
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GDPR Compliant</Text>
      <View style={styles.mainContainer}>
        <WebView
          style={styles.main}
          source={{uri}}
          onShouldStartLoadWithRequest={request => {
            if (request.url !== uri) {
              openInAppBrowser(request?.url, inAppBrowserOptions).then();
              return false;
            }
            return true;
          }}
        />
      </View>
    </View>
  );
};

export default PrivacyPolicy;
