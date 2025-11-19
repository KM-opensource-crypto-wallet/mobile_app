import React, { useContext } from 'react';

import { View, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../theme/ThemeContext';
import FastImage from '@d11/react-native-fast-image';

const maxDisplay = 5;
const CoinIcons = ({ icons }) => {
  const { theme } = useContext(ThemeContext);
  const { iconContainer, countImageView, iconImg, iconWrapper, counterText } =
    styles(theme);

  return (
    <View style={iconContainer}>
      {icons.map((item, index) => {
        const end = 10 * index;
        if (index < maxDisplay || icons.length === maxDisplay + 1) {
          return (
            <View
              style={[
                iconWrapper,
                {
                  end,
                },
              ]}
              key={'crypto_icon' + item + index}>
              {item ? (
                <FastImage
                  source={{ uri: item }}
                  style={iconImg}
                  resizeMode={'cover'}
                />
              ) : null}
            </View>
          );
        } else if (index === maxDisplay) {
          return (
            <View
              style={[
                iconWrapper,
                {
                  end,
                },
              ]}
              key={'crypto_icon' + item + index}>
              <View style={countImageView}>
                <Text style={counterText}>{`+${icons.length - maxDisplay
                  }`}</Text>
              </View>
            </View>
          );
        } else {
          return null;
        }
      })}
    </View>
  );
};

const size = 28;
const styles = theme =>
  StyleSheet.create({
    iconContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    iconWrapper: {
      width: size,
      height: size,
    },
    iconImg: {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 1,
      borderColor: 'white',
      overflow: 'hidden',
    },
    countImageView: {
      width: size,
      height: size,
      justifyContent: 'center',
      borderRadius: size / 2,
      backgroundColor: theme.background,
    },
    counterText: {
      alignSelf: 'center',
      fontSize: 12,
      color: 'white',
    },
  });

export default CoinIcons;
