import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Text,
  Pressable,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Animated,
  Alert,
  FlatList,
} from 'react-native';
const MonitoringVector = require('../../../assets/icons/monitoring.png');
const InstructionsVector = require('../../../assets/icons/instruction.png');
const WardTransferVector = require('../../../assets/icons/move_out.png');
const DelegateVector = require('../../../assets/icons/delegate.png');
const DoctorVector = require('../../../assets/icons/doctor.png');

import { getAlarmDetailByIdAPI } from '../../services/alarmService';
import { getAssignedDevicesAPI } from '../../services/deviceService';
import { getVitalRecordsAPI, getMonitorDataAPI } from '../../services/telemetryService';
import { fontScale, scale, verticalScale } from '../../utils/scaling';
import { RFValue } from 'react-native-responsive-fontsize';
import { AlarmDetailFullDTO, VitalDataPoint } from '../../types/Types';
import VitalsLineChart from '../VitalsLineChart';
import MonitoringScreen from '../../features/monitoring/MonitoringScreen';

import PatientInstructions from '../../screens/PatientsComponents/PatientInstructions';
import { useResponsive } from '../../utils/responsive';
import { getSharedStyles } from '../../styles/sharedStyles';
import { useTranslation } from 'react-i18next';

export const fetchMonitorMetadata = async (
  violatedParam: string,
  patientId: string,
) => {
  try {
    const metadata = await getMonitorDataAPI('ALARM', violatedParam, patientId);
    // console.log('Fetched Metadata::', metadata);
    return metadata;
  } catch (error) {
    // console.error('Error fetching monitor metadata:', error);
    return null;
  }
};

type NotificationCallOutModalProps = {
  visible: boolean;
  onClose: () => void;
  bedPatientInfo?: {
    bedCode: string;
    firstName?: string;
    lastName?: string;
    age?: number;
    gender?: string;
    patientCode?: string;
    auditMe?: { createdtime?: string };
    patientId?: string;
  };
  // raisedAlarm?:  {
  //   alarmDetailsId: string;
  //   alarmId: string;
  //   bedCode: string;
  //   detailedDescription: string;
  //   windowStartTime: number;
  //   windowEndTime: number;
  //   patientCode: string;
  //   violatedParameter: string;
  //   wardCode: string;
  //   wardName: string;
  //   raisedTime: number;
  // }
  raisedAlarm?: AlarmDetailFullDTO;
};

