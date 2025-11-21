import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { Appearance } from 'react-native';
import { getAsyncStorageData, storeAsyncStorageData } from 'utils/asyncStorage';
import { wlName } from 'utils/wlData';

const ThemeContext = createContext();
const WL_COLORS = {
  dokwallet: { background: '#F44D03' },
  kimlwallet: { background: '#4F8DD8' },
};

const DYNAMIC_COLOR = WL_COLORS[wlName] ?? WL_COLORS.dokwallet;
const lightTheme = {
  ...DYNAMIC_COLOR,
  font: '#000000',
  primary: '#4D4A49',
  lightBackground: '#F5F5F5',
  disabledItem: '#DDDDDD',
  backgroundColor: '#FFFFFF',
  gray: '#999694',
  whiteOutline: '#E6E2E1',
  title: '#FFFFFF',
  borderActiveColor: '#222',
  carouselPoints: 'rgba(0,0,0,.2)',
  secondaryBackgroundColor: '#FFFFFF',
  fontSecondary: '#000000',
  headerBorder: '#B7B7B7',
  sidebarIcon: '#989898',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  walletItemColor: '#EFEDF4',
  toastBackground: '#232441',
  progressBottom: '#2650F4',
  leftToastBackground: '#191B26',
  successBottom: '#71C441',
  warningBottom: '#ffcc00',
  blue: '#006ee6',
};

const darkTheme = {
  ...DYNAMIC_COLOR,
  font: '#FFFFFF',
  primary: '#FFFFFF',
  lightBackground: '#333333',
  disabledItem: '#111111',
  backgroundColor: '#121212',
  gray: '#999694',
  whiteOutline: '#333130',
  title: '#FFFFFF',
  borderActiveColor: '#FFFFFF',
  carouselPoints: '#FFFFFF',
  secondaryBackgroundColor: '#333130',
  fontSecondary: '#000000',
  headerBorder: '#B7B7B7',
  sidebarIcon: '#FFFFFF',
  backdrop: 'rgba(255, 255, 255, 0.1)',
  walletItemColor: '#242428',
  toastBackground: '#232441',
  progressBottom: '#2650F4',
  leftToastBackground: '#191B26',
  successBottom: '#71C441',
  warningBottom: '#ffcc00',
  blue: '#006ee6',
};

const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(
    Appearance.getColorScheme() === 'dark',
  );
  const [selectedTheme, setSelectedTheme] = useState('System Default');
  const selectedThemeRef = useRef('System Default');
  const systemColorSchema = useRef('');

  const onChangeSelectedTheme = useCallback(value => {
    setSelectedTheme(value);
    storeAsyncStorageData('theme', value).then();
    selectedThemeRef.current = value;
    if (value === 'Dark Theme') {
      setIsDarkMode(true);
      Appearance.setColorScheme('dark');
    } else if (value === 'Light Theme') {
      setIsDarkMode(false);
      Appearance.setColorScheme('light');
    } else if (value === 'System Default') {
      Appearance.setColorScheme(null);
      setIsDarkMode(systemColorSchema.current === 'dark');
    }
  }, []);

  useEffect(() => {
    getAsyncStorageData('theme').then(value => {
      if (value) {
        onChangeSelectedTheme(value);
      }
    });
    systemColorSchema.current = Appearance.getColorScheme();
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (selectedThemeRef.current === 'System Default') {
        setIsDarkMode(colorScheme === 'dark');
      }
    });

    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{ theme, selectedTheme, onChangeSelectedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};


export {
  ThemeContext,
  ThemeProvider,
  darkTheme,
  lightTheme
}