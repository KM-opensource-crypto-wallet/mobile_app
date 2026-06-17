import React from 'react';
import ApplePayMarkSvg from 'assets/images/buy/apple_pay_mark.svg';

// Renders Apple's official Apple Pay Mark, unaltered. The official asset is a
// self-contained badge (black border + white fill + black logotype) that works
// on any background, so we must NOT recolor or tint it. Keep its intrinsic
// aspect ratio (165.52107 x 105.9651).
const MARK_ASPECT_RATIO = 165.52107 / 105.9651;

const ApplePayMark = ({height = 28}) => {
  return <ApplePayMarkSvg height={height} width={height * MARK_ASPECT_RATIO} />;
};

export default ApplePayMark;
