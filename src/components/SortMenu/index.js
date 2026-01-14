import React, {useContext} from 'react';
import {View, TouchableOpacity, Text, Modal} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './SortMenuStyles';

const SortMenu = ({
  visible,
  onClose,
  onSelect,
  currentSort,
  position,
  sortOptions,
  title = 'Sort',
}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);

  const handleSelect = option => {
    onSelect(option);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.sortMenuBackdrop}
        activeOpacity={1}
        onPress={onClose}>
        <View
          style={[
            styles.sortMenuContainer,
            {top: position.top, right: position.right},
          ]}>
          <View style={styles.sortMenu}>
            <Text style={styles.sortMenuTitle}>{title}</Text>
            {sortOptions.map((option, index) => (
              <React.Fragment key={option.value}>
                {index === 0 && option.showDivider && (
                  <View style={styles.sortMenuDivider} />
                )}
                <TouchableOpacity
                  style={[
                    styles.sortMenuItem,
                    currentSort === option.value && styles.sortMenuItemActive,
                  ]}
                  onPress={() => handleSelect(option.value)}>
                  <Text
                    style={[
                      styles.sortMenuItemText,
                      currentSort === option.value &&
                        styles.sortMenuItemTextActive,
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
                {option.showDivider && index < sortOptions.length - 1 && (
                  <View style={styles.sortMenuDivider} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default SortMenu;
