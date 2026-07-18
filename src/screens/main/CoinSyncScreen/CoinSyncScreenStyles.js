import {Dimensions, StyleSheet} from 'react-native';

const isIpad = Dimensions.get('window').width >= 768;

const myStyles = theme =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    // Mirrors the router's shared headerLeftStyle so the back button sits
    // exactly like every other stack screen's.
    headerBackButton: {
      paddingLeft: isIpad ? 50 : 11,
    },
    container: {
      flex: 1,
    },
    headerContainer: {
      padding: 16,
      paddingTop: 24,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 28,
      gap: 12,
    },
    card: {
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 16,
    },
    cardFound: {
      backgroundColor: '#4CAF50' + '15',
    },
    cardEmpty: {
      backgroundColor: theme.gray + '15',
    },
    number: {
      fontSize: 28,
      fontFamily: 'Roboto-Regular',
      fontWeight: '700',
    },
    numberFound: {
      color: '#4CAF50',
    },
    numberEmpty: {
      color: theme.gray,
    },
    label: {
      fontSize: 13,
      fontFamily: 'Roboto-Regular',
      color: theme.gray,
      marginTop: 4,
    },
    listContent: {
      paddingBottom: 100,
      paddingHorizontal: 16,
    },
    resultsHeader: {
      fontSize: 16,
      fontFamily: 'Roboto-Regular',
      fontWeight: '600',
      color: theme.font,
    },
  });

export default myStyles;
