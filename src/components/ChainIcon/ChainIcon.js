import React from 'react';
import {View, StyleSheet} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {chainLogoMap} from 'assets/chain_logo';

const ChainIcon = ({chainName, itemType, size = 20}) => {
  if (itemType !== 'token' || !chainName) {
    return null;
  }

  const chainLogo = chainLogoMap[chainName.toLowerCase()];

  if (!chainLogo) {
    return null;
  }

  return (
    <View style={[styles.container, {width: size, height: size}]}>
      <FastImage
        source={chainLogo}
        resizeMode="contain"
        style={[styles.chainIcon, {width: size, height: size}]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chainIcon: {
    borderRadius: 20,
  },
});

export default ChainIcon;
