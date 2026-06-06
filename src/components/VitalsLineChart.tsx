import React, { useMemo, useState } from 'react';
import { View, StyleSheet, processColor } from 'react-native';
import { LineChart } from 'react-native-charts-wrapper';
import moment from 'moment';
import { verticalScale } from '../utils/scaling';
import { useResponsive } from '../utils/responsive';
import { getSharedStyles } from '../styles/sharedStyles';

const VitalsLineChart = ({ data }) => {
  const { isTablet, wp, hp } = useResponsive();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);
  const [highlight, setHighlight] = useState(null);
  const [markerVisible, setMarkerVisible] = useState(false);

  const values = data.map((d, index) => ({
    x: index,
    y: d.value,
    realTs: Number(d.time),
  }));

  const xLabels = values.map(p => moment(p.realTs).format('HH:mm'));

  const dataset = {
    dataSets: [
      {
        values,
        label: '',
        config: {
          color: processColor('#000'),
          drawCircles: true,
          circleColor: processColor('#000'),
          drawValues: false,
          lineWidth: 2,
        },
      },
    ],
  };

  return (
    <View style={styles.container}>
      <LineChart
        style={styles.chart}
        data={dataset}
        legend={{ enabled: false }}
        xAxis={{
          enabled: true,
          valueFormatter: xLabels,
          granularity: 1,
          drawLabels: true,
          position: 'BOTTOM',
          textSize: isTablet? 10:  8,
          textColor: processColor('#000'),
        }}
        yAxis={{
          left: {
            enabled: true,
            drawGridLines: true,
            drawLabels: false,
          },
          right: { enabled: false },
        }}
        drawGridBackground={false}
        chartDescription={{ text: '', enabled: false }}
        touchEnabled={true}
        dragEnabled={true}
        scaleEnabled={false}
        pinchZoom={false}
        marker={{
          enabled: markerVisible,
          markerColor: processColor('#FFF'),
          textColor: processColor('#000'),
          textSize: isTablet? 20: 12,
          formatter: entry => {
            if (!markerVisible) return '';
            const p = values[entry.x];
            return `${p.y}\n${moment(p.realTs).format('HH:mm:ss')}`;
          },
        }}
        highlightPerTapEnabled={true}
        highlightPerDragEnabled={true}
        highlightValues={highlight ? [highlight] : []}
        onSelect={event => {
          const val = event.nativeEvent;
          if (!val || val.x == null) return;

          setHighlight({ x: val.x, y: val.y });
          setMarkerVisible(true);

          setTimeout(() => {
            setHighlight(null);
            setMarkerVisible(false);
          }, 3000); // same as waveform
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chart: {
    flex: 1,
    width: '100%',
  },
});

export default VitalsLineChart;
