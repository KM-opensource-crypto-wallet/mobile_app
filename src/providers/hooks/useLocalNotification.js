import {useContext} from 'react';
import {LocalNotificationContext} from '../LocalNotificationProvider';

export const useLocalNotification = () => {
  const context = useContext(LocalNotificationContext);
  if (!context) {
    throw new Error(
      'useLocalNotification must be used within LocalNotificationProvider',
    );
  }
  return context;
};
