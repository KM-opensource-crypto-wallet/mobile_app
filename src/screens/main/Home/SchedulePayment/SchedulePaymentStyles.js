import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      width: '100%',
    },
    mainContainer: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      width: '100%',
      paddingHorizontal: 20,
    },
    formInput: {
      marginTop: 24,
      flex: 1,
    },
    title: {
      color: theme.gray,
      fontSize: 14,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
    },
    box: {
      flexDirection: 'row',
    },
    boxTitle: {
      color: theme.font,
      fontSize: 18,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
      fontWeight: 'bold',
      marginTop: 2,
    },
    boxBalance: {
      color: theme.gray,
      fontSize: 14,
      textAlign: 'left',
      fontFamily: 'Roboto-Regular',
    },
    label: {
      color: theme.font,
      fontSize: 14,
      fontFamily: 'Roboto-Regular',
      marginBottom: 6,
      marginTop: 16,
    },
    input: {
      backgroundColor: theme.backgroundColor,
    },
    inputView: {
      backgroundColor: theme.backgroundColor,
      position: 'relative',
      justifyContent: 'center',
    },
    btnMax: {
      position: 'absolute',
      top: 12,
      right: 16,
      backgroundColor: theme.background,
      width: 40,
      height: 20,
      borderRadius: 5,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    },
    btnText: {
      color: theme.backgroundColor,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
    },
    textConfirm: {
      marginTop: 4,
      color: 'red',
      marginLeft: 10,
      fontSize: 12,
      fontFamily: 'Roboto-Regular',
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
    doneButton: {
      backgroundColor: theme.background,
      height: 44,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
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
      backgroundColor: theme.backgroundColor,
    },
  });

export default myStyles;
