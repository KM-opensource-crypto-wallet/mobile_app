import React, { useState, useRef, useContext } from 'react';
import { View, Image, Text, TouchableOpacity } from 'react-native';
import Swiper from 'react-native-swiper';
import data from '../../data/data';
import myStyles from './CarouselCardsStyles';
import { useFloatingHeight } from '../../utils/dimensions';
import { ThemeContext } from '../../theme/ThemeContext';
import { DokSafeAreaView } from '../../components/DokSafeAreaView';

export const CarouselCards = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const styles = myStyles(theme);
  const floatingHeight = useFloatingHeight();
  const [index, setIndex] = useState(0);
  const swiperRef = useRef(null);

  const handleSkip = () => {
    swiperRef.current.scrollBy(data.length - 1, true);
  };

  const handleNext = () => {
    if (index < data.length - 1) {
      swiperRef.current.scrollBy(1, true);
    }
  };

  return (
    <DokSafeAreaView style={styles.safeAreaView}>
      <View style={styles.container}>
        <Swiper
          ref={swiperRef}
          loop={false}
          showsPagination={false}
          onIndexChanged={index => setIndex(index)}>
          {data.map((item, index) => (
            <View style={styles.caruselList} key={index}>
              <View style={styles.box}>
                <Image source={item.src} />
              </View>
              <View style={styles.header}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
              </View>
            </View>
          ))}
        </Swiper>

        <View
          style={
            index === data.length - 1
              ? styles.hidden
              : {
                ...styles.paginationContainer,
                marginBottom: floatingHeight > 400 ? 40 : 20,
              }
          }>
          <TouchableOpacity
            onPress={handleSkip}
            hitSlop={{ top: 12, left: 12, right: 12, bottom: 12 }}>
            <Text style={{ ...styles.btn }}>Skip</Text>
          </TouchableOpacity>

          <View style={styles.paginationDotsContainer}>
            {data.map((_, subIndex) => (
              <View
                key={'pagination_dots_' + subIndex}
                style={[
                  styles.paginationDot,
                  index === subIndex ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            ))}
          </View>
          <TouchableOpacity onPress={handleNext}>
            <Text
              style={{
                ...styles.btn,
                color: theme.borderActiveColor,
              }}>
              Next
            </Text>
          </TouchableOpacity>
        </View>

        {index === data.length - 1 && (
          <View style={styles.section}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Registration')}
              style={{
                ...styles.button,
                marginBottom: floatingHeight > 400 ? 20 : 0,
              }}>
              <Text style={styles.buttonTitle}>Get Started</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </DokSafeAreaView>
  );
};