interface VitalApiResponse {
  vitalName: string;
  vitalValue: string[];
  startTime: string;
  endTime: string;
  timestamp: string;
  interval: number;
}
const NotificationCallOutModal: React.FC<NotificationCallOutModalProps> = ({
  visible,
  onClose,
  bedPatientInfo,
  raisedAlarm,
}) => {
  const { t } = useTranslation();
  const { isTablet, wp, hp } = useResponsive();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);
  const [selectedTab, setSelectedTab] = useState<
    'instructions' | 'moveout' | 'delegate' | 'monitoring'
  >('instructions');
  const [nurses, setNurses] = useState<any[]>([]);
  const [selectedNurseId, setSelectedNurseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [instructions, setInstructions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vitalsData, setVitalsData] = useState<VitalApiResponse[]>([]);
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const { width, height } = Dimensions.get('window');
  const modalWidth = width * 0.65; // leaves 10% on each side - 0.7
  const modalHeight = height * 0.7; // 0.86
  const [fullData, setFullData] = useState<AlarmDetailFullDTO | undefined>(
    undefined,
  );
  
  // const [monitoringProps, setMonitoringProps] = useState<any>(null);
  const [monitoringVisible, setMonitoringVisible] = useState(false);
  const [monitorMetadata, setMonitorMetadata] = useState<any | null>(null);
  const [activeDeviceCode, setActiveDeviceCode] = useState<string | null>(null);
  const activeAlarmIdRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const activeStreamRef = useRef<string | null>(null);
  const prevParamKeyRef = useRef<string | null>(null);
  const prevPatientIdRef = useRef<string | null>(null);

  let admissionDate = '-';

  // const handleClose = () => {
  //   setSelectedTab('instructions'); // reset to default

  //   onClose(); // call parent close
  // };

  const scrollY = useRef(new Animated.Value(0)).current;
  const [scrollHeight, setScrollHeight] = useState(1);
  const [contentHeight, setContentHeight] = useState(1);
  // const [alerts, setAlerts] = useState<any[]>([]);

  const indicatorSize = (scrollHeight / contentHeight) * scrollHeight;
  const scrollableContentHeight = contentHeight - scrollHeight;
  const thumbScrollRange = scrollHeight - indicatorSize;

  const translateY = scrollY.interpolate({
    inputRange: [0, scrollableContentHeight > 0 ? scrollableContentHeight : 1],
    outputRange: [0, thumbScrollRange > 0 ? thumbScrollRange : 0],
    extrapolate: 'clamp',
  });

  const currentPatient = bedPatientInfo?.patientCode;
  if (bedPatientInfo?.auditMe?.createdtime) {
    const dateObj = new Date(bedPatientInfo.auditMe.createdtime);
    admissionDate = dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  useEffect(() => {
    if (!visible || !fullData?.violatedParameter || !bedPatientInfo?.patientId)
      return;
    const violatedParam = getParameterParts(fullData.violatedParameter).key;
    if (!violatedParam || violatedParam === '-') return;

    fetchMonitorMetadata(violatedParam, bedPatientInfo.patientId).then(
      setMonitorMetadata,
    );
  }, [visible, fullData?.violatedParameter, bedPatientInfo?.patientId]);

  // useEffect(() => {
  //   if (!visible) {
  //     activeAlarmIdRef.current = null; // ← reset on close
  //   }
  // }, [visible]);

  useEffect(() => {
    if (!visible || !raisedAlarm?.alarmId) return;

    // Same alarm reopened — no re-fetch needed
    if (activeAlarmIdRef.current === raisedAlarm.alarmId) {
      setIsReady(true);
      return;
    }

   activeAlarmIdRef.current = raisedAlarm.alarmId;
    setIsReady(false);
    setFullData(undefined);
    setVitalsData([]);
    setMonitorMetadata(null);

    const fetchDetails = async () => {
      try {
        const response = await getAlarmDetailByIdAPI(
          raisedAlarm.alarmId,
          raisedAlarm.bedCode,
        );
        setFullData({
          ...raisedAlarm,
          ...response,
          icon: raisedAlarm.icon,
          iconColor: raisedAlarm.iconColor,
        });
        setIsReady(true);
      } catch (e) {
        console.log('Alarm detail fetch failed', e);
      }
    };

    fetchDetails();
  }, [raisedAlarm?.alarmId, visible]);

  // Add this NEW useEffect — syncs priority/raisedTime when parent pushes fresher data
  useEffect(() => {
    if (!raisedAlarm || !fullData) return;
    if (raisedAlarm.alarmId !== fullData.alarmId) return;

    if (
      raisedAlarm.raisedTime !== fullData.raisedTime ||
      raisedAlarm.priority !== fullData.priority
    ) {
      setFullData(prev => ({
        ...prev!,
        raisedTime: raisedAlarm.raisedTime,
        priority: raisedAlarm.priority,
        iconColor: raisedAlarm.iconColor,
      }));
    }
  }, [raisedAlarm]);

  const Icon = fullData?.icon;
  const color = fullData?.iconColor || '#000';
  const alarmSummary = fullData?.detailedDescription;
  const desc = fullData?.summaryDescription;

  const handleGoToMonitoring = async () => {
    setMonitoringVisible(true);
  };

  useEffect(() => {
    if (!visible) return;
    if (selectedTab === 'monitoring') {
      handleGoToMonitoring();
    }
  }, [visible, selectedTab]);

  const handleMonitoringClose = () => {
    setMonitoringVisible(false);
    setSelectedTab('instructions');
  };
  const getParameterParts = (
    param?: string,
  ): { key: string; value: string } => {
    if (!param) return { key: '-', value: '-' };
    const [rawKey, rawValue] = param.split(':');
    return {
      key: rawKey?.trim() ?? '-',
      value: rawValue?.trim() ?? '-', // this will be the number like 90
    };
  };

  const { key: vitalName, value: vitalValue } = getParameterParts(
    fullData?.violatedParameter,
  );

  const formatRaisedTime = (ms: number): string => {
    // console.log('Raised Time', ms);
    if (!ms) return '';
    const date = new Date(ms);
    // console.log('Parsed Raised Time:', date);
    const finalDate = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    // console.log('Formatted Raised Time:', finalDate);
    return finalDate;
  };

  const getUnitForParam = (paramKey: string) => {
    if (!monitorMetadata || !activeDeviceCode) return '';

    const deviceMeta = monitorMetadata.find(
      d => d.deviceCode === activeDeviceCode,
    );

    if (!deviceMeta) return '';

    const direct = deviceMeta.relatedParams?.find(
      p => p.paramCode?.toUpperCase() === paramKey.toUpperCase(),
    );

    if (direct?.unit) return direct.unit;

    const parent = deviceMeta.relatedParams?.find(
      p => Array.isArray(p.subParams) && p.subParams.includes(paramKey),
    );

    return parent?.unit || '';
  };

  const toISOWithOffset = (ms: number) => {
    const date = new Date(ms);
    const tzOffsetMin = date.getTimezoneOffset();
    const offsetSign = tzOffsetMin <= 0 ? '+' : '-';
    const offsetHours = String(Math.floor(Math.abs(tzOffsetMin) / 60)).padStart(
      2,
      '0',
    );
    const offsetMinutes = String(Math.abs(tzOffsetMin) % 60).padStart(2, '0');

    return (
      date.getFullYear() +
      '-' +
      String(date.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(date.getDate()).padStart(2, '0') +
      'T' +
      String(date.getHours()).padStart(2, '0') +
      ':' +
      String(date.getMinutes()).padStart(2, '0') +
      ':' +
      String(date.getSeconds()).padStart(2, '0') +
      '.' +
      String(date.getMilliseconds()).padStart(3, '0') +
      offsetSign +
      offsetHours +
      ':' +
      offsetMinutes
    );
  };

  function transformVitalsData(vitalsData: any[]): VitalDataPoint[] {
    return vitalsData.flatMap(vital => {
      if (!vital?.dataPoints?.length) return [];

      const baseTs = new Date(vital.startTime).getTime();

      return vital.dataPoints.map((dp: any) => ({
        time: String(baseTs + (dp.offset || 0)),
        value: Number(dp.value) || 0,
      }));
    });
  }

  // Merge device fetch + vitals fetch into one effect keyed on alarmId:
  useEffect(() => {
    if (!visible || !raisedAlarm?.bedCode) return;

    const { key: vitalName } = getParameterParts(raisedAlarm.violatedParameter);
    if (!vitalName || vitalName === '-') return;

    let cancelled = false;
    let intervalId: NodeJS.Timeout;

    const init = async () => {
      try {
        // Step 1: get device (once per alarm change)
        const deviceCodes = await getAssignedDevicesAPI(raisedAlarm.bedCode);
        if (cancelled || !deviceCodes?.length) return;

        const deviceCode = deviceCodes[0];
        setActiveDeviceCode(deviceCode);

        // Step 2: fetch vitals immediately, then on interval
        const fetchVitals = async () => {
          if (cancelled) return;
          try {
            setLoading(true);
            const raisedTimeMs = raisedAlarm.raisedTime;
            const startTimeMs = raisedTimeMs - 120000;

            const payload = {
              patientCode: raisedAlarm.patientCode,
              deviceCode,
              vitalParams: [vitalName],
              startTime: toISOWithOffset(startTimeMs),
              endTime: toISOWithOffset(raisedTimeMs),
            };

            const data = await getVitalRecordsAPI(payload);
            if (!cancelled) setVitalsData(data);
          } catch (err) {
            console.error(err);
            if (!cancelled) setVitalsData([]);
          } finally {
            if (!cancelled) setLoading(false);
          }
        };

        await fetchVitals();
        intervalId = setInterval(fetchVitals, 5000);
      } catch (err) {
        console.error('Device fetch failed', err);
      }
    };

    init();

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [
  visible,
  raisedAlarm?.patientCode,
  getParameterParts(raisedAlarm?.violatedParameter).key,
  raisedAlarm?.raisedTime,
]); // ← single dep, no race

  const bedCodeStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(18, 812) : RFValue(17, 812),
      fontWeight: 'bold',
      color: '#4CAE51',
      marginRight: 4,
    }),
    [isTablet],
  );

  const nameStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(14, 812) : RFValue(13, 812),
      fontWeight: '700',
      marginRight: 6,
    }),
    [isTablet],
  );

  const genderStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(14, 812) : RFValue(13, 812),
      fontWeight: '400',
    }),
    [isTablet],
  );

  const alarmSummaryStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(12, 812) : RFValue(10, 812),
      fontWeight: '500',
      color: '#000000',
      flexShrink: 1,
      flexWrap: 'wrap',
      width: '100%',
    }),
    [isTablet],
  );

  const cardStyle = useMemo(
    () =>
      ({
        backgroundColor: '#fff',
        borderRadius: 3,
        padding: 6,
        elevation: 20,
        position: 'absolute' as const,
        right: isTablet ? '6%' : '4%',
        bottom: isTablet ? '20%' : '10%',
      } as any),
    [isTablet],
  );

  const raisedTimeStyle = useMemo(
    () => ({
      paddingLeft: scale(3),
      fontSize: isTablet ? RFValue(12, 812) : RFValue(10, 812),
      fontWeight: '800',
      width: '20%',
    }),
    [isTablet],
  );

  const instructionHeaderStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(17, 812) : RFValue(15, 812),
      fontWeight: '500' as any,
      marginBottom: 4,
      color: '#4CAE51',
    }),
    [isTablet],
  );

  const vitalUnitStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(12, 812) : RFValue(10, 812),
    }),
    [isTablet],
  );

  const vitalUnit = getUnitForParam(vitalName);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            cardStyle,
            {
              width: isTablet ? wp(63) : modalWidth,
              height: isTablet ? hp(60) : modalHeight,
            },
          ]}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAE51" />
            </View>
          ) : (
            <>
              <Pressable
                onPress={() => {
                  setSelectedTab('instructions');
                  onClose();
                }}
                style={styles.closeButton}
              >
                <Text style={shared.closeText}>✕</Text>
              </Pressable>
              {/* Header */}
              <View style={styles.parent}>
                <ScrollView>
                  <View style={styles.leftHeader}>
                    <Text style={bedCodeStyle}>
                      {bedPatientInfo?.bedCode ||
                        bedPatientInfo?.bedCode ||
                        '-'}
                    </Text>
                    <Text style={nameStyle}>
                      {bedPatientInfo?.firstName} {bedPatientInfo?.lastName}
                    </Text>
                    <Text style={genderStyle}>
                      {bedPatientInfo?.age + 'yrs'} {'|'}
                    </Text>
                    <Text style={genderStyle}>{bedPatientInfo?.gender}</Text>
                    <View style={styles.alarmInfoContainer}>
                      <View style={styles.alarmInfo}>
                        <View style={styles.alarmInfoLeft}>
                          <View
                            style={[
                              styles.iconView,
                              { backgroundColor: color },
                            ]}
                          >
                            {Icon && (
                              <Icon
                                width={isTablet ? 30 : 20}
                                height={isTablet ? 30 : 20}
                                fill="#fff"
                              />
                            )}
                          </View>
                          <Text style={alarmSummaryStyle}>{alarmSummary}</Text>
                        </View>
                        <Text style={raisedTimeStyle}>
                          {formatRaisedTime(fullData?.raisedTime || 0)}
                        </Text>
                      </View>
                      <View style={styles.alarmData}>
                        <View style={styles.alarmChart}>
                          {vitalsLoading ? (
                            <ActivityIndicator size="small" color="#4a90e2" />
                          ) : Object.keys(vitalsData).length > 0 ? (
                            <VitalsLineChart
                              data={transformVitalsData(vitalsData)}
                            />
                          ) : (
                            <Text>{t('callout.no_data')}</Text>
                          )}
                        </View>
                        <View style={styles.alarmParam}>
                          <Text style={styles.param}>{vitalValue || '-'} </Text>
                          <Text style={vitalUnitStyle}>{vitalUnit}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </ScrollView>
                <View style={styles.dividerContainer}>
                  <View style={styles.dottedLine} />
                </View>
                <View style={styles.header}>
                  {selectedTab === 'instructions' && (
                    //Instruction component
                    <View style={styles.instructionSection}>
                      <View style={styles.instructionHeaderRow}>
                        <Image
                          source={InstructionsVector}
                          style={styles.instructionIcon}
                        />
                        <Text style={instructionHeaderStyle}>{t('common.instructions')}</Text>
                      </View>
                      <Animated.ScrollView
                        style={{ maxHeight: 250 }} // adjust if needed
                        contentContainerStyle={{ paddingRight: 10 }}
                        showsVerticalScrollIndicator={false}
                        scrollEventThrottle={16}
                        onScroll={Animated.event(
                          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                          { useNativeDriver: false },
                        )}
                        onLayout={e =>
                          setScrollHeight(e.nativeEvent.layout.height)
                        }
                        onContentSizeChange={(w, h) => setContentHeight(h)}
                      >
                        <PatientInstructions
                          patientCode={bedPatientInfo?.patientCode || ''}
                        />
                      </Animated.ScrollView>
                      {contentHeight > scrollHeight && (
                        <View style={styles.scrollBarTrack}>
                          <Animated.View
                            style={[
                              styles.scrollBarThumb,
                              {
                                height: indicatorSize,
                                transform: [{ translateY }],
                              },
                            ]}
                          />
                        </View>
                      )}
                    </View>
                  )}
                  {selectedTab === 'moveout' && (
                    <View style={styles.instructionSection}>
                      <View>
                        <View style={styles.instructionHeaderRow}>
                          <Image
                            source={DoctorVector}
                            style={styles.instructionIcon}
                          />
                          <Text
                            style={[
                              instructionHeaderStyle,
                              { color: '#4CAE51' },
                            ]}
                          >
                            {t('callout.send_to_doctor')}
                          </Text>
                        </View>
                      </View>
                      {/* <TouchableOpacity style={styles.confirmButton}>
                    <Text style={{ color: '#000', fontWeight: '600' }}>Send</Text>
                  </TouchableOpacity> */}
                      <View>
                        <Text style={styles.upcomingFeature}>
                          {t('callout.upcoming_feature')}
                        </Text>
                      </View>
                    </View>
                  )}
                  {selectedTab === 'delegate' && (
                    <View style={styles.instructionSection}>
                      <View>
                        <View style={styles.instructionHeaderRow}>
                          <Image
                            source={DelegateVector}
                            style={styles.instructionIcon}
                          />
                          <Text
                            style={[
                              instructionHeaderStyle,
                              { color: '#4CAE51' },
                            ]}
                          >
                            {t('callout.delegate')}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.upcomingFeature}>
                            {t('callout.upcoming_feature')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                  {selectedTab === 'monitoring' && (
                    <View>
                      <MonitoringScreen
                        visible={monitoringVisible}
                        onClose={handleMonitoringClose}
                        bedCode={bedPatientInfo?.bedCode || ''}
                        patientCode={bedPatientInfo?.patientCode || ''}
                        patientId={bedPatientInfo?.patientId || ''}
                        raisedTime={fullData?.raisedTime.toString()}
                        dataTimeStamp={fullData?.dataTimeStamp || ''}
                        violatedParam={vitalName}
                        source={'ALARM'}
                        desc={desc || ''}
                        alarmValue={vitalValue}
                      />
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.buttonRow}>
                <ActionButton
                  label={t('callout.monitoring_screen')}
                  icon={MonitoringVector}
                  onPress={() => setSelectedTab('monitoring')}
                  isActive={selectedTab === 'monitoring'}
                />
                <ActionButton
                  label={t('common.instructions')}
                  icon={InstructionsVector}
                  onPress={() => setSelectedTab('instructions')}
                  isActive={selectedTab === 'instructions'}
                />
                <ActionButton
                  label={t('callout.doctor')}
                  icon={DoctorVector}
                  onPress={() => setSelectedTab('moveout')}
                  isActive={selectedTab === 'moveout'}
                />
                <ActionButton
                  label={t('callout.delegate')}
                  icon={DelegateVector}
                  onPress={async () => {
                    setSelectedTab('delegate');
                  }}
                  isActive={selectedTab === 'delegate'}
                />
              </View>
            </>
          )}
        </View>
      </View>
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

export default NotificationCallOutModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(39, 36, 36, 0.14)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 3,
    padding: 6,
    elevation: 20,
    position: 'absolute',
    right: '4%',
    bottom: '10%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  scrollContainer: {
    //alignItems: 'flex-start',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '48%',
  },

  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
    flexShrink: 1,
  },
  dividerContainer: {
    width: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dottedLine: {
    height: '90%',
    borderLeftWidth: 1,
    borderStyle: 'dotted',
    borderLeftColor: '#c0c0c0',
  },

  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  bedCode: {
    fontSize: fontScale(17),
    fontWeight: 'bold',
    color: '#4CAE51',
    marginRight: 4,
  },
  name: {
    fontSize: fontScale(13),
    fontWeight: '700',
    marginRight: 6,
  },
  gender: {
    fontSize: fontScale(13),
    fontWeight: '400',
  },
  closeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#eee',
    borderRadius: 16,

    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,

    // Shadow for Android
    elevation: 3,
  },
  closeText: {
    fontSize: fontScale(12),
    fontWeight: 'bold',
  },
  diagnosis: {
    gap: 8,
  },
  instructionRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  instruction: { fontSize: fontScale(14), color: '#111' },
  instructionContent: {
    width: '100%',
  },
  createdTime: {
    fontSize: RFValue(11, 812),
    color: '#666',
    marginLeft: scale(10),
  },
  bullet: { fontSize: fontScale(14), marginRight: 6, color: '#333' },
  time: {
    fontSize: fontScale(12),
    fontWeight: '500',
    color: '#555',
    marginLeft: 8,
  },

  bold: {
    fontWeight: '600',
  },
  alertBox: {
    marginTop: 20,
    backgroundColor: '#fef4f4',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f5c2c2',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  icon: {
    width: scale(20),
    height: verticalScale(20),
    marginRight: 6,
  },
  alertText: {
    flex: 1,
    fontSize: fontScale(15),
    color: '#d00',
    fontWeight: '600',
  },
  alertTime: {
    fontSize: fontScale(12),
    color: '#777',
  },
  ecgImage: {
    height: verticalScale(60),
    width: '100%',
    marginBottom: 6,
  },
  bpm: {
    fontSize: fontScale(24),
    fontWeight: 'bold',
    color: '#000',
  },
  bpmUnit: {
    fontSize: fontScale(16),
    color: '#555',
  },
  buttonRow: {
    flexDirection: 'row',
    // marginTop: 'auto',
    justifyContent: 'space-around',
    gap: 16,
    alignSelf: 'flex-end',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2ecc71',
    height: verticalScale(35),
    paddingVertical: 10,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row', // add this
    gap: 4, // optional for spacing between icon and text
  },
  actionIcon: {
    width: scale(16),
    height: verticalScale(21),
    marginRight: 8,
    resizeMode: 'contain',
    maxHeight: verticalScale(21),
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: fontScale(14),
  },
  instructionSection: {
    width: '100%',
    //flex: 1,
    borderColor: '#ccc',
    // backgroundColor: '#790878'
  },
  instructionsHeader: {
    fontSize: fontScale(15),
    fontWeight: '500',
    marginBottom: 4,
    color: '#4CAE51',
  },
  confirmButton: {
    marginTop: 12,
    backgroundColor: '#FFFEFE',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  instructionHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 4,
    gap: 6,
  },

  instructionIcon: {
    width: scale(20),
    height: verticalScale(20),
    resizeMode: 'contain',
    tintColor: '#4CAE51',
  },

  contentRow: {
    flexDirection: 'row',
    marginTop: scale(20),
    alignItems: 'stretch',
  },

  leftColumn: {
    width: '48%',
  },

  verticalDivider: {
    width: scale(1),
    backgroundColor: '#aaa',
    marginHorizontal: 0,
    borderStyle: 'dashed',
    borderWidth: 0.8,
    borderColor: '#ccc',
    height: '100%',
  },

  rightColumn: {
    width: '48%',
  },
  verticalLine: {
    width: scale(2),
    backgroundColor: 'green',
    borderStyle: 'dashed',
    marginHorizontal: 10,
  },
  dropdownWrapper: {
    marginTop: 8,
    position: 'relative',
  },

  dropdown: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderColor: '#ccc',
    borderWidth: 1,
  },

  dropdownOverlay: {
    position: 'absolute',
    top: 45, // just below the button
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    zIndex: 1000,
    elevation: 10,
    maxHeight: verticalScale(160), // Enough for ~4 items
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },

  dropdownList: {
    maxHeight: verticalScale(160),
  },

  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // key to separating start, middle, end
    paddingHorizontal: 2,
  },

  dropdownIcon: {
    width: scale(14),
    height: verticalScale(14),
    resizeMode: 'contain',
    tintColor: '#000',
    marginLeft: 8,
  },

  nurseName: {
    flex: 1, // take up remaining space between icons
    fontSize: fontScale(14),
    color: '#000',
    textAlign: 'left',
    marginHorizontal: 4,
  },

  parent: { height: '85%', flexDirection: 'row', alignItems: 'flex-start' },
  parent1: { flexDirection: 'row', position: 'relative', width: '100%' },

  left: { flex: 0.5, justifyContent: 'flex-start', alignItems: 'flex-start' },
  right: { flex: 0.5, justifyContent: 'flex-start', alignItems: 'flex-end' },

  scrollBarTrack: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    height: '90%',
  },

  scrollBarThumb: {
    width: scale(4),
    backgroundColor: '#4CAE51',
    borderRadius: 3,
    marginTop: scale(12),
  },
  alarmData: {
    height: verticalScale(80),
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(3),
    // overflow: 'hidden',
  },
  alarmChart: {
    height: '100%',
    // width: '70%',
    flex: 0.65,
    backgroundColor: '#1111',
    // alignItems: 'center',
    // justifyContent: 'center',
    // marginLeft: scale(-20),
  },
  alarmParam: {
    flex: 0.35,
    flexDirection: 'row',
    alignItems: 'baseline',
    // paddingLeft: scale(10),
    justifyContent: 'flex-end',
  },
  param: {
    fontSize: RFValue(24, 812),
    fontWeight: '900',
  },
  alarmInfo: {
    marginTop: verticalScale(8),
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  alarmInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: scale(10),
    backgroundColor: '#1111',
    padding: scale(4),
    borderRadius: scale(4),
    width: '80%',
  },
  summaryText: {
    fontSize: RFValue(10, 812),
    fontWeight: '500',
    color: '#000000',
    flexShrink: 1,
    flexWrap: 'wrap',
    width: '100%',
  },
  iconView: {
    width: '20%',
    height: verticalScale(35),
    borderRadius: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  raisedTime: {
    paddingLeft: scale(3),
    fontSize: RFValue(10, 812),
    fontWeight: '800',
    width: '20%',
  },

  upcomingFeature: {
    textAlign: 'center',
    fontSize: scale(15),
    fontWeight: '600',
  },
  alarmInfoContainer: {},
});
