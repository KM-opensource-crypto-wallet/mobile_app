import React, {useContext} from 'react';
import Toast from 'react-native-toast-message';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {ThemeContext} from 'theme/ThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import IoniconsIcon from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import RpcErrorToast from 'components/RpcErrorToast';

const toastConfig = theme => {
  const myStyles = styles(theme);
  return {
    progressToast: ({text1, text2, props}) => (
      <View style={myStyles.progressView}>
        <TouchableOpacity
          hitSlop={{top: 6, bottom: 8, left: 8, right: 8}}
          style={myStyles.closeIconStyle}
          onPress={() => {
            Toast.hide();
          }}>
          <MaterialCommunityIcons name={'close'} size={24} color={'white'} />
        </TouchableOpacity>
        <View style={myStyles.containerView}>
          <View style={myStyles.leftView}>
            <ActivityIndicator size={'large'} color={'white'} />
          </View>
          <View style={myStyles.rightView}>
            <Text style={myStyles.titleColor} numberOfLines={1}>
              {text1}
            </Text>
            <Text style={myStyles.description} numberOfLines={2}>
              {text2}
            </Text>
          </View>
        </View>
        {!!props?.onViewTransaction && (
          <TouchableOpacity
            style={myStyles.viewTransactionBtn}
            onPress={() => {
              Toast.hide();
              props.onViewTransaction();
            }}>
            <Text style={myStyles.viewTransactionText}>
              View Transaction Details
            </Text>
            <IoniconsIcon name={'chevron-forward'} size={14} color={'white'} />
          </TouchableOpacity>
        )}
        <View style={myStyles.progressBottomBorder} />
      </View>
    ),
    successToast: ({text1, text2, props}) => (
      <View style={myStyles.progressView}>
        <TouchableOpacity
          hitSlop={{top: 6, bottom: 8, left: 8, right: 8}}
          style={myStyles.closeIconStyle}
          onPress={() => {
            Toast.hide();
          }}>
          <MaterialCommunityIcons name={'close'} size={24} color={'white'} />
        </TouchableOpacity>
        <View style={myStyles.containerView}>
          <View style={myStyles.leftView}>
            <MaterialCommunityIcons
              name={'check-decagram'}
              size={24}
              color={theme.successBottom}
            />
          </View>
          <View style={myStyles.rightView}>
            <Text style={myStyles.titleColor} numberOfLines={1}>
              {text1}
            </Text>
            <Text style={myStyles.description} numberOfLines={2}>
              {text2}
            </Text>
          </View>
        </View>
        <View style={myStyles.successBottomBorder} />
      </View>
    ),
    errorToast: ({text1, text2, props}) => (
      <View style={myStyles.progressView}>
        <TouchableOpacity
          hitSlop={{top: 6, bottom: 8, left: 8, right: 8}}
          style={myStyles.closeIconStyle}
          onPress={() => {
            Toast.hide();
          }}>
          <MaterialCommunityIcons name={'close'} size={24} color={'white'} />
        </TouchableOpacity>
        <View style={myStyles.containerView}>
          <View style={myStyles.leftView}>
            <MaterialCommunityIcons
              name={'alert-circle'}
              size={24}
              color={'#FB0024'}
            />
          </View>
          <View style={myStyles.rightView}>
            <Text style={myStyles.titleColor} numberOfLines={1}>
              {text1}
            </Text>
            <Text style={myStyles.description} numberOfLines={2}>
              {text2}
            </Text>
          </View>
        </View>
        <View style={myStyles.errorBottomBorder} />
      </View>
    ),
    warningToast: ({text1, text2, props}) => (
      <View style={myStyles.progressView}>
        <TouchableOpacity
          hitSlop={{top: 6, bottom: 8, left: 8, right: 8}}
          style={myStyles.closeIconStyle}
          onPress={() => {
            Toast.hide();
          }}>
          <MaterialCommunityIcons name={'close'} size={24} color={'white'} />
        </TouchableOpacity>
        <View style={myStyles.containerView}>
          <View style={myStyles.leftView}>
            <IoniconsIcon
              name={'warning'}
              size={24}
              color={theme.warningBottom}
            />
          </View>
          <View style={myStyles.rightView}>
            <Text style={myStyles.titleColor} numberOfLines={1}>
              {text1}
            </Text>
            <Text style={myStyles.description} numberOfLines={2}>
              {text2}
            </Text>
          </View>
        </View>
        <View style={myStyles.warningBottomBorder} />
      </View>
    ),
    rpcError: ({props}) => (
      <RpcErrorToast
        visible={true}
        chain_name={props?.chain_name}
        chainDisplayName={props?.chainDisplayName}
        hasCustomRpc={props?.hasCustomRpc}
        onDismiss={() => Toast.hide()}
      />
    ),
    messageToast: ({text1, text2, ...props}) => (
      <TouchableOpacity
        style={myStyles.messageContainerView}
        onPress={() => {
          Toast.hide();
          props?.onPress && props.onPress();
        }}>
        <TouchableOpacity
          hitSlop={{top: 6, bottom: 8, left: 8, right: 8}}
          style={myStyles.closeIconStyle}
          onPress={() => {
            Toast.hide();
          }}>
          <MaterialCommunityIcons name={'close'} size={24} color={theme.font} />
        </TouchableOpacity>
        <Text style={myStyles.messageTitleStyle} numberOfLines={1}>
          {text1}
        </Text>
        <Text style={myStyles.messageDescriptionStyle} numberOfLines={2}>
          {text2}
        </Text>
      </TouchableOpacity>
    ),
  };
};

