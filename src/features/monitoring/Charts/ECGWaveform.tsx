import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ToastAndroid,
  Platform, // ✅ Added for Android toast
} from 'react-native';
import Svg, {Path, Line} from 'react-native-svg';
import {scale, verticalScale} from '../../../utils/scaling';
import {RFValue} from 'react-native-responsive-fontsize';
import {getVitalRecordsAPIForMonitoring} from '../../../services/telemetryService';

const {width: screenWidth} = Dimensions.get('window');
const HEIGHT = 40;
const LABEL_WIDTH = 40;
const HR_MIN_WIDTH = 10;

type ECGWaveformProps = {
  bedCode: string;
  deviceCode: string;
  patientCode: string;
  label?: string;
  waveformStrokeColor?: string;
  valueColor?: string;
  containerStyle?: any;
};

const ECGWaveform: React.FC<ECGWaveformProps> = ({
  bedCode,
  deviceCode,
  patientCode,
  label = 'HR',
  waveformStrokeColor = '#3BE041',
  valueColor = '#3BE041',
  containerStyle,
}) => {
  const [waveformWidth, setWaveformWidth] = useState(
    screenWidth - LABEL_WIDTH - HR_MIN_WIDTH - 24,
  );
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [heartRate, setHeartRate] = useState('--');
  const [vitalName] = useState(['HR', '120', '50']);
  const lastUpdateTime = useRef(Date.now());
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

  useEffect(() => {
    const checker = setInterval(() => {
      const now = Date.now();
      if (now - lastUpdateTime.current > 15 * 60 * 1000) {
        ToastAndroid.showWithGravity(
          'No HR data in past 15 mins. Monitoring stopped.',
          ToastAndroid.LONG,
          ToastAndroid.CENTER,
        );
      }
    }, 60 * 1000); // check every minute
    return () => clearInterval(checker);
  }, []);

  // Fetch HR values
  useEffect(() => {
    if (!bedCode || !deviceCode || !patientCode) return;

    const fetchHR = async () => {
      try {
        const data = await getVitalRecordsAPIForMonitoring({
          patientCode,
          deviceCode,
          vitalParams: ['HR'],
        });

        if (toastShown.current) toastShown.current = false;

        const hrData = data.find((v: any) => v.vitalName === 'HR');

        if (hrData) {
          lastUpdateTime.current = Date.now();
          const values = hrData.vitalValue.map((v: string) => Number(v));
          setWaveformData(prev => {
            const updated = [...prev, ...values.reverse()].slice(-100);
            return updated;
          });
          setHeartRate(Number(hrData.vitalValue[0]) || '--');
        }
      } catch (err: any) {
        // console.error('Error fetching HR data:', err);
        if (err?.response?.status === 400) {
          showToast('Monitoring stopped.');
        } else{
          showToast('Failed to fetch vitals. Please try again.');
        }
      }
    };

    fetchHR();
    const interval = setInterval(fetchHR, 5000); // refresh every 5 sec
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
        {/* Label */}
        <View style={[styles.labelContainer, {width: LABEL_WIDTH}]}>
          <Text style={styles.label}>{label}</Text>
        </View>

        {/* Waveform */}
        <View
          style={styles.vitalContainer}
          onLayout={e => {
            const totalWidth = e.nativeEvent.layout.width;
            const newWidth = totalWidth - HR_MIN_WIDTH;
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

        {/* HR Box */}
        <View style={[styles.hrContainer, {minWidth: HR_MIN_WIDTH}]}>
          <View style={styles.hrInner}>
            <View style={styles.vitalName}>
              {vitalName.map((text, i) => (
                <Text key={i} style={styles.vitalText}>
                  {text}
                </Text>
              ))}
            </View>
            <Text style={[styles.hrValue, {color: valueColor}]}>
              {heartRate}
            </Text>
            <Text style={styles.hrUnit}>bpm</Text>
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
  outerRow: {flexDirection: 'row', alignItems: 'stretch', width: '100%'},
  labelContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingLeft: scale(4),
  },
  label: {fontWeight: '500', color: 'black', fontSize: RFValue(9)},
  vitalContainer: {
    flex: 1,
    height: verticalScale(50),
    borderRadius: 6,
    overflow: 'hidden',
  },
  hrContainer: {
    height: verticalScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(2),
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  hrInner: {
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
  hrValue: {
    fontSize: RFValue(32, 812),
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: scale(6),
  },
  hrUnit: {
    fontSize: RFValue(13, 812),
    color: '#666',
    marginLeft: scale(6),
    marginTop: verticalScale(14),
  },
});

export default ECGWaveform;
