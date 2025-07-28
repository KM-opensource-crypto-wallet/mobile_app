import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SCREEN_WIDTH} from 'utils/dimensions';
import FastImage from '@d11/react-native-fast-image';
import DefaultDokWalletImage from 'components/DefaultDokWalletImage';
import {setSelectedNft} from 'dok-wallet-blockchain-networks/redux/wallets/walletsSlice';

const NFTMainChainItem = ({item, theme, dispatch, navigation}) => {
  const styles = myStyles(theme);
  const [localImage, setLocalImage] = useState(item?.metadata?.image);

  useEffect(() => {
    setLocalImage(item?.metadata?.image);
  }, [item?.metadata?.image]);

  const onPressSelectedChain = useCallback(() => {
    dispatch(setSelectedNft(item));
    navigation.navigate('SendNFT');
  }, [dispatch, item, navigation]);

  return (
    <TouchableOpacity
      style={[styles.itemContainer]}
      onPress={onPressSelectedChain}>
      <View style={styles.mainImageView}>
        {localImage ? (
          <FastImage
            source={{uri: localImage}}
            style={styles.imageStyle}
            resizeMode={'contain'}
            onError={e => {
              setLocalImage(null);
            }}
          />
        ) : (
          <DefaultDokWalletImage height={60} width={60} />
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {item?.name || item?.symbol || 'No Name'}
      </Text>
      <Text style={styles.description} numberOfLines={1}>
        {item?.token_id || ''}
      </Text>
    </TouchableOpacity>
  );
};

const myStyles = theme =>
  StyleSheet.create({
    itemContainer: {
      borderWidth: 1,
      backgroundColor: theme.backgroundColor,
      borderColor: theme.headerBorder,
      borderRadius: 8,
      marginBottom: 16,
      width: (SCREEN_WIDTH - 50) / 2,
    },
    mainImageView: {
      flex: 1,
      height: (SCREEN_WIDTH - 50) / 2,
      borderRadius: 8,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    imageStyle: {
      height: '100%',
      width: '100%',
    },
    title: {
      color: theme.font,
      fontSize: 15,
      marginTop: 8,
      fontFamily: 'Roboto-Regular',
      marginHorizontal: 4,
    },
    description: {
      color: theme.primary,
      fontSize: 14,
      marginTop: 8,
      fontFamily: 'Roboto-Regular',
      marginHorizontal: 4,
      marginBottom: 8,
    },
  });

export default NFTMainChainItem;
