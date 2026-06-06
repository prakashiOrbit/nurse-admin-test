declare module 'react-native-color-wheel' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  export interface ColorObject {
    h: number;
    s: number;
    v: number;
    hex?: string;
  }

  export interface ColorWheelProps extends ViewProps {
    initialColor?: string;
    onColorChange?: (color: string | ColorObject) => void;
    style?: any;
  }

  export class ColorWheel extends Component<ColorWheelProps> {}
  export default ColorWheel;
}
