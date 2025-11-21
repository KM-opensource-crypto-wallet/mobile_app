import React, {useContext} from 'react';
import {ThemeContext} from 'theme/ThemeContext';
import {View, Text, TouchableOpacity, Platform} from 'react-native';
import {SCREEN_WIDTH} from 'utils/dimensions';

const EmptyView = ({text, buttonText, onPressButton}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
      {buttonText && onPressButton ? (
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={onPressButton}
          style={styles.btn}>
          <Text style={styles.btnTitle}>{buttonText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};
const myStyles = theme => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.backgroundColor,
    paddingHorizontal: 20,
  },
  text: {
    color: theme.font,
    fontSize: 14,
    textAlign: 'left',
    fontFamily: 'Roboto-Regular',
  },
  btn: {
    backgroundColor: theme.background,
    width: SCREEN_WIDTH / 2,
    minWidth: 120,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginVertical: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#C0C0C0',
        shadowOffset: {width: 0, height: 5},
        shadowOpacity: 1,
        shadowRadius: 5,
      },
      android: {
        shadowColor: theme.font,
        elevation: 10,
      },
    }),
  },
  btnTitle: {
    fontWeight: '600',
    color: 'white',
    fontSize: 16,
  },
});
export default EmptyView;
