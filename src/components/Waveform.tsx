import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ToastAndroid,
  Platform,
} from 'react-native';

import {RFValue} from 'react-native-responsive-fontsize';
import { getVitalRecordsAPI, getMonitorDataAPI } from '../services/telemetryService';
import { getDeviceConfigAPI } from '../services/deviceService';

import {scale, verticalScale} from '../utils/scaling';
import {formatDateWithOffset} from '../utils/dataformatter';
import moment from 'moment';

// Charts
import {LineChart} from 'react-native-charts-wrapper';
import {processColor} from 'react-native';

const {width: screenWidth} = Dimensions.get('window');

// CHART HEIGHT
const HEIGHT = verticalScale(40);
const LABEL_WIDTH = scale(40);
const VALUE_MIN_WIDTH = scale(30);

type WaveformProps = {
  bedCode: string;
  deviceCode: string;
  deviceId: string;
  patientCode: string;
  patientId: string;
  paramCode: string;
  label?: string;
  unit?: string;
  waveformStrokeColor?: string;
  valueColor?: string;
  source: 'ALARM' | 'DEFAULT';
  violatedParam?: string;
  raisedTime?: string;
};

const Waveform: React.FC<WaveformProps> = ({
  bedCode,
  deviceCode,
  deviceId,
  patientCode,
  patientId,
  paramCode,
  label,
  unit = '',
  waveformStrokeColor = '#3BE041',
  valueColor = '#3BE041',
  source,
  violatedParam,
  raisedTime,
}) => {
  const [waveformWidth, setWaveformWidth] = useState(
    screenWidth - LABEL_WIDTH - VALUE_MIN_WIDTH - 24,
  );

  const [chartData, setChartData] = useState([]);
  const [xLabels, setXLabels] = useState([]);
  const [value, setValue] = useState('--');

  const [paramMeta, setParamMeta] = useState(null);
  const [thresholds, setThresholds] = useState({});
  const [status, setStatus] = useState<'HIGH' | 'LOW' | 'NORMAL'>('NORMAL');

  const [highlight, setHighlight] = useState(null);
  const [markerVisible, setMarkerVisible] = useState(false);

  const [tooltip, setTooltip] = useState(null);

  const chartLayout = useRef({width: 0, height: 0});
  

  // ------------------------------
  // DEVICE CONFIG
  // ------------------------------
  useEffect(() => {
    if (!deviceCode) return;

    const fetchDeviceConfig = async () => {
      try {
        const config = await getDeviceConfigAPI(deviceId);

        const paramConfig = config.dataParameters?.find(
          p => p.MapTo === paramCode,
        );

        if (paramConfig) {
          setThresholds({
            min: paramConfig.DeviceDefaults?.DeviceMinimum,
            max: paramConfig.DeviceDefaults?.DeviceMaximum,
          });
        }
      } catch (err) {
        console.log('Device config error:', err);
      }
    };

    fetchDeviceConfig();
  }, [deviceId, paramCode]);

  // ------------------------------
  // METADATA
  // ------------------------------
  useEffect(() => {
    if (!patientId || !bedCode) return;

    const fetchMetadata = async () => {
      try {
        const context = source === 'ALARM' ? 'ALARM' : 'DEFAULT';
        const param =
          source === 'ALARM' && violatedParam ? violatedParam : undefined;

        const meta = await getMonitorDataAPI(context, param, patientId);

        const deviceMeta = meta?.find(d => d.deviceCode === deviceCode);
        const paramData = deviceMeta?.relatedParams?.find(
          p => p.paramCode === paramCode,
        );

        setParamMeta(paramData);
      } catch {}
    };

    fetchMetadata();
  }, [patientId, bedCode, source, violatedParam, paramCode, deviceCode]);

  // ------------------------------
  // FORMAT DATA FOR CHART
  // ------------------------------
  const convertVitalToChartPoints = vital => {
    if (!vital) return [];

    const baseTs = new Date(vital.startTime).getTime(); // IST timestamp

    const points = vital.dataPoints.map((dp, index) => ({
      x: index, // fixed spacing for smooth graph
      y: Number(dp.value),
      realTs: baseTs + dp.offset, // for axis labels
    }));

    // Build X-axis labels (HH:mm)
    const labels = points.map(p => moment(p.realTs).format('HH:mm'));

    setXLabels(labels);
    return points;
  };

  // ------------------------------
  // FETCH VITALS
  // ------------------------------
  useEffect(() => {
    if (!bedCode || !deviceCode || !patientCode || !paramMeta) return;

    const fetchVitals = async () => {
      try {
        const payload = {
          patientCode,
          deviceCode,
          vitalParams: [paramCode],
        };

        let startTime: Date;
        let endTime: Date;

        if (source === 'ALARM' && raisedTime) {
          // Freeze data around alarm time
          const alarmTs =
            typeof raisedTime === 'string' ? Number(raisedTime) : raisedTime;

          endTime = new Date(alarmTs);
          startTime = new Date(alarmTs - 15 * 60 * 1000); // 15 min before alarm
        } else {
          // Live mode → rolling window
          endTime = new Date();
          startTime = new Date(endTime.getTime() - 15.1 * 60 * 1000);
        }

        payload.startTime = formatDateWithOffset(startTime);
        payload.endTime = formatDateWithOffset(endTime);

        const data = await getVitalRecordsAPI(payload);
        const vital = data.find(v => v.vitalName === paramCode);

        if (vital) {
          const points = convertVitalToChartPoints(vital);
          setChartData(points);

          // Latest Value
          if (points.length) {
            const latestVal = points.at(-1).y;
            setValue(latestVal);
          }
        } else {
          setChartData([]);
          setXLabels([]);
          setValue('--');
        }
      } catch {
        setChartData([]);
        setXLabels([]);
        setValue('--');
      }
    };

    fetchVitals();
    if (source === 'DEFAULT') {
      const interval = setInterval(fetchVitals, 5000);
      return () => clearInterval(interval);
    }

    return;
  }, [
    bedCode,
    deviceCode,
    patientCode,
    paramCode,
    paramMeta,
    source,
    raisedTime,
  ]);

  // ------------------------------
  // CHART CONFIG
  // ------------------------------
  const getDataForChart = () => ({
    dataSets: [
      {
        values: chartData,
        label: '',
        config: {
          color: processColor(
            paramMeta?.properties?.color || waveformStrokeColor,
          ),
          drawCircles: false,
          drawValues: false,
          lineWidth: 2,
          mode: 'LINEAR',
        },
      },
    ],
  });

  const xAxisConfig = {
    valueFormatter: xLabels,
    granularityEnabled: true,
    granularity: 1,
    drawGridLines: false,
    position: 'BOTTOM',
    textColor: processColor('#777'),
  };

  const yAxisConfig = {
    left: {
      drawGridLines: false,
      textColor: processColor('#555'),
      labelCount: 3,
    },
    right: {enabled: false},
  };

  // ------------------------------
  // RENDER
  // ------------------------------
  return (
    <View style={styles.container}>
      <View style={styles.outerRow}>
        {/* LABEL */}
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {paramMeta?.paramName || label || paramCode}
          </Text>
        </View>

        {/* CHART */}
        <View
          style={styles.vitalContainer}
          onLayout={e =>
            setWaveformWidth(e.nativeEvent.layout.width - VALUE_MIN_WIDTH)
          }>
          <View
            style={{
              width: waveformWidth + 25,
              height: HEIGHT + 30,
              position: 'relative',
            }}>
            {tooltip && (
              <View
                style={[
                  styles.tooltip,
                  {
                    left: Math.min(
                      Math.max(tooltip.x, 0),
                      chartLayout.current.width - 180, // tooltip width
                    ),
                    top: Math.min(
                      Math.max(tooltip.y - 25, 0),
                      chartLayout.current.height - 30, // tooltip height
                    ),
                  },
                ]}>
                <Text style={styles.tooltipValue}>
                  {tooltip.value}, {tooltip.time}, {tooltip.date}
                </Text>
              </View>
            )}

            <LineChart
              style={{flex: 1}}
              data={getDataForChart()}
              xAxis={xAxisConfig}
              yAxis={yAxisConfig}
              legend={{enabled: false}}
              touchEnabled={true}
              dragEnabled={true}
              highlightPerDragEnabled={true}
              highlightPerTapEnabled={true}
              scaleEnabled={false}
              pinchZoom={false}
              drawGridBackground={false}
              animation={{durationX: 300}}
              chartDescription={{text: '', enabled: false}}
              highlightValues={highlight ? [highlight] : []}
              marker={{
                enabled: markerVisible,
                markerColor: processColor('#FFF'),
                textColor: processColor('#000'),
                digits: 0,
              }}
              onSelect={event => {
                const val = event.nativeEvent;
                if (!val || val.x == null) return;

                const index = val.x;
                const point = chartData[index];
                if (!point) return;

                const totalPoints = chartData.length;
                const stepX = chartLayout.current.width / totalPoints;
                const tooltipX = stepX * index;

                const yValues = chartData.map(p => p.y);
                const minY = Math.min(...yValues);
                const maxY = Math.max(...yValues);

                const valuePercent = (maxY - point.y) / (maxY - minY);
                const tooltipY = chartLayout.current.height * valuePercent;

                // UPDATE HIGHLIGHT LINE
                setHighlight({x: index, y: point.y});

                // SHOW TOOLTIP
                setTooltip({
                  value: point.y,
                  time: moment(point.realTs).format('HH:mm:ss'),
                  date: moment(point.realTs).format('DD MMM YYYY'),
                  x: tooltipX,
                  y: tooltipY,
                });

                // HIDE tooltip + highlight after 4 sec
                setTimeout(() => {
                  setTooltip(null);
                  setHighlight(null); // IMPORTANT FIX
                }, 4000);
              }}
              onLayout={e => {
                const {width, height} = e.nativeEvent.layout;
                chartLayout.current = {width, height};
              }}
            />
          </View>
        </View>

        {/* VALUE BOX */}
        <View
          style={[
            styles.valueContainer,

            status === 'HIGH'
              ? {borderColor: 'red'}
              : status === 'LOW'
              ? {borderColor: 'orange'}
              : {borderColor: '#4A90E2'},
          ]}>
          <View style={styles.thresholdView}>
            {thresholds.max !== undefined && (
              <Text style={styles.thresholdText}>{thresholds.max}</Text>
            )}
            {thresholds.min !== undefined && (
              <Text style={styles.thresholdText}>{thresholds.min}</Text>
            )}
          </View>

          <View style={styles.valueView}>
            <View>
              <Text
                style={[
                  styles.value,
                  {color: paramMeta?.properties?.color || valueColor},
                ]}>
                {value}
              </Text>
            </View>

            {(paramMeta?.unit || unit) && (
              <Text style={styles.unit}>{paramMeta?.unit || unit}</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: scale(6),
    marginTop: verticalScale(7),
    backgroundColor: '#F0FAFA',
    borderRadius: scale(6),
    paddingVertical: verticalScale(1),
    borderColor: '#4CAF50',
    borderWidth: 1,
    height: verticalScale(80),
    // width: scale(475),
    width: '100%',
  },
  outerRow: {flexDirection: 'row', height: '100%', width: '100%'},
  labelContainer: {
    width: '9%',
    justifyContent: 'center',
    paddingLeft: scale(4),
  },
  label: {fontSize: RFValue(9), fontWeight: '500', color: 'black'},
  vitalContainer: {
    width: '71%',
    height: '100%',
    paddingLeft: scale(8),
    overflow: 'hidden',
  },
  valueContainer: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '20%',
    gap: scale(2),
    // borderWidth: 1,
    overflow: 'visible',
    paddingRight:scale(2)
  },
  thresholdView: {
    width: 'auto',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '80%',
  },
  thresholdText: {
    fontSize: RFValue(11, 812),
    color: '#000',
    fontWeight: '500',
    width: 'auto'
  },
  valueView: {
    height: '90%',
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(10),
  },
  value: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontSize: RFValue(25, 812),
    lineHeight: verticalScale(44),
    fontWeight: '700',
  },
  unit: {
    width: '100%',
    fontSize: RFValue(13, 812),
    color: '#666',
    marginBottom: scale(2),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tooltip: {
    height: verticalScale(25),
    width: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    position: 'absolute',
    backgroundColor: 'white',
    borderColor: '#000',
    borderWidth: 1,
    padding: 2,
    borderRadius: 4,
    zIndex: 999,
  },

  tooltipValue: {
    fontSize: 11,
    fontWeight: '500',
    color: '#000',
  },

  tooltipTime: {
    fontSize: 11,
    color: '#333',
  },
  tooltipDate: {
    fontSize: 10,
    color: '#666',
    marginTop: 1,
  },
});

export default Waveform;

