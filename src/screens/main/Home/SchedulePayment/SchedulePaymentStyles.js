import {StyleSheet} from 'react-native';

// Shared form field styles live in components/SendFundsForm/SendFundsFormStyles;
// only the schedule-specific pieces are styled here.
const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      width: '100%',
    },
    contentContainerStyle: {
      flexGrow: 1,
      backgroundColor: theme.backgroundColor,
      paddingHorizontal: 20,
    },
    formInput: {
      marginTop: 24,
      flex: 1,
    },
    infoBanner: {
      marginTop: 20,
      padding: 12,
      borderRadius: 10,
      backgroundColor: theme.background + '12',
      borderWidth: 1,
      borderColor: theme.background + '30',
    },
    infoBannerText: {
      color: theme.font,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
      lineHeight: 18,
    },
    button: {
      backgroundColor: theme.background,
      height: 60,
      borderRadius: 10,
      fontSize: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      marginTop: 32,
    },
    buttonTitle: {
      color: theme.title,
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
    },
    sublabel: {
      color: theme.font,
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      marginBottom: 8,
      marginTop: 14,
      opacity: 0.8,
    },
    optionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    optionPill: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderWidth: 1.5,
      borderColor: theme.headerBorder,
      borderRadius: 20,
      backgroundColor: 'transparent',
    },
    optionPillSelected: {
      borderColor: theme.background,
      borderWidth: 2,
      backgroundColor: theme.background + '15',
    },
    optionPillText: {
      fontFamily: 'Roboto-Regular',
      fontSize: 13,
      color: theme.font,
      fontWeight: '600',
    },
    optionPillTextSelected: {
      color: theme.background,
    },
    dayChip: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: theme.headerBorder,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    dayChipSelected: {
      borderColor: theme.background,
      borderWidth: 2,
      backgroundColor: theme.background + '15',
    },
    dayChipText: {
      fontFamily: 'Roboto-Regular',
      fontSize: 13,
      color: theme.font,
      fontWeight: '600',
    },
    dayChipTextSelected: {
      color: theme.background,
    },
    customRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    customInput: {
      width: 90,
      height: 50,
      backgroundColor: theme.backgroundColor,
    },
  });

export default myStyles;
