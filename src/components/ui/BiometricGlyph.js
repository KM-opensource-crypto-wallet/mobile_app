import React from 'react';
import Svg, {Path} from 'react-native-svg';

/**
 * Face ID / Touch ID glyphs, traced from the Login design source.
 *
 * Drawn here rather than taken from react-native-vector-icons: the icon sets
 * only carry loose approximations (MaterialCommunityIcons' `face-recognition`
 * is a cartoon face in a frame), whereas these are the exact paths the design
 * specifies - the Face ID bracket outline with eyes, nose and smile, and the
 * concentric Touch ID ridges.
 */
const STROKE = {
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
};

const FACE_ID_PATHS = [
  'M3 8V6a3 3 0 0 1 3-3h2',
  'M16 3h2a3 3 0 0 1 3 3v2',
  'M21 16v2a3 3 0 0 1-3 3h-2',
  'M8 21H6a3 3 0 0 1-3-3v-2',
  'M8 9.5v1.5',
  'M16 9.5v1.5',
  'M12 9.5v3.5a1 1 0 0 1-1 1',
  'M8.5 16.5a5 5 0 0 0 7 0',
];

const TOUCH_ID_PATHS = [
  'M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4',
  'M14 13.12c0 2.38 0 6.38-1 8.88',
  'M17.29 21.02c.12-.6.43-2.3.5-3.02',
  'M2 12a10 10 0 0 1 18-6',
  'M2 16h.01',
  'M21.8 16c.2-2 .131-5.354 0-6',
  'M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2',
  'M8.65 22c.21-.66.45-1.32.57-2',
  'M9 6.8a6 6 0 0 1 9 5.2v2',
];

const BiometricGlyph = ({type = 'faceid', size = 52, color}) => {
  const paths = type === 'touchid' ? TOUCH_ID_PATHS : FACE_ID_PATHS;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {paths.map(d => (
        <Path key={d} d={d} stroke={color} {...STROKE} />
      ))}
    </Svg>
  );
};

export default BiometricGlyph;
