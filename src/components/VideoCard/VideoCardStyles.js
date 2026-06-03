import {StyleSheet, Platform} from 'react-native';

const ASPECT_RATIO = 9 / 16; // thumbnail height relative to card width

const myStyles = (theme, cardWidth) =>
  StyleSheet.create({
    card: {
      width: cardWidth,
      borderRadius: 10,
      overflow: 'visible',
      backgroundColor: theme.secondaryBackgroundColor || theme.backgroundColor,
      ...Platform.select({
        ios: {
          shadowColor: theme.font,
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.15,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    thumbContainer: {
      width: cardWidth,
      height: cardWidth * ASPECT_RATIO,
      position: 'relative',
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      overflow: 'hidden',
    },
    thumbnail: {
      width: '100%',
      height: '100%',
    },
    thumbPlaceholder: {
      backgroundColor: '#1a1a1a',
    },
    playOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.18)',
    },
    title: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.font,
      padding: 8,
      lineHeight: 16,
      fontFamily: 'Roboto-Medium',
    },
  });

export default myStyles;
