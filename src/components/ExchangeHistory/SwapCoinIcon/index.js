import React, {useContext} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import ChainIcon from 'components/ChainIcon/ChainIcon';
import {ThemeContext} from 'theme/ThemeContext';

// Round coin icon with a chain badge, for swap history where only
// symbol + chain_name are known. Falls back to a symbol monogram when the
// coin's icon URL can't be resolved. itemType="token" forces ChainIcon to
// render the badge even for native coins — in a swap row the chain is the
// information, not a redundancy.
const SwapCoinIcon = ({icon, symbol, chainName, size = 28}) => {
  const {theme} = useContext(ThemeContext);
  const round = {width: size, height: size, borderRadius: size / 2};

  return (
    <View style={round}>
      {icon ? (
        <FastImage source={{uri: icon}} resizeMode={'contain'} style={round} />
      ) : (
        <View
          style={[
            styles.monogram,
            round,
            {backgroundColor: theme.background + '18'},
          ]}>
          <Text
            style={[
              styles.monogramText,
              {color: theme.background, fontSize: Math.max(size * 0.26, 9)},
            ]}
            numberOfLines={1}>
            {symbol?.slice(0, 4) || '—'}
          </Text>
        </View>
      )}
      <ChainIcon
        chainName={chainName}
        itemType={'token'}
        size={Math.round(size / 2)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  monogram: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: {
    fontFamily: 'Roboto-Bold',
  },
});

export default React.memo(SwapCoinIcon);
