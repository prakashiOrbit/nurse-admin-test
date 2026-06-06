import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Dimensions,
  ScrollView,
  Animated,
  Alert,
  Image,
} from 'react-native';
import ConfirmWithoutMonitoringModal from './ConfirmWithoutMonitoringModal';
import { admitPatient } from '../../services/nurseService';
import { startMonitoring, stopMonitoring, getAssignedDevicesAPI, checkMonitoring, getDeviceConfigAPI, patientConfig } from '../../services/deviceService';
import { fetchAlarmConfig } from '../../services/telemetryService';
import { getCommonData } from '../../services/authService';
import Toast from 'react-native-toast-message';
// import { fontScale, scale, verticalScale } from '../../utils/scaling';
import { RFValue } from 'react-native-responsive-fontsize';
import { Icon } from '../../../assets';
import AlarmConfigModal from './AlarmConfigModal';
import { useResponsive } from '../../utils/responsive';
import { getSharedStyles } from '../../styles/sharedStyles';
import { scale, verticalScale } from 'react-native-size-matters';

type ParamThreshold = {
  paramName: string;
  low: number | null;
  high: number | null;
};

type AdmitPatientModalProps = {
  visible: boolean;
  onClose: () => void;
  patientInfo?: {
    firstName: string;
    lastName: string;
    mrNumber: string;
    age: string;
    patientCode: string;
    bedCode: string;
    patientId: string;
  };
  assignedDevices?: Array<{
    deviceCode: string;
    deviceId: string;
    deviceName?: string;
    deviceType: string;
  }>;
};

