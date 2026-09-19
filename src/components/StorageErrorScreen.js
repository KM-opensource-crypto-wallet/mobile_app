import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {MIGRATION_ERROR_CODES} from 'redux/storage/migrateLegacyRoot2';

// Shown by App.js when the storage bootstrap fails. Deliberately has no
// dependency on the redux store or the theme provider: neither exists yet.
// Never falls through to the app with an empty store, which would route a
// funded user to onboarding.
const messageFor = error => {
  switch (error?.code) {
    case MIGRATION_ERROR_CODES.PARSE:
    case MIGRATION_ERROR_CODES.VERIFY:
      return (
        'Your stored wallet data could not be upgraded. Nothing has been ' +
        'changed or deleted. Please try again; if this keeps happening, ' +
        'reinstall the previous version or contact support before resetting.'
      );
    case 'unavailable':
      return (
        'Secure storage is not available right now. Unlock your device and ' +
        'try again.'
      );
    default:
      return 'Local storage could not be opened. Please try again.';
  }
};

export default function StorageErrorScreen({error, onRetry}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Storage problem</Text>
      <Text style={styles.message}>{messageFor(error)}</Text>
      {error?.code ? <Text style={styles.code}>Code: {error.code}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
  },
  title: {fontSize: 20, fontWeight: '600', marginBottom: 12, color: '#111111'},
  message: {
    fontSize: 15,
    textAlign: 'center',
    color: '#333333',
    lineHeight: 22,
  },
  code: {marginTop: 12, fontSize: 12, color: '#777777'},
  button: {
    marginTop: 28,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
    backgroundColor: '#111111',
  },
  buttonText: {color: '#ffffff', fontSize: 15, fontWeight: '600'},
});
