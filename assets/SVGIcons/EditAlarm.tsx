import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { scale, verticalScale } from 'react-native-size-matters';

const EditAlarm = ({
  width = scale(14),
  height = verticalScale(14),
  fill = '#4CAF50',
}) => (
  <Svg                          
    width={width}
    height={height}
    viewBox="0 0 14 14"
    fill="none"
  >
    <Path                       
      d="M3.7415 9.26916L9.65767 3.353L8.83283 2.52816L2.91667 8.44433V9.26916H3.7415ZM4.22508 10.4358H1.75V7.96075L8.42042 1.29033C8.52981 1.18097 8.67815 1.11954 8.83283 1.11954C8.98751 1.11954 9.13586 1.18097 9.24525 1.29033L10.8955 2.94058C11.0049 3.04997 11.0663 3.19832 11.0663 3.353C11.0663 3.50768 11.0049 3.65602 10.8955 3.76541L4.22508 10.4358ZM1.75 11.6025H12.25V12.7692H1.75V11.6025Z"
      fill={fill}
    />
  </Svg>
);

export default EditAlarm;