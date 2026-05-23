import {StyleSheet, Dimensions} from 'react-native';

const WIDTH = Dimensions.get('window').width;

const myStyles = theme =>
  StyleSheet.create({
    scrollContent: {
      paddingVertical: 8,
    },
    emptySection: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 40,
      paddingHorizontal: 24,
    },
    info: {
      color: theme.gray,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      marginTop: 20,
      textAlign: 'center',
      lineHeight: 20,
    },
    card: {
      marginHorizontal: 16,
      marginVertical: 5,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.gray + '28',
      paddingHorizontal: 14,
      paddingVertical: 12,
      overflow: 'hidden',
    },
    cardInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      gap: 5,
    },
    titleText: {
      color: theme.font,
      fontSize: 15,
      fontFamily: 'Roboto-Medium',
      fontWeight: '600',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    dateText: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
    },
    statusPill: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    statusPillText: {
      fontSize: 10,
      fontFamily: 'Roboto-Medium',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    amountBox: {
      alignItems: 'flex-end',
      flexShrink: 1,
      maxWidth: 130,
    },
    amountText: {
      fontSize: 13,
      fontFamily: 'Roboto-Medium',
      fontWeight: '600',
      textAlign: 'right',
    },
    fiatText: {
      color: theme.gray,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      marginTop: 2,
    },
    dashText: {
      fontSize: 18,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
    },
    rowView: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.gray + '20',
    },
    button: {
      height: 36,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      marginHorizontal: 4,
      flexDirection: 'row',
      gap: 8,
      flex: 1,
    },
    buttonTitle: {
      color: 'white',
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
    },
    // Keep section for any legacy references
    section: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default myStyles;
