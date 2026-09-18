import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {Appearance} from 'react-native';
import {getAsyncStorageData, storeAsyncStorageData} from 'utils/asyncStorage';
import {wlName} from 'utils/wlData';
import {lighten, withAlpha} from 'components/ui/color';

export const ThemeContext = createContext();

export const ThemeProvider = ({children}) => {
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
    const subscription = Appearance.addChangeListener(({colorScheme}) => {
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
      value={{theme, isDarkMode, selectedTheme, onChangeSelectedTheme}}>
      {children}
    </ThemeContext.Provider>
  );
};

const DOK_COLOR = {
  background: '#F44D03',
};

const KIML_COLOR = {
  background: '#4F8DD8',
};

const WL_COLORS = {
  dokwallet: DOK_COLOR,
  kimlwallet: KIML_COLOR,
};

const DYNAMIC_COLOR = WL_COLORS[wlName] || WL_COLORS.dokwallet;

// The Login design specifies #FF5E12 as the button-gradient top stop and
// #FF6A2B as the dark-mode link colour. Both are derived from the brand accent
// rather than hard-coded, so the kimlwallet build stays blue.
const ACCENT = DYNAMIC_COLOR.background;
const ACCENT_TOP = lighten(ACCENT, 0.06);
const ACCENT_LINK = lighten(ACCENT, 0.09);

export const lightTheme = {
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
  error: '#f44336',
  success: '#4CAF50',
  warning: '#FF9800',
  disabledButton: '#708090',

  // --- Login design tokens ---
  accentTop: ACCENT_TOP,
  accentLink: ACCENT,
  accentGlow: withAlpha(ACCENT, 0.13),
  bgGradient: ['#FBF8F5', '#F6F0EA', '#F3EBE3'],
  textPrimary: '#1A1613',
  textMuted: '#6E655E',
  textFaint: '#8A7F76',
  glassFill: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(26, 22, 19, 0.08)',
  glassHighlight: 'rgba(26, 22, 19, 0.06)',
  sheetBg: '#FFFFFF',
  sheetInputBg: 'rgba(26, 22, 19, 0.04)',
  sheetBorder: 'rgba(26, 22, 19, 0.12)',
  sheetHandle: 'rgba(26, 22, 19, 0.2)',
  scrim: 'rgba(20, 14, 10, 0.45)',
  danger: '#D92D20',
  dangerTop: '#E5372B',
  dangerSurface: 'rgba(217, 45, 32, 0.1)',
  positive: '#12B76A',
};

export const darkTheme = {
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
  error: '#f44336',
  success: '#4CAF50',
  warning: '#FF9800',
  disabledButton: '#708090',

  // --- Login design tokens ---
  accentTop: ACCENT_TOP,
  accentLink: ACCENT_LINK,
  accentGlow: withAlpha(ACCENT, 0.18),
  bgGradient: ['#17130F', '#120E0B', '#0E0B09'],
  textPrimary: '#F5F1EC',
  textMuted: '#A89C92',
  textFaint: '#A89C92',
  glassFill: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassHighlight: 'rgba(255, 255, 255, 0.08)',
  sheetBg: '#1F1F23',
  sheetInputBg: '#141417',
  sheetBorder: '#3A3A42',
  sheetHandle: 'rgba(245, 241, 236, 0.25)',
  scrim: 'rgba(0, 0, 0, 0.72)',
  danger: '#F97066',
  dangerTop: '#E5372B',
  dangerSurface: '#33201E',
  positive: '#32D583',
};
