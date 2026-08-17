import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 32,
    },
    swapCard: {
      backgroundColor: theme.lightBackground,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.whiteOutline,
      padding: 20,
    },
    swapCardHeader: {
      alignItems: 'center',
      marginBottom: 20,
    },
    logoCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      overflow: 'hidden',
      backgroundColor: theme.backgroundColor,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    logo: {
      height: '100%',
      width: '100%',
    },
    amountBlock: {
      paddingHorizontal: 4,
    },
    amountLabel: {
      color: theme.gray,
      fontSize: 11,
      fontFamily: 'Roboto-Medium',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    amountTextBox: {
      marginLeft: 10,
      flexShrink: 1,
    },
    chainNameText: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      marginTop: 2,
    },
    amountValue: {
      color: theme.font,
      fontSize: 22,
      fontFamily: 'Roboto-Bold',
      flexShrink: 1,
    },
    arrowDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 14,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.whiteOutline,
    },
    arrowChip: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.background + '14',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 10,
    },
    metaFooter: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      textAlign: 'center',
      marginTop: 18,
    },
    pendingHintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      gap: 5,
    },
    pendingHint: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
    },
    sectionTitle: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Medium',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginTop: 20,
      marginBottom: 8,
      marginLeft: 4,
    },
    sectionCard: {
      backgroundColor: theme.lightBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.whiteOutline,
      paddingHorizontal: 16,
      paddingVertical: 2,
    },
  });

export default myStyles;
