/**
 * Small colour helpers for the UI kit.
 *
 * These exist so brand-derived colours (button gradients, link tints) can be
 * computed from `theme.background` instead of hard-coded. `theme.background` is
 * the white-label accent - #F44D03 for dokwallet, #4F8DD8 for kimlwallet - so
 * pasting the design's literal orange would turn the KIML build orange too.
 */

const hexToRgb = hex => {
  let value = String(hex).trim().replace('#', '');
  if (value.length === 3) {
    value = value
      .split('')
      .map(char => char + char)
      .join('');
  }
  const int = parseInt(value, 16);
  if (Number.isNaN(int) || value.length !== 6) {
    return null;
  }
  /* eslint-disable-next-line no-bitwise */
  return {r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255};
};

/**
 * Same colour at a given opacity. Accepts hex in, returns `rgba()` out.
 * Falls back to the input untouched when it isn't hex (already rgba, a named
 * colour, ...) so callers never have to branch.
 */
export const withAlpha = (color, alpha) => {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return color;
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

/**
 * Raise a colour's HSL lightness by `amount` (0-1), keeping hue and saturation.
 * Lightening in HSL rather than mixing toward white is what keeps the brand hue
 * intact: lighten('#F44D03', 0.06) -> #FF5E16, and the KIML blue stays blue.
 */
export const lighten = (color, amount) => {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return color;
  }
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const delta = max - min;

  let h = 0;
  let s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
  }

  const nextL = Math.min(1, Math.max(0, l + amount));
  const c = (1 - Math.abs(2 * nextL - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = nextL - c / 2;

  let rgbPrime;
  if (h < 60) {
    rgbPrime = [c, x, 0];
  } else if (h < 120) {
    rgbPrime = [x, c, 0];
  } else if (h < 180) {
    rgbPrime = [0, c, x];
  } else if (h < 240) {
    rgbPrime = [0, x, c];
  } else if (h < 300) {
    rgbPrime = [x, 0, c];
  } else {
    rgbPrime = [c, 0, x];
  }

  const toHex = channel =>
    Math.round((channel + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(rgbPrime[0])}${toHex(rgbPrime[1])}${toHex(rgbPrime[2])}`;
};
