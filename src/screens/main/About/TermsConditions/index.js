import React from 'react';
import {View, Text} from 'react-native';
import {WebView} from 'react-native-webview';
import myStyles from './TermsConditionsStyles';
import {ThemeContext} from 'theme/ThemeContext';
import {useContext} from 'react';
import {InAppBrowser} from 'react-native-inappbrowser-reborn';
import {inAppBrowserOptions} from 'utils/common';
import {URLData} from 'utils/wlData';

const TermsConditions = () => {
  const uri = URLData.terms;
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Terms of Use</Text>
      <View style={styles.mainContainer}>
        <WebView
          style={styles.main}
          source={{uri}}
          onShouldStartLoadWithRequest={request => {
            if (request.url !== uri) {
              InAppBrowser.open(request?.url, inAppBrowserOptions).then();
              return false;
            }
            return true;
          }}
        />
      </View>
    </View>
  );
};

export default TermsConditions;
