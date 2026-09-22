import React from 'react';
import LoginComponent from 'components/LoginComponent';
import {usePreventScreenshot} from 'hooks/usePreventScreenshot';

export const LoginScreen = () => {
  // The password field is the one thing a screen recorder must never see.
  usePreventScreenshot();
  return <LoginComponent />;
};
