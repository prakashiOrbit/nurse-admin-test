import React from 'react';
import { Svg, Path, Text, Circle, Rect, G, Line } from 'react-native-svg';

type SvgComponentType = typeof Svg | typeof Path | typeof Text | typeof Circle | typeof Rect | typeof G | typeof Line;

const svgElementMap: Record<string, React.ComponentType<any>> = {
  svg: Svg,
  path: Path,
  text: Text,
  circle: Circle,
  rect: Rect,
  g: G,
  line: Line,
};

interface ParseSvgOptions {
  warnOnUnsupported?: boolean;
}

// Removed invalid import of Element from 'xmldom'

export const parseSvgXml = (xml: string, options: ParseSvgOptions = {}): React.ReactElement => {
  const { warnOnUnsupported = true } = options;
  
  // For React Native, you'll need to use xmldom instead of DOMParser
  const { DOMParser } = require('xmldom');
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'image/svg+xml');
  const svgElement = doc.getElementsByTagName('svg')[0];
  
  if (!svgElement) {
    throw new Error('No SVG element found in XML');
  }

  const parseNode = (node: any): React.ReactNode => {
    const tagName = node.tagName?.toLowerCase();
    const Component = svgElementMap[tagName];
    
    if (!Component) {
      if (warnOnUnsupported) {
        console.warn(`Unsupported SVG element: ${tagName}`);
      }
      return null;
    }

    // Convert attributes to props
    const props: Record<string, any> = {};
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      // Convert SVG attributes to React prop names
    const propName: string = attr.name.replace(/-([a-z])/g, (g: string) => g[1].toUpperCase());
      props[propName] = attr.value;
    }

    // Process children
    const children: React.ReactNode[] = [];
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === 1) { // ELEMENT_NODE
        children.push(parseNode(child as Element));
      } else if (child.nodeType === 3 && child.nodeValue?.trim()) { // TEXT_NODE with content
        children.push(child.nodeValue);
      }
    }

    return React.createElement(Component, props, children.length > 0 ? children : null);
  };

  const result = parseNode(svgElement);
  if (!React.isValidElement(result)) {
    throw new Error('Failed to create valid React element from SVG');
  }

  return result as React.ReactElement;
};