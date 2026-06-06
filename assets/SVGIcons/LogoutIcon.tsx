import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { scale, verticalScale } from '../../src/utils/scaling';

type LogoutIconProps = {
  width?: number;
  height?: number;
  fill?: string;
};

const LogoutIcon: React.FC<LogoutIconProps> = ({
  width = scale(22),
  height = verticalScale(22),
  fill = '#000'
}) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 22 22"
      fill="none"
    >
      <Path
        d="M2.41667 21.75C1.75208 21.75 1.18336 21.5136 0.7105 21.0407C0.237639 20.5678 0.000805556 19.9987 0 19.3333V2.41667C0 1.75208 0.236833 1.18336 0.7105 0.7105C1.18417 0.237639 1.75289 0.000805556 2.41667 0H10.875V2.41667H2.41667V19.3333H10.875V21.75H2.41667ZM15.7083 16.9167L14.0469 15.1646L17.1281 12.0833H7.25V9.66667H17.1281L14.0469 6.58542L15.7083 4.83333L21.75 10.875L15.7083 16.9167Z"
        fill={fill}
      />
    </Svg>
  );
};

export default LogoutIcon;
