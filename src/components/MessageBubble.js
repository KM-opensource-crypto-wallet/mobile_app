import React, {useCallback, useContext, useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity as SimpleTouchableOpacity,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {SCREEN_HEIGHT, SCREEN_WIDTH} from 'utils/dimensions';
import IoniconsIcon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {ThemeContext} from 'theme/ThemeContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {isFetchingConversations} from 'dok-wallet-blockchain-networks/redux/messages/messageSelector';

const BUBBLE_SIZE = 56;
const PADDING = 25;
const ICON_SIZE = 32;

const MessageBubble = () => {
  const positionX = useSharedValue(SCREEN_WIDTH - PADDING);
  const [isOpen, setIsOpen] = useState(false);
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const navigation = useNavigation();
  const {bottom, top} = useSafeAreaInsets();
  const positionY = useSharedValue(SCREEN_HEIGHT - bottom - BUBBLE_SIZE - 130);
  const lastPositionY = useSharedValue(
    SCREEN_HEIGHT - bottom - BUBBLE_SIZE - 130,
  );
  const isFetchingConv = useSelector(isFetchingConversations);

  const safeHeight = SCREEN_HEIGHT - (top + bottom);
  const safeTop = top + 44 + 50;

  const onPressOpen = useCallback(() => {
    setIsOpen(prevState => !prevState);
    positionX.value = withTiming(SCREEN_WIDTH - (BUBBLE_SIZE + PADDING), {
      duration: 100,
    });
  }, [positionX]);

  const onPressClose = useCallback(() => {
    setIsOpen(prevState => !prevState);
    positionX.value = withTiming(SCREEN_WIDTH - PADDING, {
      duration: 100,
    });
  }, [positionX]);

  const onPressMessage = useCallback(() => {
    navigation.navigate('MessageList');
  }, [navigation]);

  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      const absoluteY = e.absoluteY;
      if (absoluteY > safeTop && absoluteY < safeHeight) {
        positionY.value = lastPositionY.value + e.translationY;
      }
    })
    .onEnd(() => {
      const tempPosition = positionY.value;
      positionY.value =
        tempPosition < 0
          ? 0
          : tempPosition > safeHeight
          ? safeHeight
          : tempPosition;
      lastPositionY.value = positionY.value;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: positionX.value}, {translateY: positionY.value}],
  }));
  return (
    <>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[styles.box, animatedStyle, isOpen && {paddingLeft: 12}]}>
          {isOpen ? (
            <>
              {isFetchingConv ? (
                <View style={styles.emptyViewStyle}>
                  <ActivityIndicator color={theme.background} />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.messageButtonStyle}
                  onPress={onPressMessage}>
                  <MaterialCommunityIcons
                    name={'message'}
                    size={ICON_SIZE}
                    color={theme.background}
                    style={styles.messageIconStyle}
                  />
                </TouchableOpacity>
              )}
              <SimpleTouchableOpacity onPress={onPressClose}>
                <IoniconsIcon
                  name={'chevron-forward'}
                  size={24}
                  color={theme.gray}
                />
              </SimpleTouchableOpacity>
            </>
          ) : (
            <SimpleTouchableOpacity
              onPress={onPressOpen}
              style={styles.rightIconContainer}>
              <IoniconsIcon
                name={'chevron-back'}
                size={ICON_SIZE}
                color={theme.background}
              />
            </SimpleTouchableOpacity>
          )}
        </Animated.View>
      </GestureDetector>
    </>
  );
};

const myStyles = theme =>
  StyleSheet.create({
    box: {
      position: 'absolute',
      height: BUBBLE_SIZE,
      width: 150,
      borderRadius: 100,
      zIndex: 9999,
      backgroundColor: theme.whiteOutline,
      alignItems: 'center',
      flexDirection: 'row',
    },
    rightIconContainer: {
      width: 100,
      height: 40,
      backgroundColor: theme.whiteOutline,
      borderRadius: 100,
      position: 'absolute',
      zIndex: 9999,
      marginTop: 8,
      justifyContent: 'center',
    },
    iconStyle: {
      marginTop: 12,
      position: 'absolute',
      zIndex: 9999,
    },
    messageIconStyle: {
      marginTop: 4,
    },
    messageButtonStyle: {
      marginRight: 12,
    },
    emptyViewStyle: {
      width: 32,
      marginRight: 12,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default MessageBubble;
