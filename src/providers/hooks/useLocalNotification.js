import {useContext} from 'react';
import {LocaoNotificationContext} from '../Provider';

export const useLocalNotification = () => {
  const context = useContext(LocaoNotificationContext);
  if (!context) {
    throw new Error(
      'useLocalNotification must be used within LocalNotificationProvider',
    );
  }
  return context;
};
