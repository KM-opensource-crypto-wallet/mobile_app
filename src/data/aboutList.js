import AboutAppIcon from 'assets/images/icons/aboutApp.svg';
import PrivacyPolicyIcon from 'assets/images/icons/privacyPolicy.svg';
import TcIcon from 'assets/images/icons/t&c.svg';

export const aboutApp = <AboutAppIcon width="30" height="30" fill="#7A7980" />;
export const privacyPolicy = (
  <PrivacyPolicyIcon width="30" height="30" fill="#7A7980" />
);
export const tc = <TcIcon width="30" height="30" fill="#7A7980" />;

export const aboutList = [
  {
    page: 'About App',
    icon: aboutApp,
  },
  {
    page: 'Terms & Conditions',
    icon: tc,
  },
  {
    page: 'Privacy Policy',
    icon: privacyPolicy,
  },
];
