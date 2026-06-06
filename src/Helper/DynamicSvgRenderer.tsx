import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import Svg from 'react-native-svg';
import { parseSvgXml } from './svg-parser';
import { processChildren, ColorableSvgProps } from './svg-utils';

interface DynamicSvgRendererProps extends ColorableSvgProps {
  svgXml: string;
  width: number;
  height: number;
  loadingComponent?: React.ReactNode;
  errorComponent?: (error: string) => React.ReactNode;
}

const defaultLoadingComponent = <ActivityIndicator size="large" />;
const defaultErrorComponent = (error: string) => <Text>{error}</Text>;

const DynamicSvgRenderer: React.FC<DynamicSvgRendererProps> = ({
  svgXml,
  width,
  height,
  loadingComponent = defaultLoadingComponent,
  errorComponent = defaultErrorComponent,
  ...props
}) => {
  const [jsxTree, setJsxTree] = useState<React.ReactNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parseAndProcessSvg = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Parse the SVG XML to JSX
        const parsed = parseSvgXml(svgXml);
        
        // Process the JSX with your existing logic
        const enhanced = processChildren(parsed, props);
        
        setJsxTree(enhanced);
      } catch (err) {
        console.error('Failed to parse SVG:', err);
        setError(err instanceof Error ? err.message : 'Failed to load SVG');
      } finally {
        setLoading(false);
      }
    };

    parseAndProcessSvg();
  }, [svgXml, props]);

  if (loading) {
    return loadingComponent;
  }

  if (error) {
    return errorComponent(error);
  }

  return (
    <Svg 
      viewBox="0 0 1000 600" 
      width={width} 
      height={height}
      {...props}
    >
      {jsxTree}
    </Svg>
  );
};

export default DynamicSvgRenderer;