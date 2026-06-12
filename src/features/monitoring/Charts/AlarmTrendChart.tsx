import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import Svg, { Polyline, Line, Text as SvgText, Circle } from 'react-native-svg';
import { scale } from '../../../utils/scaling';
import { getVitalRecordsAPI } from '../../../services/telemetryService';
import { formatDateWithOffset } from '../../../utils/dataformatter';
import { verticalScale } from 'react-native-size-matters';
import { RFValue } from 'react-native-responsive-fontsize';
import { useResponsive } from '../../../utils/responsive';
import { getSharedStyles } from '../../../styles/sharedStyles';
import { useTranslation } from 'react-i18next';

type AlarmTrendChartProps = {
  paramName: string;
  raisedTime: number | string;
  patientCode: string;
  bedCode: string;
  desc: string;
  deviceCode: string;
  color: string;
  timeRangeMinutes?: number;
  alarmValue: number;
};

const AlarmTrendChart: React.FC<AlarmTrendChartProps> = ({
  paramName,
  raisedTime,
  patientCode,
  bedCode,
  desc,
  deviceCode,
  color,
  timeRangeMinutes = 15,
  alarmValue: alarmValProp,
}) => {
  const { isTablet } = useResponsive();
  const { t } = useTranslation();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);
  console.log('Para: ' + paramName);

  const { width: sw } = useWindowDimensions();
  const baseWidth = sw > 850 ? sw * 0.6 : sw * 0.9;
  const pointsPerPx = 15;

  const [data, setData] = useState<{ value: number; timestamp: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartBounds, setChartBounds] = useState<{
    start: number;
    end: number;
  } | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  const Y_TICKS = 3; // reduce or increase here

  // -------------------------------
  // Parse alarm timestamp
  // -------------------------------
  // const ts =
  //   typeof raisedTime === 'string'
  //     ? Date.parse(raisedTime) || Number(raisedTime)
  //     : raisedTime;

  // if (!ts || isNaN(ts)) {
  //   return (
  //     <View style={styles.noData}>
  //       <Text>Invalid alarm time</Text>
  //     </View>
  //   );
  // }

  // const alarmTs = new Date(ts).getTime();
  // raisedTime is ISO string like "2025-12-04T14:36:47.569883+05:30"


    const titleStyle = useMemo(
    () => ({
    fontSize: isTablet? RFValue(12, 812): RFValue(10, 812),
    fontWeight: '600',
    color: '#000',
    marginLeft: scale(4),
    marginBottom: verticalScale(6),
    }),
    [isTablet],
  );



  const alarmTs = new Date(raisedTime).getTime();

  if (!alarmTs || isNaN(alarmTs)) {
    return (
      <View style={styles.noData}>
        <Text>{t('monitoring.invalid_alarm_timestamp')}</Text>
      </View>
    );
  }

  const startTime = new Date(alarmTs - timeRangeMinutes * 60000);
  const endTime = new Date(alarmTs + 1 * 60000);

  // -------------------------------
  // FETCH with NEW getVitalRecordsAPI format
  // -------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const payload = {
          patientCode,
          deviceCode,
          vitalParams: [paramName],
          startTime: formatDateWithOffset(startTime),
          endTime: formatDateWithOffset(endTime),
        };

        const records = await getVitalRecordsAPI(payload);

        if (!records?.length) {
          setData([]);
          setChartBounds(null);
          return;
        }

        const rec =
          records.find(
            r => r.vitalName?.toLowerCase() === paramName.toLowerCase(),
          ) || records[0];

        if (!rec?.dataPoints?.length) {
          setData([]);
          setChartBounds(null);
          return;
        }

        // NEW API FORMAT:
        // rec.startTime = "2025-11-20T12:05:44+05:30"
        // offset in ms
        const baseTs = new Date(rec.startTime).getTime();

        const processed = rec.dataPoints
          .map(dp => ({
            timestamp: baseTs + Number(dp.offset),
            value: Number(dp.value),
          }))
          .filter(
            p =>
              p.timestamp >= startTime.getTime() &&
              p.timestamp <= endTime.getTime(),
          )
          .sort((a, b) => a.timestamp - b.timestamp);

        const st = Math.min(startTime.getTime(), alarmTs);
        const en = Math.max(endTime.getTime(), alarmTs);

        setData(processed);
        setChartBounds({ start: st, end: en });
      } catch (e) {
        console.log('Trend fetch error:', e);
        setData([]);
        setChartBounds(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [paramName, patientCode, deviceCode, raisedTime]);

  // -------------------------------
  // Auto-scroll to alarm timestamp
  // -------------------------------
  useEffect(() => {
    if (!chartBounds || !data.length || !scrollRef.current) return;

    const timeRange = chartBounds.end - chartBounds.start;
    const svgWidth = Math.max(baseWidth, data.length * pointsPerPx);

    const alarmX = ((alarmTs - chartBounds.start) / timeRange) * svgWidth;

    scrollRef.current.scrollTo({
      x: Math.max(alarmX - baseWidth / 2, 0),
      animated: false,
    });
  }, [chartBounds, data]);

  // -------------------------------
  // Loading / No data
  // -------------------------------
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" color="#0057ff" />
      </View>
    );
  }

  if (!chartBounds || !data.length) {
    return (
      <View style={styles.noData}>
        <Text>{t('monitoring.no_trend_data')}</Text>
      </View>
    );
  }

  // -------------------------------
  // Y SCALE same as old chart
  // -------------------------------
  let minY = Math.min(...data.map(d => d.value), alarmValProp);
  let maxY = Math.max(...data.map(d => d.value), alarmValProp);

  if (minY === maxY) {
    minY -= 1;
    maxY += 1;
  }

  const pad = (maxY - minY) * 0.1;
  minY -= pad;
  maxY += pad;

  const chartHeight = isTablet? 70: 45;
  const leftPad = 25;
  const svgWidth = Math.max(baseWidth, data.length * pointsPerPx);
  const usableWidth = svgWidth - leftPad;
  const timeRange = chartBounds.end - chartBounds.start;

  // -------------------------------
  // X Axis labels (minutes)
  // -------------------------------
  const minuteTicks: { ts: number; label: string }[] = [];
  let tickTime = Math.floor(chartBounds.start / 60000) * 60000;

  while (tickTime <= chartBounds.end) {
    minuteTicks.push({
      ts: tickTime,
      label: new Date(tickTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    });
    tickTime += 60000;
  }

  // -------------------------------
  // Polyline points
  // -------------------------------
  const polyPoints = data
    .map(d => {
      const x =
        leftPad + ((d.timestamp - chartBounds.start) / timeRange) * usableWidth;
      const y = ((maxY - d.value) / (maxY - minY)) * chartHeight + 10;
      return `${x},${y}`;
    })
    .join(' ');

  // Alarm X,Y
  const alarmX =
    leftPad + ((alarmTs - chartBounds.start) / timeRange) * usableWidth;
  const alarmY = ((maxY - alarmValProp) / (maxY - minY)) * chartHeight + 10;


  return (
    <View style={styles.container}>
      <Text style={titleStyle}>{desc}</Text>

      <View style={{ flexDirection: 'row' }}>
        {/* Y AXIS */}
        <Svg height={chartHeight + 30} width={leftPad}>
          <Line
            x1={leftPad - 1}
            y1={0}
            x2={leftPad - 1}
            y2={chartHeight + 15}
            stroke="#000"
            strokeWidth="1.5"
          />

          {Array.from({ length: Y_TICKS }, (_, i) => {
            const val = minY + (i * (maxY - minY)) / (Y_TICKS - 1);
            const y = ((maxY - val) / (maxY - minY)) * chartHeight + 10;

            return (
              <SvgText
                key={i}
                x={leftPad - 5}
                y={y + 4}
                fontSize="10"
                fill="#000"
                textAnchor="end"
              >
                {Math.round(val)}
              </SvgText>
            );
          })}
        </Svg>

        {/* MAIN CHART */}
        <ScrollView
          horizontal
          ref={scrollRef}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ width: svgWidth }}
        >
          <Svg height={chartHeight + 30} width={svgWidth}>
            {/* Grid */}
            {Array.from({ length: Y_TICKS }, (_, i) => {
              const val = minY + (i * (maxY - minY)) / (Y_TICKS - 1);
              const y = ((maxY - val) / (maxY - minY)) * chartHeight + 10;

              return (
                <Line
                  key={i}
                  x1={0}
                  y1={y}
                  x2={svgWidth}
                  y2={y}
                  stroke="#AEAEAE"
                  strokeDasharray="2"
                />
              );
            })}

            {/* X grid + labels */}

            {minuteTicks.map((tick, idx) => {
              const x =
                leftPad +
                ((tick.ts - chartBounds.start) / timeRange) * usableWidth;
              return (
                <React.Fragment key={idx}>
                  <Line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={chartHeight + 15}
                    stroke="#AEAEAE"
                    strokeDasharray="2"
                  />
                  <SvgText
                    x={x}
                    y={chartHeight + 25}
                    fontSize="10"
                    fill="#333"
                    textAnchor="middle"
                  >
                    {tick.label}
                  </SvgText>
                </React.Fragment>
              );
            })}

            {/* TREND LINE */}
            <Polyline
              points={polyPoints}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
            />

            {/* ALARM VERTICAL LINE */}
            <Line
              x1={alarmX}
              y1={0}
              x2={alarmX}
              y2={chartHeight + 15}
              stroke="#FF0000"
              strokeWidth="1.5"
            />

            {/* ALARM DOT */}
            <Circle
              cx={alarmX}
              cy={alarmY}
              r="5"
              fill="#FF0000"
              stroke="#FFF"
              strokeWidth="2"
            />

            {/* ALARM VALUE */}
            <SvgText
              x={alarmX + 14}
              y={alarmY - 4}
              fontSize="12"
              fill="#FF0000"
              fontWeight="bold"
              textAnchor="middle"
            >
              {Math.round(alarmValProp)}
            </SvgText>

            {/* X AXIS */}
            <Line
              x1={0}
              y1={chartHeight + 15}
              x2={svgWidth}
              y2={chartHeight + 15}
              stroke="#000"
              strokeWidth="1.5"
            />
          </Svg>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: scale(4),
    padding: scale(6),
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
    borderRadius: scale(4),
  },
  title: {
    fontSize: RFValue(10, 812),
    fontWeight: '600',
    color: '#000',
    marginLeft: scale(4),
    marginBottom: verticalScale(6),
  },
  loader: { padding: 20, alignItems: 'center' },
  noData: { padding: 20, alignItems: 'center' },
});

export default AlarmTrendChart;
