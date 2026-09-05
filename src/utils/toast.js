import Toast from 'react-native-toast-message';

export const showToast = ({type, title, message, ...options}) => {
  return Toast.show({
    type: type,
    text1: title,
    text2: message,
    ...options,
  });
};
