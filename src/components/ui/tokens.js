/**
 * The non-colour half of the design system.
 *
 * ThemeContext only carries colours, so spacing / radius / type were previously
 * re-invented in every *Styles.js file. These are the scales the Login design
 * uses; colours still come from `theme`.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  control: 14, // password field, buttons
  tile: 32, // biometric hero tile
  sheet: 28, // bottom sheet top corners
  pill: 999,
};

/** Every interactive control in the design is 56pt tall. */
export const controlHeight = 56;

export const screenPadding = 28;

/**
 * Type scale.
 *
 * The design is drawn in Plus Jakarta Sans 400-800, but the app only ships
 * Roboto (Regular/Medium/Bold - see react-native.config.js), so weights are
 * mapped onto the three real faces.
 *
 * `fontFamily` alone carries the weight: pairing 'Roboto-Regular' with
 * fontWeight:'700' (as ~85 places in the app do) gives synthetic or absent
 * bolding on iOS. Nothing here sets fontWeight.
 */
export const type = {
  h1: {fontSize: 26, fontFamily: 'Roboto-Bold', letterSpacing: -0.5},
  h2: {fontSize: 21, fontFamily: 'Roboto-Bold', letterSpacing: -0.4},
  title: {fontSize: 24, fontFamily: 'Roboto-Bold', letterSpacing: -0.5},
  button: {fontSize: 17, fontFamily: 'Roboto-Bold'},
  input: {fontSize: 16, fontFamily: 'Roboto-Regular'},
  body: {fontSize: 14, fontFamily: 'Roboto-Regular', lineHeight: 20},
  bodyStrong: {fontSize: 14, fontFamily: 'Roboto-Bold'},
  label: {fontSize: 12, fontFamily: 'Roboto-Medium', lineHeight: 16},
  caption: {fontSize: 12, fontFamily: 'Roboto-Medium'},
  overline: {
    fontSize: 12,
    fontFamily: 'Roboto-Bold',
    letterSpacing: 0.72,
    textTransform: 'uppercase',
  },
};
