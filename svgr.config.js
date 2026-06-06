module.exports = {
  native: true,
  typescript: true,
  expandProps: 'end',
  svgo: true,
  svgoConfig: {
    multipass: false,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            cleanupIds: false,
            removeTitle: false,
            removeDesc: false
          }
        }
      },
      {
        name: 'removeAttrs',
        params: {
          attrs: ['class', 'data-name', 'xmlns']
        }
      },
      {
        name: 'convertStyleToAttrs',
        active: true
      }
    ]
  },
 template: function (variables, { tpl }) {
  return tpl`
    import React from 'react';
    import Svg, { Path, Text, Circle, Rect, G, Line } from 'react-native-svg';
    import { ColorableSvgProps, processChildren } from '../Helper/svg-utils';

    const ${variables.componentName}: React.FC<ColorableSvgProps> = (props) => {
      const { width, height, ...svgProps } = props;
      return (
        <Svg viewBox="0 0 1000 600" {...svgProps}{...props}>
          {processChildren(${variables.jsx}, props)}
        </Svg>
      );
    };

    export default ${variables.componentName};
  `;
}

};
