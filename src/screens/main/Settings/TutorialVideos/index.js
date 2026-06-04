import React, {useContext, useCallback, useState} from 'react';
import {FlatList, View, Dimensions} from 'react-native';
import {useSelector} from 'react-redux';
import {getTutorialVideos} from 'dok-wallet-blockchain-networks/redux/cryptoProviders/cryptoProvidersSelectors';
import {ThemeContext} from 'theme/ThemeContext';
import {DokSafeAreaView} from 'components/DokSafeAreaView';
import VideoCard from 'components/VideoCard';
import VideoPlayer from 'components/VideoPlayer';
import myStyles from './TutorialVideosStyles';

const COLUMN_COUNT = 2;
const HORIZONTAL_PADDING = 24;
const COLUMN_GAP = 12;

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CARD_WIDTH =
  (SCREEN_WIDTH - HORIZONTAL_PADDING - COLUMN_GAP * (COLUMN_COUNT - 1)) /
  COLUMN_COUNT;

const TutorialVideos = () => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const videos = useSelector(getTutorialVideos);
  const [activeVideo, setActiveVideo] = useState(null);

  const onPressCard = useCallback(item => setActiveVideo(item), []);
  const onClosePlayer = useCallback(() => setActiveVideo(null), []);

  const renderItem = useCallback(
    ({item}) => (
      <VideoCard item={item} onPress={onPressCard} cardWidth={CARD_WIDTH} />
    ),
    [onPressCard],
  );

  const keyExtractor = useCallback(
    (item, index) => `${item.video}-${index}`,
    [],
  );

  const renderSeparator = useCallback(
    () => <View style={styles.separator} />,
    [styles],
  );

  return (
    <DokSafeAreaView
      style={[styles.container, {backgroundColor: theme.backgroundColor}]}>
      <FlatList
        data={videos}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={COLUMN_COUNT}
        columnWrapperStyle={styles.row}
        ItemSeparatorComponent={renderSeparator}
        contentContainerStyle={styles.listContent}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews
      />

      <VideoPlayer item={activeVideo} onClose={onClosePlayer} />
    </DokSafeAreaView>
  );
};

export default TutorialVideos;
