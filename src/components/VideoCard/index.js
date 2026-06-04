import React, {useContext} from 'react';
import {View, Text, Image, TouchableOpacity} from 'react-native';
import Video from 'react-native-video';
import IoniconsIcon from 'react-native-vector-icons/Ionicons';
import {ThemeContext} from 'theme/ThemeContext';
import {resolveThumbnail, isYouTubeVideo} from 'utils/videoUtils';
import myStyles from './VideoCardStyles';

const VideoCard = ({item, onPress, cardWidth}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme, cardWidth);
  const thumbnailUri = resolveThumbnail(item);
  const showVideoThumb = !thumbnailUri && !isYouTubeVideo(item?.video);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.8}>
      <View style={styles.thumbContainer}>
        {thumbnailUri ? (
          <Image
            source={{uri: thumbnailUri}}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : showVideoThumb ? (
          <Video
            source={{uri: item.video}}
            style={styles.thumbnail}
            resizeMode="cover"
            paused
            muted
            seek={0}
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbPlaceholder]} />
        )}
        <View style={styles.playOverlay}>
          <IoniconsIcon
            name="play-circle"
            size={40}
            color="rgba(255,255,255,0.9)"
          />
        </View>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {item.title || item.Title}
      </Text>
    </TouchableOpacity>
  );
};

export default VideoCard;
