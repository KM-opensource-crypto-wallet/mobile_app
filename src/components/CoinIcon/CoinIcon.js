import React, {useContext} from 'react';
import {View, StyleSheet, Image} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import ChainIcon from 'components/ChainIcon/ChainIcon';
import {ThemeContext} from 'theme/ThemeContext';

const CoinIcon = ({item}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  return (
    <View style={styles.iconBox}>
      {item?.icon && (
        <FastImage
          source={{uri: item?.icon}}
          resizeMode={'contain'}
          style={styles.imageStyle}
        />
      )}
      <ChainIcon chainName={item?.chain_name} itemType={item?.type} size={20} />
    </View>
  );
};

const myStyles = theme =>
  StyleSheet.create({
    iconBox: {
      width: 39,
      height: 39,
      color: theme.backgroundColor,
      backgroundColor: theme.font,
      borderRadius: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
      position: 'relative',
    },
    imageStyle: {
      height: '100%',
      width: '100%',
      borderRadius: 20,
    },
  });

export default React.memo(CoinIcon, (prevProps, nextProps) => {
  return (
    prevProps.item?.icon === nextProps.item?.icon &&
    prevProps.item?.chain_name === nextProps.item?.chain_name &&
    prevProps.item?.type === nextProps.item?.type
  );
});
