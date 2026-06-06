import React from 'react';
import { SvgProps } from 'react-native-svg';

export interface ColorableSvgProps extends SvgProps {
  colorMap: Record<string, string>;
  currentColor?: string;
  onElementPress?: (id: string) => void;
  onColorChange?: (id: string, color: string) => void;
  selectedId: string | null;
  selectionMode: 'color' | 'element';
}

export const enhanceElement = (
  element: React.ReactElement<any>,
  id: string,
  props: ColorableSvgProps
): React.ReactElement => {
  const isSelected = props.selectedId === id;
  const strokeColor = isSelected ? '#ff0000' : (element.props.stroke || '#000');
  const strokeWidth = isSelected ? 3 : (element.props.strokeWidth ?? 1);
  const fillColor = props.colorMap[id] || element.props.fill || 'none';

  return React.cloneElement(element, {
    fill: fillColor,
    stroke: strokeColor,
    strokeWidth,
    onPress: () => {
      if (props.selectionMode === 'color' && props.onColorChange) {
        props.onColorChange(id, props.currentColor || fillColor);
      }
      if (props.selectionMode === 'element') {
        props.onElementPress?.(id);
      }
    },
    key: id,
    id,
  });
};

export const processChildren = (
  children: React.ReactNode,
  props: ColorableSvgProps,
  parentId: string | null = null
): React.ReactNode => {
  return React.Children.map(children, (child): React.ReactNode => {
    if (!React.isValidElement(child)) return child;

    const childElement = child as React.ReactElement<any>;
    const childId: string | undefined = childElement.props.id || parentId || undefined;
    const shouldEnhance = childId && (
      childId.toLowerCase().includes('bed') || 
      childId.toLowerCase().includes('nurse')
    );

    let processed = child;

    if (React.Children.count(childElement.props.children) > 0) {
      const updatedChildren = processChildren(childElement.props.children, props, childId);
      processed = React.cloneElement(childElement, {}, updatedChildren);
    }

    if (childId && shouldEnhance) {
      return enhanceElement(processed, childId, props);
    }

    return processed;
  });
};