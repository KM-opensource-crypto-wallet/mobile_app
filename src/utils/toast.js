import Toast from 'react-native-toast-message';
import {addBreadcrumb} from 'services/logger';

const TOAST_BREADCRUMB_LEVEL = {
  errorToast: 'error',
  warningToast: 'warning',
};

export const showToast = ({type, title, message, ...options}) => {
  // Every error/warning the user sees becomes context on the next report.
  const level = TOAST_BREADCRUMB_LEVEL[type];
  if (level) {
    addBreadcrumb('ui.toast', title, message ? {message} : undefined, level);
  }
  return Toast.show({
    type: type,
    text1: title,
    text2: message,
    ...options,
  });
};
