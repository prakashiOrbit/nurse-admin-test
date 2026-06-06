import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { scale, verticalScale } from 'react-native-size-matters';

const WarningIcon = ({
  width = scale(14),
  height = verticalScale(14),
}) => (
  <Svg width={width} height={height} viewBox="0 0 14 14" fill="none">
    <Path
      d="M0.5 13L7 1L13.5 13H0.5Z"
      fill="#FFC107"
      stroke="#FFA000"
      strokeWidth="0.5"
    />
    <Path
      d="M7 5.5V8.5"
      stroke="#ffffff"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <Path
      d="M7 10V10.5"
      stroke="#ffffff"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </Svg>
);

export default WarningIcon;
