import {StyleSheet, Dimensions, Platform} from 'react-native';

const WIDTH = Dimensions.get('window').width;
const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const isIpad = WIDTH >= 768;
const ITEM_WIDTH = isIpad ? Math.round(WIDTH * 0.6) : Math.round(WIDTH * 0.88);

const MONOSPACE = Platform.select({ios: 'Menlo', android: 'monospace'});

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
    },
    scrollContent: {
      paddingHorizontal: 22,
      paddingTop: 26,
      paddingBottom: 22,
      alignItems: 'center',
    },
    iconBadge: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(229, 72, 77, 0.12)',
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
      marginBottom: 20,
    },
    card: {
      width: '100%',
      backgroundColor: theme.lightBackground,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.whiteOutline,
    },
    cardDanger: {
      borderColor: 'rgba(229, 72, 77, 0.5)',
      backgroundColor: 'rgba(229, 72, 77, 0.06)',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    cardLabel: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Medium',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    cardLabelDanger: {
      color: '#E5484D',
    },
    addressText: {
      color: theme.font,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: MONOSPACE,
    },
    addressHighlight: {
      color: '#E5484D',
      fontWeight: '700',
    },
    tipRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      width: '100%',
      marginTop: 2,
      marginBottom: 18,
    },
    tipText: {
      flex: 1,
      color: theme.gray,
      fontSize: 12,
      lineHeight: 17,
      fontFamily: 'Roboto-Regular',
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      paddingVertical: 6,
      marginBottom: 18,
    },
    checkboxText: {
      flex: 1,
      color: theme.font,
      fontSize: 14,
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
    cancelBtn: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: theme.whiteOutline,
    },
    cancelText: {
      color: theme.font,
      fontSize: 16,
      fontFamily: 'Roboto-Medium',
      fontWeight: '600',
    },
    continueBtn: {
      backgroundColor: theme.background,
    },
    continueBtnDisabled: {
      opacity: 0.45,
    },
    continueText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Roboto-Medium',
      fontWeight: '600',
    },
  });

export default myStyles;
