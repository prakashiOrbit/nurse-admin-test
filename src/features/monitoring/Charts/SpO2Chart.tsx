import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Polyline, Line, Text as SvgText, Rect } from 'react-native-svg';
import { scale } from '../../../utils/scaling';

const SpO2Chart = ({
  data=[
      98, 98, 97, 98, 98, 98, 98, 97, 98, 98,
      97, 98, 98, 98, 98, 97, 98, 98, 98, 98,
      98, 98, 98, 98, 85, 85, 85, 85, 98, 98,
      98, 98, 98, 98, 98, 98, 98, 98, 98, 98,
    ],
  yLabels=[100,95, 90, 85, 80, 75],
    xLabels=['09:37', '09:38', '09:39', '09:40', '09:41', '09:42'],
  minY = 75,
  maxY = 100,
  chartHeight = 70,
  dropIndex = 3, // index for red vertical line
  title = 'SpO₂ Trend with Drop at 09:40',
  widthPercentLarge = 0.6,
  widthPercentSmall = 0.9,
  strokeColor = '#0057ff',
  dropLineColor = 'red',
  containerStyle,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth > 850 ? screenWidth * widthPercentLarge : screenWidth * widthPercentSmall;

  const leftPadding = 30;
  const stepX = chartWidth / (data.length - 1);
  const xLabelStep = xLabels.length > 1 ? chartWidth / (xLabels.length - 1) : 0;
  const polylineMaxX = leftPadding + (data.length - 1) * stepX;
const topPadding = 10;


const getPolylinePoints = () => {
  return data
    .map((val, index) => {
      const x = 30 + index * stepX;
      const y = topPadding + ((maxY - val) / (maxY - minY)) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');
};



  return (
    <View style={[styles.container, containerStyle]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Svg height={chartHeight + topPadding + 20} width={polylineMaxX}>


        {/* Horizontal grid lines + Y labels */}
        {yLabels.map((val, i) => {
          const y = topPadding + ((maxY - val) / (maxY - minY)) * chartHeight;
          return (
            <React.Fragment key={`y-${val}`}>
              <Line
                x1={30}
                y1={y}
                x2={chartWidth + 30}
                y2={y}
                stroke="#ccc"
                strokeDasharray="4"
              />
              <SvgText x={0} y={y + 4} fontSize="10" fill="#333">
                {val}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Background rectangles */}
        {yLabels.slice(0, -1).map((val, i) => {
          const top = ((maxY - val) / (maxY - minY)) * chartHeight;
          const bottom = ((maxY - yLabels[i + 1]) / (maxY - minY)) * chartHeight;
          return (
            <Rect
              key={`bg-${i}`}
              x={30}
              y={top}
              width={chartWidth}
              height={bottom - top}
              fill={i % 2 === 0 ? '#eef4fc' : '#ffffff'}
              opacity={0.5}
            />
          );
        })}

        {/* Black vertical lines every second based on xLabels */}
        {xLabels.map((_, i) => (
          <Line
            key={`black-line-${i}`}
            x1={30 + i * xLabelStep}
            y1={0}
            x2={30 + i * xLabelStep}
            y2={chartHeight}
            stroke="black"
            strokeWidth={0.5}
            opacity={0.1}
          />
        ))}

        {/* Red dashed vertical line at drop index */}
        {dropIndex !== null && dropIndex >= 0 && dropIndex < xLabels.length && (
          <Line
            x1={30 + dropIndex * xLabelStep}
            y1={0}
            x2={30 + dropIndex * xLabelStep}
            y2={chartHeight}
            stroke={dropLineColor}
            strokeDasharray="4"
            strokeWidth="1"
          />
        )}

        {/* SpO2 polyline */}
        <Polyline
          points={getPolylinePoints()}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
        />

        {/* X-axis time labels */}
        {xLabels.map((label, i) => (
          <SvgText
            key={`x-${i}`}
            x={30 + i * xLabelStep}
            y={chartHeight + 15}
            fontSize="10"
            fill="#333"
            textAnchor="middle"
          >
            {label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: scale(4),
    padding: 1,
    backgroundColor: '#eef4fc',
    borderRadius: scale(2),
    overflow: 'hidden',
  },
  title: {
    marginBottom: 6,
    fontWeight: '600',
    color: '#2a5d9f',
  },
});

export default SpO2Chart;
