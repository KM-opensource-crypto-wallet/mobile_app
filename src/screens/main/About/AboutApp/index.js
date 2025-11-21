import {View, Text} from 'react-native';
import myStyles from './AboutAppStyles';
import {ThemeContext} from 'theme/ThemeContext';
import {useContext} from 'react';
import RNDeviceInfo from 'react-native-device-info';
import {IS_ANDROID} from 'utils/dimensions';
import dayjs from 'dayjs';

const AboutApp = () => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  return (
    <>
      <View style={styles.section}>
        <Text style={styles.title}>Change Log:</Text>
        <Text
          style={
            styles.list
          }>{`Version: ${RNDeviceInfo.getReadableVersion()}`}</Text>
        {IS_ANDROID && (
          <Text style={styles.list}>
            {`Release date: ${dayjs(
              RNDeviceInfo.getLastUpdateTimeSync(),
            ).format('MMMM DD, YYYY')}`}
          </Text>
        )}
      </View>
    </>
  );
};

export default AboutApp;
