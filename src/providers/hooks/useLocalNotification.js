import {useContext} from 'react';
import {locaoNotificationContext} from '../Provider';

export const useLocalNotification = () => {
  const context = useContext(locaoNotificationContext);
  if (!context) {
    throw new Error(
      'useLocalNotification must be used within LocalNotificationProvider',
    );
  }
  return context;
};
