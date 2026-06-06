import { SvgProps } from 'react-native-svg';

export interface ColorableSvgProps extends SvgProps {
  colorMap?: Record<string, string>;
  onElementPress?: (id: string) => void;
  selectedId?: string | null;
  selectionMode?: 'color' | 'element';
}