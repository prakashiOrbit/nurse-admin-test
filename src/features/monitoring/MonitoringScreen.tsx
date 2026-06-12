import React, { useEffect, useMemo, useState } from 'react';
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
  Text,
  Alert,
} from 'react-native';
import PatientHeader from './Header/PatientHeader';
import VitalsPanelRight from './Vitals/VitalsPanelRight';
import BottomControls from './Controls/BottomControls';
// import { scale, verticalScale } from '../../utils/scaling';
import { getMonitorDataAPI } from '../../services/telemetryService';
import AlarmTrendChart from './Charts/AlarmTrendChart';
import Waveform from '../../components/Waveform';
import InstructionModal from '../../components/CallOutModal/InstructionModal';
import { RFValue } from 'react-native-responsive-fontsize';
import { Icon } from '../../../assets';
import CalloutHeader from '../../components/CalloutHeader';
import { useResponsive } from '../../utils/responsive';
import { getSharedStyles } from '../../styles/sharedStyles';
import { scale, verticalScale } from 'react-native-size-matters';
import { useTranslation } from 'react-i18next';
const iconImg = require('../images/img.png');
const MonitoringVector = require('../../../assets/icons/monitoring.png');
const InstructionsVector = require('../../../assets/icons/instruction.png');
const WardTransferVector = require('../../../assets/icons/move_out.png');
const DelegateVector = require('../../../assets/icons/delegate.png');
const DoctorVector = require('../../../assets/icons/doctor.png');

// const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  dataTimeStamp: string;
  alarmValue?: string;
};

const MonitoringScreen: React.FC<MonitoringScreenProps> = ({
  visible,
  onClose,
  bedCode,
  patientCode,
  patientId,
  source: initialSource,
  desc,
  violatedParam,
  raisedTime,
  dataTimeStamp,
  alarmValue,
}) => {
  console.log('====================================');
  console.log('Datatimestamp MonitoringScreen: ' + dataTimeStamp);
  console.log('====================================');
  const [source, setSource] = useState<'ALARM' | 'DEFAULT'>(initialSource);
  const [leftHeight, setLeftHeight] = useState(0);
  const [metadata, setMetadata] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    'instructions' | 'moveout' | 'delegate' | 'monitoring'
  >('monitoring');
  const { t } = useTranslation();
  const { isTablet, wp, hp } = useResponsive();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);
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

  const handleClose = () => {
    setSelectedTab('instructions'); // reset to default
    setLeftHeight(0);
    setLoading(false);

    onClose(); // call parent close
  };

  const convertIsoToMillis = (isoString: string): number => {
    if (!isoString) return 0;
    const ms = new Date(isoString).getTime();
    return isNaN(ms) ? 0 : ms;
  };

  const bedCodeStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(18, 812) : RFValue(17, 812),
      fontWeight: '600',
      color: '#4caf50',
    }),
    [isTablet],
  );

  const containerStyle = useMemo(
    () => ({
      // width: isTablet ? wp(90) : screenWidth * 0.83,
      // height: isTablet ? hp(70) : screenHeight * 0.86,
      width: isTablet ? wp(90) : scale(650),
      height: isTablet ? hp(70) : verticalScale(260),
      // width: scale(490),
      // height: verticalScale(325),
      backgroundColor: '#fff',
      overflow: 'hidden',
      borderRadius: scale(6),
    }),
    [isTablet],
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={containerStyle}>
          <View style={styles.headerRow}>
            <PatientHeader bedCode={bedCode} onClose={onClose} />
          </View>
          <View style={styles.content}>
            <ScrollView style={{ flex: 1 }}>
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
                      convertIsoToMillis(dataTimeStamp) !== 0 &&
                      violatedDeviceCode && (
                        <AlarmTrendChart
                          paramName={violatedParam}
                          raisedTime={convertIsoToMillis(dataTimeStamp)}
                          desc={desc}
                          patientCode={patientCode || ''}
                          bedCode={bedCode}
                          deviceCode={violatedDeviceCode}
                          color={violatedColor}
                          alarmValue={alarmValue}
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
                        raisedTime={convertIsoToMillis(dataTimeStamp)}
                      />
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
            {/* Right Panel */}
            <VitalsPanelRight
              height={leftHeight}
              bedCode={bedCode}
              patientCode={patientCode || ''}
              patientId={patientId}
              source={source}
              violatedParam={violatedParam}
              metadata={metadata}
              raisedTime={convertIsoToMillis(dataTimeStamp)}
            />
            <View style={styles.boxColumn}>
              {initialSource === 'ALARM' && (
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
                      return;
                    }
                    setSource(prev => (prev === 'ALARM' ? 'DEFAULT' : 'ALARM'));
                  }}
                >
                  <Image
                    source={Icon.live}
                    style={[styles.icon]}
                    resizeMode="contain"
                  />
                  {source === 'ALARM' ? (
                    <Text style={styles.boxText}>{t('monitoring.live_monitor')}</Text>
                  ) : (
                    <Text style={styles.boxText}>{t('monitoring.alarm_graph')}</Text>
                  )}
                </TouchableOpacity>
              )}
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
                <Text style={styles.boxText}>{t('common.instructions')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <InstructionModal
        visible={showInstructions}
        onClose={() => setShowInstructions(false)}
        patientCode={patientCode || ''}
      />
    </Modal>
  );
};

const ActionButton = ({
  label,
  icon,
  onPress,
  isActive,
}: {
  label: string;
  icon: any;
  onPress: () => void;
  isActive: boolean;
}) => (
  <TouchableOpacity
    style={[
      styles.actionButton,
      { backgroundColor: isActive ? '#4CAE51' : '#C8E6CB' }, // Active = green, inactive = faded
    ]}
    onPress={onPress}
  >
    <Image
      source={icon}
      style={[styles.actionIcon, { tintColor: isActive ? '#fff' : '#1E4721' }]}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  row: {
    flexDirection: 'row',
    // alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    paddingHorizontal: scale(12),
    gap: scale(12),
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    marginRight: scale(12),
  },
  // leftPanel: {flex: 1},
  // headerRow: {marginBottom: verticalScale(1)},
  // boxColumn: {marginLeft: scale(4), justifyContent: 'space-between'},
  // blueBox: {
  //   width: scale(40),
  //   height: verticalScale(50),
  //   backgroundColor: '#4A90E2',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   borderRadius: scale(4),
  //   marginVertical: verticalScale(6),
  // },
  icon: { width: scale(30), height: verticalScale(30) },
  actionButton: {
    flex: 1,
    backgroundColor: '#2ecc71',
    height: scale(35),
    paddingVertical: verticalScale(10),
    borderRadius: scale(3),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row', // add this
    gap: scale(4), // optional for spacing between icon and text
  },
  actionIcon: {
    width: scale(16),
    height: verticalScale(21),
    marginRight: scale(8),
    resizeMode: 'contain',
    maxHeight: verticalScale(21),
    justifyContent: 'space-evenly',
  },
  buttonRow: {
    flexDirection: 'row',
    // marginTop: 'auto',
    justifyContent: 'space-around',
    gap: 12,
    alignSelf: 'center',
    marginVertical: verticalScale(4), // Add vertical spacing
    marginHorizontal: scale(8), // Add horizontal spacing
    paddingVertical: verticalScale(4), // Add internal padding
  },
  leftPanel: {
    flex: 1,
  },
  headerRow: { marginBottom: verticalScale(3) },
  boxColumn: { marginLeft: scale(4), justifyContent: 'flex-start' },
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
});

export default MonitoringScreen;
