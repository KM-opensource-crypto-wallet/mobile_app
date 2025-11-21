import {StyleSheet} from 'react-native';
import {SCREEN_WIDTH} from 'utils/dimensions';

const myStyles = theme =>
  StyleSheet.create({
    itemRow: {
      height: 50,
      width: SCREEN_WIDTH - 40,
      alignItems: 'center',
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.gray,
    },
    itemTitle: {
      fontSize: 16,
      color: theme.font,
      fontWeight: '600',
      flex: 1,
    },
  });

export default myStyles;
