import {StyleSheet} from 'react-native';

const myStyles = theme =>
  StyleSheet.create({
    container: {
      width: '100%',
      backgroundColor: theme.toastBackground,
      overflow: 'hidden',
    },
    topRow: {
      flexDirection: 'row',
      minHeight: 72,
    },
    iconPanel: {
      width: '18%',
      backgroundColor: theme.leftToastBackground,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 68, 68, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    contentArea: {
      flex: 1,
      paddingTop: 10,
      paddingBottom: 10,
      paddingLeft: 12,
      paddingRight: 36,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 3,
    },
    titleBadge: {
      backgroundColor: 'rgba(255, 68, 68, 0.18)',
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginRight: 6,
    },
    titleBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FF4444',
      fontFamily: 'Roboto-Bold',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    chainName: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
      fontFamily: 'Roboto-Bold',
      flexShrink: 1,
    },
    message: {
      fontSize: 12,
      color: '#C8C8D0',
      fontFamily: 'Roboto',
      lineHeight: 17,
      marginBottom: 8,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    primaryButton: {
      backgroundColor: theme.background,
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    primaryButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
      fontFamily: 'Roboto-Bold',
    },
    secondaryButton: {
      borderRadius: 6,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    secondaryButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#C8C8D0',
      fontFamily: 'Roboto',
    },
    closeButton: {
      position: 'absolute',
      right: 8,
      top: 8,
      zIndex: 10,
      padding: 4,
    },
    bottomBorder: {
      height: 4,
      width: '100%',
      backgroundColor: '#FF4444',
    },
  });

export default myStyles;
