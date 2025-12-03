import React from 'react';
import {View, StyleSheet, Image} from 'react-native';
import FastImage from '@d11/react-native-fast-image';

const chainLogoMap = {
  aptos: require('../../assets/chain_logo/aptos.png'),
  arbitrum: require('../../assets/chain_logo/arbitrum.png'),
  avalanche: require('../../assets/chain_logo/avalanche.png'),
  base: require('../../assets/chain_logo/base.png'),
  binance_smart_chain: require('../../assets/chain_logo/binance_smart_chain.png'),
  cosmos: require('../../assets/chain_logo/cosmos.png'),
  ethereum: require('../../assets/chain_logo/ethereum.png'),
  ethereum_classic: require('../../assets/chain_logo/ethereum_classic.png'),
  ethereum_pow: require('../../assets/chain_logo/ethereum_pow.png'),
  fantom: require('../../assets/chain_logo/fantom.png'),
  gnosis: require('../../assets/chain_logo/gnosis.png'),
  ink: require('../../assets/chain_logo/ink.png'),
  kava: require('../../assets/chain_logo/kava.png'),
  linea: require('../../assets/chain_logo/linea.png'),
  optimism: require('../../assets/chain_logo/optimism.png'),
  optimism_binance_smart_chain: require('../../assets/chain_logo/optimism_binance_smart_chain.png'),
  polygon: require('../../assets/chain_logo/polygon.png'),
  ripple: require('../../assets/chain_logo/ripple.png'),
  solana: require('../../assets/chain_logo/solana.png'),
  stellar: require('../../assets/chain_logo/stellar.png'),
  tezos: require('../../assets/chain_logo/tezos.png'),
  ton: require('../../assets/chain_logo/ton.png'),
  tron: require('../../assets/chain_logo/tron.png'),
  viction: require('../../assets/chain_logo/viction.png'),
  zksync: require('../../assets/chain_logo/zksync.png'),
  sei: require('../../assets/chain_logo/sei.png'),
};

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
      <Image
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
