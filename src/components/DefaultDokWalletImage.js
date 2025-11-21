import React, {useContext} from 'react';

import {ThemeContext} from 'theme/ThemeContext';
import {LOGO_SINGLE, LOGO_SINGLE_DARK} from 'utils/wlData';

const DefaultDokWalletImage = ({height, width}) => {
  const {theme} = useContext(ThemeContext);
  return theme.backgroundColor === '#121212' ? (
    <LOGO_SINGLE_DARK width={height} height={width} />
  ) : (
    <LOGO_SINGLE width={height} height={width} />
  );
};

export default DefaultDokWalletImage;
