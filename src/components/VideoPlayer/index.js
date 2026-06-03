import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  Modal,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';
import Video from 'react-native-video';
import IoniconsIcon from 'react-native-vector-icons/Ionicons';
import {isYouTubeVideo, getYouTubeId} from 'utils/videoUtils';
import myStyles from './VideoPlayerStyles';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const VideoPlayer = ({item, onClose}) => {
  const styles = myStyles();
  const isPortrait = item?.orientation === 'portrait';
  const isYT = isYouTubeVideo(item?.video);
  const ytId = isYT ? getYouTubeId(item.video) : null;
  const yTVideoRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
  }, [item?.video]);

  const playerWidth = isPortrait ? SCREEN_WIDTH * 0.8 : SCREEN_WIDTH;
  const playerHeight = isPortrait
    ? playerWidth * (16 / 9)
    : playerWidth * (9 / 16);

  return (
    <Modal
      visible={!!item}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent>
      <StatusBar backgroundColor="#000" barStyle="light-content" />

      <View style={styles.container}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <IoniconsIcon name="close" size={28} color="#fff" />
        </TouchableOpacity>

        {item && (
          <View style={{width: playerWidth, height: playerHeight}}>
            {isYT ? (
              <YoutubeIframe
                ref={yTVideoRef}
                videoId={ytId}
                width={playerWidth}
                height={playerHeight}
                webViewProps={{
                  scrollEnabled: false,
                  overScrollMode: 'never',
                  injectedJavaScript: `
                    var element = document.getElementsByClassName('container')[0];
                    if (element) {
                      element.style.position = 'unset';
                      element.style.paddingBottom = 'unset';
                    }
                    true;
                  `,
                }}
                onReady={() => {
                  yTVideoRef?.current?.seekTo(0, true);
                  setLoading(false);
                }}
                initialPlayerParams={{modestbranding: true}}
                onError={e => {
                  console.warn('[YoutubeIframe] error', e);
                  setLoading(false);
                }}
              />
            ) : (
              <Video
                source={{uri: item.video}}
                style={styles.nativeVideo}
                controls
                resizeMode="contain"
                paused={false}
                ignoreSilentSwitch="obey"
                playInBackground={false}
                onReadyForDisplay={() => setLoading(false)}
                onError={e => {
                  console.warn('[Video] error', e);
                  setLoading(false);
                }}
              />
            )}
            {loading && (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
};

export default VideoPlayer;