const Toasts = ({bottomOffset = 0}) => {
  const {theme} = useContext(ThemeContext);
  const {top} = useSafeAreaInsets();
  return (
    <Toast
      config={toastConfig(theme)}
      position={'bottom'}
      topOffset={top}
      {...(bottomOffset ? {bottomOffset} : {})}
    />
  );
};
const styles = theme =>
  StyleSheet.create({
    progressView: {
      minHeight: 90,
      width: '100%',
      backgroundColor: theme.toastBackground,
    },
    viewTransactionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: 14,
      paddingBottom: 8,
      gap: 4,
    },
    viewTransactionText: {
      fontSize: 13,
      color: 'white',
      fontFamily: 'Roboto',
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    containerView: {
      flex: 1,
      flexDirection: 'row',
    },
    titleColor: {
      fontSize: 18,
      color: 'white',
      fontWeight: 'bold',
      fontFamily: 'Roboto-Bold',
      marginBottom: 8,
      paddingRight: 25,
    },
    description: {
      fontSize: 14,
      color: '#FAF9F6',
      fontWeight: '600',
      fontFamily: 'Roboto',
      flex: 1,
    },
    progressBottomBorder: {
      height: 8,
      width: '100%',
      backgroundColor: theme.progressBottom,
    },
    successBottomBorder: {
      height: 8,
      width: '100%',
      backgroundColor: theme.successBottom,
    },
    warningBottomBorder: {
      height: 8,
      width: '100%',
      backgroundColor: theme.warningBottom,
    },
    errorBottomBorder: {
      height: 8,
      width: '100%',
      backgroundColor: '#FB0024',
    },
    leftView: {
      width: '20%',
      height: '100%',
      backgroundColor: theme.leftToastBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rightView: {
      flex: 1,
      paddingTop: 12,
      paddingLeft: 12,
      paddingRight: 12,
    },
    closeIconStyle: {
      position: 'absolute',
      right: 8,
      top: 6,
      zIndex: 99999999,
    },
    messageContainerView: {
      width: '90%',
      backgroundColor: theme.backgroundColor,
      alignSelf: 'center',
      paddingHorizontal: 16,
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 8,
      shadowColor: '#C0C0C0',
      shadowOffset: {width: 0, height: 5},
      shadowOpacity: 1,
      shadowRadius: 5,
      elevation: 12,
    },
    messageTitleStyle: {
      fontSize: 15,
      color: theme.font,
      fontWeight: 'bold',
      fontFamily: 'Roboto-Bold',
      marginBottom: 8,
      paddingRight: 25,
    },
    messageDescriptionStyle: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '600',
      fontFamily: 'Roboto',
      flex: 1,
    },
  });
export default Toasts;
