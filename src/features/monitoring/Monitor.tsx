import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Platform,
  ToastAndroid,
  Alert,
  Text
} from 'react-native';
import PatientHeader from './Header/PatientHeader';
import VitalsPanelRight from './Vitals/VitalsPanelRight';
import BottomControls from './Controls/BottomControls';
import { scale, verticalScale } from '../../utils/scaling';
import { getMonitorDataAPI } from '../../services/telemetryService';
import AlarmTrendChart from './Charts/AlarmTrendChart';
import Waveform from '../../components/Waveform';
import { Icon } from '../../../assets';
import { RFValue } from 'react-native-responsive-fontsize';
const iconImg = require('../images/img.png');

type MonitoringScreenProps = {
  visible: boolean;
  onClose: () => void;
  bedCode: string;
  patientCode?: string;
  patientId: string;
  source: 'ALARM' | 'DEFAULT';
  desc: string;
  violatedParam?: string;
  raisedTime?: string;
};

const Monitor: React.FC<MonitoringScreenProps> = ({
  visible,
  onClose,
  bedCode,
  patientCode,
  patientId,
  source: initialSource,
  desc,
  violatedParam,
  raisedTime,
}) => {
  const [source, setSource] = useState<'ALARM' | 'DEFAULT'>(initialSource);
  const [leftHeight, setLeftHeight] = useState(0);
  const [metadata, setMetadata] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (!visible || !bedCode || !patientId) return;

    const fetchMetadata = async () => {
      try {
        setLoading(true);
        const context = source === 'ALARM' ? 'ALARM' : 'DEFAULT';
        const param =
          source === 'ALARM' && violatedParam ? violatedParam : undefined;
        const meta = await getMonitorDataAPI(context, param, patientId);
        setMetadata(meta);
      } catch (err) {
        //console.error('Error fetching monitoring data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [visible, bedCode, patientId, source, violatedParam]);

  const filteredWaveforms =
    metadata?.flatMap(device =>
      device.relatedParams
        .filter(
          (p: any) =>
            p.typeOfDisplay === 'wave' &&
            !(
              source === 'ALARM' &&
              violatedParam &&
              p.paramCode === violatedParam
            ),
        )
        .map((p: any) => ({
          ...p,
          deviceCode: device.deviceCode,
          deviceId: device.deviceId,
        })),
    ) || [];

  const violatedDeviceCode = metadata?.find(device =>
    device.relatedParams.some((p: any) => p.paramCode === violatedParam),
  )?.deviceCode;

  const violatedParamData = metadata
    ?.flatMap(device => device.relatedParams)
    .find((p: any) => p.paramName === violatedParam);

  const violatedColor = violatedParamData?.properties?.color || '#0505FF';

  return (
    <View>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* <View style={styles.headerRow}>
            <PatientHeader bedCode={bedCode} onClose={onClose} />
          </View> */}
          <View style={styles.content}>
            <ScrollView>
              {loading ? (
                <ActivityIndicator
                  size="large"
                  color="#007AFF"
                  style={{ marginTop: 20 }}
                />
              ) : (
                <View style={styles.row}>
                  {/* Left Panel */}
                  <View
                    style={styles.leftPanel}
                    onLayout={e => setLeftHeight(e.nativeEvent.layout.height)}
                  >
                    {source === 'ALARM' &&
                      violatedParam &&
                      raisedTime &&
                      violatedDeviceCode && (
                        <AlarmTrendChart
                          paramName={violatedParam}
                          raisedTime={raisedTime}
                          desc={desc}
                          patientCode={patientCode || ''}
                          bedCode={bedCode}
                          deviceCode={violatedDeviceCode}
                          color={violatedColor}
                        />
                      )}

                    {filteredWaveforms.map((p: any) => (
                      <Waveform
                        key={`${p.deviceCode}-${p.paramCode}`}
                        bedCode={bedCode}
                        deviceCode={p.deviceCode}
                        deviceId={p.deviceId}
                        patientCode={patientCode || ''}
                        patientId={patientId}
                        paramCode={p.paramCode}
                        label={p.paramName}
                        unit={p.unit}
                        waveformStrokeColor={p.properties?.color}
                        source={source}
                        violatedParam={violatedParam}
                        raisedTime={raisedTime}
                      />
                    ))}
                  </View>

                  {/* Right Panel */}
                  <VitalsPanelRight
                    height={leftHeight}
                    bedCode={bedCode}
                    patientCode={patientCode || ''}
                    patientId={patientId}
                    source={source}
                    violatedParam={violatedParam}
                    metadata={metadata}
                    raisedTime={raisedTime}
                  />
                </View>
              )}
            </ScrollView>
            {/* <View style={styles.boxColumn}>
              <TouchableOpacity
                style={[
                  styles.blueBox,
                  {
                    backgroundColor:
                      source === 'DEFAULT' ? '#4CAF50' : '#4CAF50',
                  },
                ]}
                onPress={() => {
                  if (initialSource === 'DEFAULT') {
                    if (Platform.OS === 'android') {
                      ToastAndroid.show(
                        'Already viewing live monitoring',
                        ToastAndroid.SHORT,
                      );
                    } else {
                      Alert.alert('Info', 'Already viewing live monitoring');
                    }
                    return;
                  }

                  // Only toggle when user came from alarm
                  setSource(prev => (prev === 'ALARM' ? 'DEFAULT' : 'ALARM'));
                }}
              >
                <Image
                  source={Icon.live}
                  style={[styles.icon]}
                  resizeMode="contain"
                />
                {source === 'ALARM' ? (
                  <Text style={styles.boxText}>Live Monitor</Text>
                ) : source === 'DEFAULT' ? (
                  <Text style={styles.boxText}>Alert Trends</Text>
                ) : null}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.blueBox,
                  {
                    backgroundColor: '#4CAF50',
                  },
                ]}
                onPress={() => setShowInstructions(true)}
              >
                <Image
                  source={Icon.instruction}
                  style={[styles.icon]}
                  resizeMode="contain"
                  tintColor={'#ffff'}
                />
                <Text style={styles.boxText}>Instructions</Text>
              </TouchableOpacity>
            </View> */}
          </View>

          {/* <BottomControls
            onOpenInstructions={() => setShowInstructions(true)}
          /> */}
        </View>
      </View>

      {/* <InstructionsModal
        visible={showInstructions}
        onClose={() => setShowInstructions(false)}
        patientCode={patientCode}
      /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 'auto',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    gap: 12,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    marginRight: scale(20),
  },
  leftPanel: { flex: 1 },
  headerRow: { marginBottom: verticalScale(3) },
  boxColumn: { marginLeft: scale(4), justifyContent: 'space-between' },
   blueBox: {
    width: scale(77),
    height: verticalScale(83),
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(4),
    marginVertical: verticalScale(6),
    gap: verticalScale(4),
    paddingHorizontal: scale(4),
  },
  boxText: {
    color: '#FFFFFF',
    fontSize: RFValue(12, 812),
    fontWeight: '500',
    textAlign: 'center',
    fontStyle: 'normal',
  },
  icon: { width: scale(30), height: verticalScale(30) },
});

export default Monitor;
