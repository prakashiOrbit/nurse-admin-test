import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ToastAndroid,
  Platform,
} from 'react-native';
import Svg, {Path, Line} from 'react-native-svg';
import {scale, verticalScale} from '../../../utils/scaling';
import {RFValue} from 'react-native-responsive-fontsize';
import {getVitalRecordsAPIForMonitoring} from '../../../services/telemetryService';
import {useTranslation} from 'react-i18next';

const {width: screenWidth} = Dimensions.get('window');
const HEIGHT = 40;
const LABEL_WIDTH = 40;
const RR_MIN_WIDTH = 20;

type RespWaveformProps = {
  bedCode: string;
  deviceCode: string;
  patientCode: string;
  label?: string;
  waveformStrokeColor?: string;
  valueColor?: string;
  containerStyle?: any;
};

const RespWaveform: React.FC<RespWaveformProps> = ({
  bedCode,
  deviceCode,
  patientCode,
  label = 'RR',
  waveformStrokeColor = '#FFA500',
  valueColor = '#FFA500',
  containerStyle,
}) => {
  const {t} = useTranslation();
  const [waveformWidth, setWaveformWidth] = useState(
    screenWidth - LABEL_WIDTH - RR_MIN_WIDTH - 24,
  );
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [respRate, setRespRate] = useState('--');
  const [vitalName] = useState(['RR', '20', '12']);
  const toastShown = useRef(false);
  const lastToastTime = useRef(0);

  const showToast = (msg: string) => {
    const now = Date.now();
    // Prevent spamming: only show if > 60s since last toast
    if (!toastShown.current || now - lastToastTime.current > 60000) {
      if (Platform.OS === 'android') {
        ToastAndroid.showWithGravity(msg, ToastAndroid.LONG, ToastAndroid.CENTER);
      } else {
        console.log(msg);
      }
      toastShown.current = true;
      lastToastTime.current = now;
    }
  };

  const resetRespData = () => {
    setWaveformData([]);
    setRespRate('--');
  };

  useEffect(() => {
    if (!bedCode || !deviceCode || !patientCode) return;

    const fetchRR = async () => {
      try {
        const data = await getVitalRecordsAPIForMonitoring({
          patientCode,
          deviceCode,
          vitalParams: ['RR'],
        });

        if (toastShown.current) toastShown.current = false;

        const rrData = data.find((v: any) => v.vitalName === 'RR');
        if (rrData) {
          const values = rrData.vitalValue.map((v: string) => Number(v));

          setWaveformData(prev => {
            const updated = [...prev, ...values.reverse()].slice(-100);
            return updated;
          });

          setRespRate(Number(rrData.vitalValue[0]) || '--');
        }
      } catch (err: any) {
        // console.error("Error fetching RR data:", err);

        if (err?.response?.status === 400) {
          showToast(t('monitoring.monitoring_stopped'));
        } else{
          showToast(t('monitoring.fetch_vitals_failed'));
        }

        resetRespData();
      }
    };

    fetchRR();
    const interval = setInterval(fetchRR, 5000);
    return () => clearInterval(interval);
  }, [bedCode, deviceCode, patientCode]);

  const normalizeValues = (values: number[]) => {
    if (values.length === 0) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return values.map(v => HEIGHT - ((v - min) / range) * HEIGHT);
  };

  const normalizedData = normalizeValues(waveformData);
  const stepX =
    normalizedData.length > 1 ? waveformWidth / (normalizedData.length - 1) : 1;

  const pathData =
    normalizedData.length > 0
      ? normalizedData
          .map((val, i) => {
            const x = i * stepX;
            const y = val;
            return i === 0 ? `M${x},${y}` : `L${x},${y}`;
          })
          .join('')
      : '';

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.outerRow}>
        <View style={[styles.labelContainer, {width: LABEL_WIDTH}]}>
          <Text style={styles.label}>{label}</Text>
        </View>

        <View
          style={styles.vitalContainer}
          onLayout={e => {
            const totalWidth = e.nativeEvent.layout.width;
            const newWidth = totalWidth - RR_MIN_WIDTH;
            if (newWidth !== waveformWidth) setWaveformWidth(newWidth);
          }}>
          <Svg width={waveformWidth} height={HEIGHT}>
            <Line
              x1="0"
              y1={HEIGHT / 2}
              x2={waveformWidth}
              y2={HEIGHT / 2}
              stroke="#ccccccff"
              strokeWidth="1"
            />
            {pathData && (
              <Path
                d={pathData}
                fill="none"
                stroke={waveformStrokeColor}
                strokeWidth="2"
              />
            )}
          </Svg>
        </View>

        <View style={[styles.rrContainer, {minWidth: RR_MIN_WIDTH}]}>
          <View style={styles.rrInner}>
            <View style={styles.vitalName}>
              {vitalName.map((text, i) => (
                <Text key={i} style={styles.vitalText}>
                  {text}
                </Text>
              ))}
            </View>
            <Text style={[styles.rrValue, {color: valueColor}]}>
              {respRate}
            </Text>
            <Text style={styles.rrUnit}>{t('monitoring.rpm_unit')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: scale(6),
    marginTop: verticalScale(4),
    backgroundColor: '#F0FAFA',
    borderRadius: scale(6),
    padding: scale(6),
    borderColor: '#007aff',
    borderWidth: 2,
    height: verticalScale(50),
  },
  outerRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingLeft: scale(4),
  },
  label: {
    fontWeight: '500',
    color: 'black',
    fontSize: RFValue(9),
  },
  vitalContainer: {
    flex: 1,
    height: verticalScale(50),
    borderRadius: 6,
    overflow: 'hidden',
  },
  rrContainer: {
    height: verticalScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(2),
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  rrInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    paddingHorizontal: scale(2),
  },
  vitalName: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(6),
  },
  vitalText: {
    fontSize: 10,
    lineHeight: 14,
    color: 'black',
    textAlign: 'center',
    marginBottom: 2,
  },
  rrValue: {
    fontSize: RFValue(32, 812),
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: scale(6),
  },
  rrUnit: {
    fontSize: RFValue(13, 812),
    color: '#666',
    marginLeft: scale(6),
    marginTop: verticalScale(14),
  },
});

export default RespWaveform;
