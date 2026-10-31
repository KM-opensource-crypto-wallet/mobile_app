import React, {useContext} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {ThemeContext} from 'theme/ThemeContext';
import {
  getWalletConnectVerifyStatus,
  isRiskyVerifyStatus,
  verifyHost,
} from 'dok-wallet-blockchain-networks/helper/walletConnectVerify';

const DANGER = '#E5484D';
const VERIFIED = '#2E9E5B';

const describe = (status, origin, appUrl) => {
  const host = verifyHost(origin) || verifyHost(appUrl);
  switch (status) {
    case 'verified':
      return {icon: 'shield-check', label: 'Verified site', detail: host};
    case 'mismatch':
      return {
        icon: 'shield-alert',
        label: 'Domain mismatch',
        detail: `This request comes from ${
          verifyHost(origin) || 'another site'
        }, not ${
          verifyHost(appUrl) || 'the app it claims to be'
        }. It may be impersonating that app.`,
      };
    case 'scam':
      return {
        icon: 'shield-alert',
        label: 'Known security risk',
        detail: `${
          host || 'This site'
        } is flagged as malicious. Reject unless you are certain.`,
      };
    default:
      return {
        icon: 'shield-outline',
        label: 'Unverified site',
        detail: `WalletConnect can't confirm this site. Only continue if you trust ${
          host || 'it'
        }.`,
      };
  }
};

/**
 * WalletConnect Verify API result for a connection or request. Risky results
 * (scam, domain mismatch) are shown in red; pass `onToggleAcknowledged` to
 * render the "I understand" checkbox the caller gates approval on.
 */
const WalletConnectVerifyBadge = ({
  verifyContext,
  appUrl,
  acknowledged,
  onToggleAcknowledged,
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const {status, origin} = getWalletConnectVerifyStatus(verifyContext);
  const risky = isRiskyVerifyStatus(status);
  const color = risky ? DANGER : status === 'verified' ? VERIFIED : theme.gray;
  const {icon, label, detail} = describe(status, origin, appUrl);

  return (
    <View style={[styles.box, risky && styles.riskyBox]}>
      <View style={styles.row}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
        <Text style={[styles.label, {color}]}>{label}</Text>
      </View>
      {!!detail && (
        <Text style={[styles.detail, risky && {color: DANGER}]}>{detail}</Text>
      )}
      {risky && !!onToggleAcknowledged && (
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={onToggleAcknowledged}
          activeOpacity={0.7}>
          <MaterialCommunityIcons
            name={acknowledged ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={22}
            color={acknowledged ? theme.background : theme.gray}
          />
          <Text style={styles.checkboxText}>
            {'I understand the risk and want to continue'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default WalletConnectVerifyBadge;

const myStyles = theme =>
  StyleSheet.create({
    box: {
      alignSelf: 'stretch',
      marginHorizontal: '5%',
      marginTop: 10,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.gray + '40',
    },
    riskyBox: {
      borderColor: DANGER,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    label: {
      fontSize: 14,
      fontFamily: 'Roboto-Medium',
      fontWeight: '600',
    },
    detail: {
      marginTop: 4,
      fontSize: 12,
      color: theme.gray,
      fontFamily: 'Roboto-Regular',
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 10,
    },
    checkboxText: {
      flex: 1,
      fontSize: 13,
      color: theme.font,
      fontFamily: 'Roboto-Regular',
    },
  });
