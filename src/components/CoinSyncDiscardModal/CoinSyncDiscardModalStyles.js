import {StyleSheet, Dimensions} from 'react-native';

const WIDTH = Dimensions.get('window').width;
const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const isIpad = WIDTH >= 768;
const ITEM_WIDTH = isIpad ? Math.round(WIDTH * 0.6) : Math.round(WIDTH * 0.88);

// Danger/warn accents are hardcoded brand-neutral hex so they read correctly in
// both dokwallet (orange) and kimlwallet (blue) themes.
const WARN = '#F5A623';
const DANGER = '#E5484D';

const myStyles = theme =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    modalContainer: {
      backgroundColor: theme.secondaryBackgroundColor,
      width: ITEM_WIDTH,
      maxHeight: SCREEN_HEIGHT * 0.85,
      alignSelf: 'center',
      borderRadius: 24,
      overflow: 'hidden',
      paddingHorizontal: 22,
      paddingTop: 26,
      paddingBottom: 22,
      alignItems: 'center',
    },
    iconBadge: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(245, 166, 35, 0.12)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      color: theme.font,
      fontSize: 20,
      fontFamily: 'Roboto-Medium',
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      color: theme.gray,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'Roboto-Regular',
      textAlign: 'center',
      marginBottom: 18,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      width: '100%',
      backgroundColor: theme.lightBackground,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 22,
      borderWidth: 1,
      borderColor: theme.whiteOutline,
    },
    infoText: {
      flex: 1,
      color: theme.gray,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: 'Roboto-Regular',
    },
    btnRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      width: '100%',
    },
    btn: {
      flex: 1,
      height: 52,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    discardBtn: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: DANGER,
    },
    discardText: {
      color: DANGER,
      fontSize: 16,
      fontFamily: 'Roboto-Medium',
      fontWeight: '600',
    },
    stayBtn: {
      backgroundColor: theme.background,
    },
    stayText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Roboto-Medium',
      fontWeight: '600',
    },
  });

export {WARN, DANGER};
export default myStyles;
