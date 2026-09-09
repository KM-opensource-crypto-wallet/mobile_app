import React, {useContext, useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import IoniconIcon from 'react-native-vector-icons/Ionicons';
import Checkbox from 'components/Checkbox';
import SponsoredGasInfoModal from 'components/SponsoredGasInfoModal';
import {ThemeContext} from 'theme/ThemeContext';
import myStyles from './SponsoredGasToggleStyles';

const SponsoredGasToggle = ({tokenSymbol, checked, onToggle}) => {
  const {theme} = useContext(ThemeContext);
  const styles = myStyles(theme);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <View style={styles.sponsoredGasRow}>
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={onToggle}
          style={styles.sponsoredGasLabelRow}>
          <Checkbox
            checked={checked}
            onChange={onToggle}
            size={24}
            customStyle={styles.sponsoredGasCheckbox}
          />
          <Text style={styles.sponsoredGasText}>
            {`Pay gas fees with ${tokenSymbol}`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowInfo(true)}
          style={styles.sponsoredGasInfoBtn}>
          <IoniconIcon
            name="information-circle-outline"
            size={20}
            color={theme.gray}
          />
        </TouchableOpacity>
      </View>
      <SponsoredGasInfoModal
        visible={showInfo}
        tokenSymbol={tokenSymbol}
        onClose={() => setShowInfo(false)}
      />
    </>
  );
};

export default SponsoredGasToggle;