const AdmitPatientModal: React.FC<AdmitPatientModalProps> = ({
  visible,
  onClose,
  patientInfo,
  assignedDevices = [],
}) => {
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [showConfirmWithoutMonitoring, setShowConfirmWithoutMonitoring] =
    useState(false);
  const [devicesData, setDevicesData] = useState<{
    [key: string]: {
      params: Array<{
        paramName: string;
        unit: string;
        typeOfDisplay: string;
      }>;
      thresholds: Array<{
        MapTo: string;
        DeviceDefaults: {
          DeviceMinimum: number;
          DeviceMaximum: number;
        };
      }>;
    };
  }>({});
  const [currentParamIndices, setCurrentParamIndices] = useState<{
    [key: string]: number;
  }>({});

  const { width, height } = Dimensions.get('window');
  const modalWidth = width * 0.5;
  const modalHeight = height * 0.7;

  const scrollY = useRef(new Animated.Value(0)).current;
  const [scrollHeight, setScrollHeight] = useState(1);
  const [contentHeight, setContentHeight] = useState(1);
  const [deviceMonitoringStatus, setDeviceMonitoringStatus] = useState<{
    [key: string]: boolean;
  }>({});

  const indicatorSize = (scrollHeight / contentHeight) * scrollHeight;
  const scrollableContentHeight = contentHeight - scrollHeight;
  const thumbScrollRange = scrollHeight - indicatorSize;
  const [patientConfigData, setPatientConfigData] = useState<{
    [deviceCode: string]: Record<string, string>;
  }>({});
  const [editThresholdModalVisible, setEditThresholdModalVisible] =
    useState(false);
  const [editThresholds, setEditThresholds] = useState<ParamThreshold[]>([]);
  const { isTablet, wp, hp } = useResponsive();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);
  const translateY = scrollY.interpolate({
    inputRange: [0, scrollableContentHeight > 0 ? scrollableContentHeight : 1],
    outputRange: [0, thumbScrollRange > 0 ? thumbScrollRange : 0],
    extrapolate: 'clamp',
  });
  const handleThresholdSave = (updated: ParamThreshold[]) => {
    console.log('Updated thresholds:', updated);
    // Optionally: Make an API call to save these updated values.
  };

  const handleEditThresholds = (deviceCode: string) => {
    const data = devicesData[deviceCode];
    if (!data) return;

    const thresholds: ParamThreshold[] = data.params.map(param => {
      const t = data.thresholds.find(t => t.MapTo === param.paramName);
      return {
        paramName: param.paramName,
        low: t?.DeviceDefaults?.DeviceMinimum ?? null,
        high: t?.DeviceDefaults?.DeviceMaximum ?? null,
      };
    });

    setEditThresholds(thresholds);
    setEditThresholdModalVisible(true);
  };

  // Load devices data including params and thresholds
  useEffect(() => {
    const loadDevicesData = async () => {
      if (!assignedDevices.length || !patientInfo?.bedCode) return;
      try {
        const { orgName } = await getCommonData();
        const newDevicesData: typeof devicesData = {};
        for (const device of assignedDevices) {
          try {
            const thresholds = await getDeviceConfigAPI(device.deviceId);
            console.log(
              'Device config: ' + JSON.stringify(thresholds, null, 2),
            );
            console.log('Device ' + device.deviceId);
            const alarmConfig = await fetchAlarmConfig(device.deviceId);
            console.log('Alarm Config ' + alarmConfig);

            newDevicesData[device.deviceCode] = {
              params: alarmConfig?.relatedParams || [],
              thresholds: thresholds.dataParameters || [],
            };
          } catch (error) {
            console.error(
              `Error fetching data for device ${device.deviceCode}:`,
              error,
            );
          }
        }
        setDevicesData(newDevicesData);
      } catch (error) {
        console.error('Error loading devices data:', error);
      }
    };
    loadDevicesData();
  }, [assignedDevices, patientInfo?.bedCode]);

  const [pollingPaused, setPollingPaused] = useState(false);

  const pausePolling = (duration = 8000) => {
    setPollingPaused(true);
    setTimeout(() => setPollingPaused(false), duration);
  };

  useEffect(() => {
    if (!patientInfo?.bedCode || !patientInfo?.patientCode || pollingPaused)
      return;

    const fetchMonitoringStatus = async () => {
      try {
        const statusMap: { [key: string]: boolean } = {};
        for (const deviceCode of assignedDevices.map(d => d.deviceCode)) {
          const response = await checkMonitoring(
            deviceCode,
            patientInfo.patientCode,
          );
          statusMap[deviceCode] = response === 'START';
        }
        setDeviceMonitoringStatus(statusMap);
      } catch (error) {
        setDeviceMonitoringStatus({});
      }
    };

    fetchMonitoringStatus();
    const interval = setInterval(fetchMonitoringStatus, 5000);
    return () => clearInterval(interval);
  }, [
    patientInfo?.bedCode,
    patientInfo?.patientCode,
    assignedDevices,
    pollingPaused,
  ]);

  const handleStartMonitoring = async (deviceCode: string) => {
    const data = { deviceCode };
    try {
      const response = await startMonitoring(data);
      Toast.show({
        text1: 'Start Monitoring Success',
        text2: JSON.stringify(response),
        type: 'success',
      });
      Alert.alert(
        'Monitoring Started',
        `Device ${deviceCode} is now being monitored.`,
      );
    } catch (error) {
      console.error('Error starting monitoring:', error);
      Toast.show({
        text1: 'Start Monitoring Failed',
        text2: JSON.stringify(error),
        type: 'error',
      });
      Alert.alert(
        'Error',
        `Failed to start monitoring for device ${deviceCode}.`,
      );
    }
  };

  const handleStopMonitoring = async (deviceCode: string) => {
    const data = { deviceCode };
    try {
      const response = await stopMonitoring(data);
      Toast.show({
        text1: 'Stop Monitoring Success',
        text2: JSON.stringify(response),
        type: 'success',
      });
      Alert.alert(
        'Monitoring Stopped',
        `Device ${deviceCode} monitoring has been stopped.`,
      );
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      Toast.show({
        text1: 'Stop Monitoring Failed',
        text2: JSON.stringify(error),
        type: 'error',
      });
      Alert.alert(
        'Error',
        `Failed to stop monitoring for device ${deviceCode}.`,
      );
    }
  };

  const handlePrevParams = (deviceCode: string, currentIndex: number) => {
    if (currentIndex > 0) {
      setCurrentParamIndices(prev => ({
        ...prev,
        [deviceCode]: currentIndex - 3,
      }));
    }
  };

  const handleNextParams = (
    deviceCode: string,
    currentIndex: number,
    paramsLength: number,
  ) => {
    if (currentIndex + 3 < paramsLength) {
      setCurrentParamIndices(prev => ({
        ...prev,
        [deviceCode]: currentIndex + 3,
      }));
    }
  };

    const fetchPatientConfig = async () => {
      try {
        const newConfigData: { [deviceCode: string]: Record<string, string> } =
          {};
        for (const device of assignedDevices) {
          const config = await patientConfig(patientInfo?.patientId, device.deviceType);
          newConfigData[device.deviceCode] = config;
        }
        setPatientConfigData(newConfigData);
        return newConfigData;
      } catch (error: any) {
        console.log('Error fetching patient config:', error);
      }
    };

    useEffect(() => {
  if (assignedDevices.length ) {
    fetchPatientConfig();
  }
}, [assignedDevices, patientInfo]);

  const modelBoxStyle = useMemo(
    () => ({
      marginTop: verticalScale(6),
      width: isTablet ? wp(60) : scale(450),
      height: isTablet ? hp(70) : verticalScale(255),
      backgroundColor: '#fff',
      borderRadius: scale(3),
      paddingHorizontal: scale(20),
      paddingVertical: verticalScale(14),
      elevation: 5,
    }),
    [isTablet, wp, hp],
  );

  const titleStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(20, 812) : RFValue(18, 812),
      fontWeight: 'bold',
      marginBottom: scale(12),
      textAlign: 'left',
    }),
    [isTablet],
  );

  const labelStyle = useMemo(
    () => ({
      fontWeight: '400',
      width: scale(100),
      textAlign: 'left',
      fontSize: isTablet ? RFValue(16, 812) : RFValue(14, 812),
    }),
    [isTablet],
  );

  const valueStyle = useMemo(
    () => ({
      fontWeight: 'bold',
      color: '#000',
      flexShrink: scale(1),
      width: 'auto',
      fontSize: isTablet ? RFValue(16, 812) : RFValue(14, 812),
    }),
    [isTablet],
  );

  const historyLabelStyle = useMemo(
    () => ({
      fontWeight: '600',
      fontSize: isTablet ? RFValue(14, 812) : RFValue(12, 812),
      color: '#4cae51',
      width: '40%', // Fixed width for labels
      paddingRight: 3, // Add some spacing between label and value
    }),
    [isTablet],
  );

  const historyValueStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(14, 812) : RFValue(12, 812),
      width: '60%', // Fixed width for values
      flexWrap: 'wrap',
    }),
    [isTablet],
  );

  const deviceTitleStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(14, 812) : RFValue(12, 812),
      fontWeight: '600',
      marginBottom: verticalScale(5),
      marginLeft: scale(4),
      textAlign: 'left',
    }),
    [isTablet],
  );

  const btnTextStyle = useMemo(
    () => ({
      color: '#fff',
      fontWeight: '600',
      fontSize: isTablet ? RFValue(14, 812) : RFValue(12, 812),
    }),
    [isTablet],
  );

  const thresholdLabelStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(10, 812) : RFValue(8, 812),
      color: '#444',
      fontWeight: '500',
      lineHeight: verticalScale(16),
      letterSpacing: scale(0.25),
    }),
    [isTablet],
  );

  const thresholdValueStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(10, 812) : RFValue(8, 812),
      color: '#000',
      fontWeight: '600',
      lineHeight: verticalScale(16),
      letterSpacing: scale(0.25),
    }),
    [isTablet],
  );

  const paramNameStyle = useMemo(
    () => ({
      fontWeight: '600',
      fontSize: isTablet ? RFValue(9, 812) : RFValue(8, 812),
      color: '#000000',
      marginBottom: verticalScale(3),
      // marginRight: scale(2),
      lineHeight: verticalScale(16),
      letterSpacing: scale(0.25),
      marginRight: scale(6),
    }),
    [isTablet],
  );

  const cancelTextStyle = useMemo(
    () => ({
      fontWeight: '600',
      color: '#444',
      fontSize: isTablet ? RFValue(16, 812) : RFValue(14, 812),
    }),
    [isTablet],
  );

  const confirmTextStyle = useMemo(
    () => ({
      fontWeight: '600',
      color: '#fff',
      fontSize: isTablet ? RFValue(16, 812) : RFValue(14, 812),
    }),
    [isTablet],
  );

  useEffect(() => {
    const getPatientConfig = async () => {
      try {
        const newConfigData: { [deviceCode: string]: Record<string, string> } = {};
        for (const device of assignedDevices) {
          const config = await patientConfig(patientInfo?.patientId!, device.deviceType);
          console.log('Patient Config for device ' + device.deviceCode + ': ' + JSON.stringify(config, null, 2));
          newConfigData[device.deviceCode] = config;
        }
        setPatientConfigData(newConfigData);
      } catch (error: any) {
        console.log('Error fetching patient config:', error);
        Toast.show({
          text1: 'Error',
          text2: 'Failed to fetch patient configuration.',
          type: 'error',
        });
      }
    };
    if (assignedDevices.length && patientInfo?.patientId) {
      getPatientConfig();
    }
  }, [assignedDevices, patientInfo]);

  const parseParamsFromConfig = (deviceCode: string) => {
    const config = patientConfigData[deviceCode];
    if (!config) return [];

    // Extract unique param prefixes from keys like "HR_High_Value" → "HR"
    const params: { paramName: string; high: number; low: number }[] = [];
    const seen = new Set<string>();

    Object.keys(config).forEach(key => {
      const match = key.match(/^(.+)_High_Value$/);
      if (match) {
        const paramName = match[1]; // "HR", "RR", "SPO2", "Temp", "NIBP_S" etc.
        if (!seen.has(paramName)) {
          seen.add(paramName);
          params.push({
            paramName,
            high: parseFloat(config[`${paramName}_High_Value`] ?? '0'),
            low: parseFloat(config[`${paramName}_Low_Value`] ?? '0'),
          });
        }
      }
    });

    return params;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={modelBoxStyle}>
          <View style={styles.header}>
            <Text style={titleStyle}>Manage Patient</Text>
            <View>
              {onClose && (
                <TouchableOpacity onPress={onClose} style={styles.backArrow}>
                  <Text style={shared.closeText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {patientInfo != null ? (
            <>
              <View style={styles.parent}>
                <View style={styles.left}>
                  <View style={styles.patientInfo}>
                    <Text style={labelStyle}>Patient Name</Text>
                    <Text style={styles.colon}>:</Text>
                    <Text style={valueStyle}>
                      {patientInfo.firstName} {patientInfo.lastName}
                    </Text>
                  </View>

                  <View style={styles.patientInfo}>
                    <Text style={labelStyle}>MRN No</Text>
                    <Text style={styles.colon}>:</Text>
                    <Text style={valueStyle}>{patientInfo.mrNumber}</Text>
                  </View>

                  <View style={styles.patientInfo}>
                    <Text style={labelStyle}>Age</Text>
                    <Text style={styles.colon}>:</Text>
                    <Text style={valueStyle}>{patientInfo.age} yrs</Text>
                  </View>
                </View>

                {/* <View style={styles.right}>
                  <TouchableOpacity style={styles.addButton}>
                    <Text style={styles.addButtonText}>+ Add Devices</Text>
                  </TouchableOpacity>
                </View> */}
              </View>
            </>
          ) : (
            <>
              <Text>No patient is Assigned to this Bed</Text>
            </>
          )}

          <View style={styles.deviceListWrapper}>
            <Animated.ScrollView
              style={styles.scrollArea}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false },
              )}
              onLayout={e => setScrollHeight(e.nativeEvent.layout.height)}
              onContentSizeChange={(w, h) => setContentHeight(h)}
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              {assignedDevices.length > 0 ? (
                assignedDevices.map((device, index) => {
                  const data = devicesData[device.deviceCode];
                  const isMonitoring =
                    deviceMonitoringStatus[device.deviceCode];
                  const params = parseParamsFromConfig(device.deviceCode);
                  const currentIndex =
                    currentParamIndices[device.deviceCode] || 0;
                  const visibleParams = params.slice(
                    currentIndex,
                    currentIndex + 3,
                  );
                  const paramsLength = params.length;
                  return (
                    <View key={index} style={styles.deviceContainer}>
                      <View style={styles.deviceView}>
                        <Text style={deviceTitleStyle}>
                          {device.deviceName || device.deviceCode}
                        </Text>
                        <View style={styles.paramCarousel}>
                          <TouchableOpacity
                            style={styles.arrowButton}
                            onPress={() =>
                              handlePrevParams(device.deviceCode, currentIndex)
                            }
                          >
                            <Text style={styles.arrowText}>◀</Text>
                          </TouchableOpacity>
                          <View style={styles.visibleParamsContainer}>
                            {visibleParams.map((param, pIndex) => {
                              // const thresh = data?.thresholds.find(
                              //   (t: any) => t.MapTo === param.paramName,
                              // );
                              // const high = Math.round(
                              //   thresh?.DeviceDefaults?.DeviceMaximum || 0,
                              // );
                              // const low = Math.round(
                              //   thresh?.DeviceDefaults?.DeviceMinimum || 0,
                              // );
                              const { high, low } = param;

                              return (
                                <View key={pIndex} style={styles.paramCard}>
                                  <Text style={paramNameStyle}>
                                    {param.paramName}:
                                  </Text>
                                  <View style={styles.thresholdBox}>
                                    <Text style={thresholdLabelStyle}>H </Text>
                                    <Text style={thresholdValueStyle}>
                                      {high}
                                    </Text>
                                    <Text style={thresholdLabelStyle}> L </Text>
                                    <Text style={thresholdValueStyle}>
                                      {low}
                                    </Text>
                                  </View>
                                  {/* <Text style={styles.paramUnit}>
                                    {param.unit}
                                  </Text> */}
                                </View>
                              );
                            })}
                          </View>
                          <TouchableOpacity
                            style={styles.arrowButton}
                            onPress={() =>
                              handleNextParams(
                                device.deviceCode,
                                currentIndex,
                                paramsLength,
                              )
                            }
                          >
                            <Text style={styles.arrowTextRight}>▶</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* <View style={styles.buttonContainer}>
                        <View style={styles.deviceRow}>
                          <View style={styles.actionButtons}>
                            {isMonitoring ? (
                              <TouchableOpacity
                                style={[styles.stopBtn, styles.actionBtn]}
                                onPress={async () => {
                                  await handleStopMonitoring(device.deviceCode);
                                  setDeviceMonitoringStatus(prev => ({
                                    ...prev,
                                    [device.deviceCode]: false,
                                  }));
                                  setSelectedDevices(prev =>
                                    prev.filter(
                                      code => code !== device.deviceCode,
                                    ),
                                  );
                                  pausePolling();
                                }}
                              >
                                <Text style={styles.btnText}>Stop</Text>
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                style={[styles.startBtn, styles.actionBtn]}
                                onPress={async () => {
                                  await handleStartMonitoring(
                                    device.deviceCode,
                                  );
                                  setDeviceMonitoringStatus(prev => ({
                                    ...prev,
                                    [device.deviceCode]: true,
                                  }));
                                  setSelectedDevices(prev => [
                                    ...prev,
                                    device.deviceCode,
                                  ]);
                                  pausePolling();
                                }}
                              >
                                <Text style={styles.btnText}>Start</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View> */}
                    </View>
                  );
                })
              ) : (
                <Text>No devices assigned to this patient</Text>
              )}
            </Animated.ScrollView>

            {/* Scrollbar */}
            {contentHeight > scrollHeight && (
              <View style={styles.scrollBarTrack}>
                <Animated.View
                  style={[
                    styles.scrollBarThumb,
                    { height: indicatorSize, transform: [{ translateY }] },
                  ]}
                />
              </View>
            )}
          </View>
          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={cancelTextStyle}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={async () => {
                try {
                  const data = {
                    patientCode: patientInfo?.patientCode,
                    bedCode: patientInfo?.bedCode,
                  };
                  const response = await admitPatient(data);

                  Toast.show({
                    text1: 'Patient Admitted',
                    text2: `Patient ${
                      patientInfo?.firstName + ' ' + patientInfo?.lastName
                    } admitted successfully`,
                    type: 'success',
                  });

                  // Alert.alert('Patient Admitted');
                  // console.log('Admit response:', response);

                  onClose();
                } catch (error) {
                  console.error('Error admitting patient:', error);
                  Toast.show({
                    text1: 'Admit Failed',
                    text2: JSON.stringify(error),
                    type: 'error',
                  });
                  Alert.alert('Error admitting patient');
                }
              }}
            >
              <Text style={confirmTextStyle}>Confirm</Text>
            </TouchableOpacity>

            {/* <ConfirmWithoutMonitoringModal
              visible={showConfirmWithoutMonitoring}
              onClose={() => setShowConfirmWithoutMonitoring(false)}
              onProceed={async () => {
                setShowConfirmWithoutMonitoring(false);
              }}
              patientCode={patientInfo?.patientCode ?? ''}
              bedCode={patientInfo?.bedCode ?? ''}
            /> */}
          </View>
        </View>
        <AlarmConfigModal
          visible={editThresholdModalVisible}
          onClose={() => setEditThresholdModalVisible(false)}
          onSave={handleThresholdSave}
          paramThresholds={editThresholds}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    marginTop: verticalScale(6),
    width: scale(450),
    height: verticalScale(250),
    backgroundColor: '#fff',
    borderRadius: scale(3),
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(14),
    elevation: 5,
  },
  deviceListWrapper: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    borderWidth: scale(1),
    borderColor: '#000000',
    borderRadius: scale(3),
    padding: scale(8),
    marginVertical: verticalScale(3),
  },
  scrollArea: {
    flex: 1,
  },
  scrollBarTrack: {
    width: scale(4),
    backgroundColor: '#e0e0e0',
    borderRadius: scale(3),
    marginLeft: scale(6),
  },
  scrollBarThumb: {
    width: scale(4),
    backgroundColor: '#4CAE51',
    borderRadius: scale(3),
  },
  parent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(10),
  },
  left: {
    flex: 0.7,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginRight: scale(10),
  },
  right: {
    flex: 0.3,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // title: {
  //   fontSize: fontScale(18),
  //   fontWeight: 'bold',
  //   marginBottom: scale(12),
  //   textAlign: 'left',
  // },
  patientInfo: {
    flexDirection: 'row',
    marginBottom: scale(2),
    alignItems: 'center',
  },
  // label: {
  //   fontWeight: '400',
  //   width: scale(100),
  //   textAlign: 'left',
  //   fontSize: fontScale(14),
  // },
  colon: {
    width: scale(10),
    textAlign: 'center',
  },
  // value: {
  //   fontWeight: 'bold',
  //   color: '#000',
  //   flexShrink: scale(1),
  //   width: 'auto',
  //   fontSize: fontScale(14),
  // },

  addButton: {
    backgroundColor: '#4cae51',
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(12),
    borderRadius: scale(6),
    marginVertical: verticalScale(2),
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  deviceView: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  deviceContainer: {
    width: '97%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(2),
    padding: scale(8),
    marginVertical: verticalScale(5),
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
    marginHorizontal: scale(7),
  },
  deviceTitle: {
    fontSize: RFValue(13, 812),
    fontWeight: '600',
    marginBottom: verticalScale(5),
    marginLeft: scale(4),
    textAlign: 'left',
  },
  paramContainer: {
    flex: 1,
    alignItems: 'center',
  },
  // paramLabel: {
  //   fontSize: fontScale(12),
  //   fontWeight: 'bold',
  //   marginBottom: 2,
  // },
  // thresholdText: {
  //   fontSize: fontScale(12),
  // },
  buttonContainer: {
    // width: '100%',
    alignSelf: 'center',
  },
  startButton: {
    backgroundColor: '#4CAE51',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: scale(3),
  },
  // startButtonText: {
  //   color: '#fff',
  //   fontWeight: 'bold',
  //   fontSize: fontScale(12),
  // },
  stopButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: scale(3),
  },
  // stopButtonText: {
  //   color: '#fff',
  //   fontWeight: 'bold',
  //   fontSize: fontScale(12),
  // },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 0,
  },
  cancelBtn: {
    flex: 1,
    marginRight: scale(8),
    paddingVertical: verticalScale(10),
    borderRadius: scale(3),
    borderWidth: scale(1),
    alignItems: 'center',
    borderColor: '#000000',
  },
  // cancelText: {
  //   fontWeight: '600',
  //   color: '#444',
  //   fontSize: fontScale(14),
  // },
  confirmBtn: {
    flex: 1,
    marginLeft: scale(8),
    paddingVertical: verticalScale(10),
    borderRadius: scale(3),
    backgroundColor: '#4cae51',
    alignItems: 'center',
  },
  // confirmText: {
  //   fontWeight: '600',
  //   color: '#fff',
  //   fontSize: fontScale(14),
  // },
  tableHeader: {
    paddingBottom: scale(4),
    marginBottom: scale(6),
  },
  deviceColumnLeft: {
    flex: 0.7,
    textAlign: 'left',
  },
  deviceColumnRight: {
    flex: 0.3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchButton: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }], // slightly bigger, but keeps thumb inside
    marginVertical: verticalScale(5),
    marginHorizontal: scale(10),
  },
  backArrow: {
    paddingHorizontal: scale(5),
    paddingVertical: verticalScale(2),
    backgroundColor: '#ffff',
    borderRadius: scale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: scale(2),
    elevation: 3,
    boxShadow: '-1px 4px 4px rgba(0, 0, 0, 0.17)',
  },
  // closeText: { fontSize: fontScale(16), fontWeight: 'bold' },
  paramRow: {
    width: '100%',
    height: verticalScale(35),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(6),
  },

  paramCarousel: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(6),
    paddingHorizontal: scale(2),
    minHeight: verticalScale(42),
  },

  arrowButton: {
    // paddingHorizontal: scale(4),
    // paddingVertical: verticalScale(2),
  },

  arrowText: {
    fontSize: RFValue(16, 812),
    fontWeight: 'bold',
    color: '#000',
    paddingRight: scale(10),
  },

  arrowTextRight: {
    fontSize: RFValue(16, 812),
    fontWeight: 'bold',
    color: '#000',
    width: scale(22),
    paddingLeft: scale(10),
  },

  editView: {
    width: scale(30),
    height: verticalScale(25),
    backgroundColor: '#4CAF50',
    borderRadius: scale(3),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scale(12),
  },
  edit: {
    width: scale(20),
    height: verticalScale(15),
    paddingHorizontal: scale(2),
    paddingVertical: verticalScale(2),
  },

  visibleParamsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'stretch',
    gap: scale(6), // even spacing between cards
    paddingHorizontal: scale(4),
  },

  paramCard: {
    width: 'auto',
    flexDirection: 'row',
    marginHorizontal: scale(1),
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderRadius: scale(2),
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(2),
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },

  paramName: {
    fontWeight: '600',
    fontSize: RFValue(9, 812),
    color: '#000000',
    marginBottom: verticalScale(3),
    marginRight: scale(4),
    lineHeight: verticalScale(16),
    letterSpacing: scale(0.25),
  },

  thresholdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(2),
    lineHeight: verticalScale(16),
    letterSpacing: scale(0.25),
  },

  // thresholdLabel: {
  //   fontSize: fontScale(11),
  //   color: '#444',
  //   fontWeight: '500',
  //   lineHeight: verticalScale(16),
  //   letterSpacing: scale(0.25),
  // },

  // thresholdValue: {
  //   fontSize: fontScale(11),
  //   color: '#000',
  //   fontWeight: '600',
  //   lineHeight: verticalScale(16),
  //   letterSpacing: scale(0.25),
  // },
  // paramUnit: {
  //   fontSize: fontScale(10),
  //   color: '#666',
  // },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(2),
  },
  // deviceText: {
  //   fontSize: fontScale(12),
  // },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  actionBtn: {
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(10),
    borderRadius: scale(4),
  },

  startBtn: {
    backgroundColor: '#4CAF50', // green
  },

  stopBtn: {
    backgroundColor: '#f44336', // red
  },

  // btnText: {
  //   color: '#fff',
  //   fontWeight: '600',
  //   fontSize: fontScale(12),
  // },
});
export default AdmitPatientModal;
