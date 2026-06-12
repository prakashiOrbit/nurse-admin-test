import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  Animated,
  Switch,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { assignDefaultAlarm } from '../../services/nurseService';
import { getAssignedDevicesAPI, startMonitoring, stopMonitoring, checkMonitoring, getDeviceConfigAPI, patientConfig } from '../../services/deviceService';
import { getVitalRecordsAPIForMonitoring, fetchAlarmConfig, getMonitorDataAPI } from '../../services/telemetryService';
import { getCommonData } from '../../services/authService';
import Toast from 'react-native-toast-message';
import { RFValue } from 'react-native-responsive-fontsize';
import { verticalScale } from 'react-native-size-matters';
import { fontScale, scale } from '../../utils/scaling';
import { Icon } from '../../../assets';
import AlarmConfigModal from '../../components/CallOutModal/AlarmConfigModal';
import { useResponsive } from '../../utils/responsive';
import { getSharedStyles } from '../../styles/sharedStyles';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useTranslation } from 'react-i18next';

type ParamThreshold = {
  paramName: string;
  low: number | null;
  high: number | null;
};

type PatientDetailsProps = {
  nurses: { code: string; firstName: string; lastName: string }[];
  doctors: { code: string; firstName: string; lastName: string }[];
  medicalHistory: {
    bedCode: string;
    patientCode: string;
    wardCode: string;
    admissionReason: string;
    medicalHistory: string;
    allergies: string;
  } | null;
  assignedDevices: any[];
  selectedDevices: string[];
  patientCode: string;
  patientId: string;
  bedCode: string;
  setSelectedDevices: React.Dispatch<React.SetStateAction<string[]>>;
  HR: number | null;
  RR: number | null;
  SpO2: number | null;
};

const PatientDetails: React.FC<PatientDetailsProps> = ({
  nurses,
  doctors,
  medicalHistory,
  assignedDevices,
  selectedDevices,
  setSelectedDevices,
  patientCode,
  patientId,
  bedCode,
  HR,
  RR,
  SpO2,
}) => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CalloutModal'>>();

  const scrollY = useRef(new Animated.Value(0)).current;
  const [scrollHeight, setScrollHeight] = useState(1);
  const [contentHeight, setContentHeight] = useState(1);
  const [deviceMonitoringStatus, setDeviceMonitoringStatus] = useState<{
    [key: string]: boolean;
  }>({});
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
  const [lastUpdateTimes, setLastUpdateTimes] = useState<{
    [key: string]: Date | null;
  }>({});
  const indicatorSize = (scrollHeight / contentHeight) * scrollHeight * 0.85;
  const scrollableContentHeight = contentHeight - scrollHeight;
  const thumbScrollRange = scrollHeight - indicatorSize;
  const [metadata, setMetadata] = useState<any[]>([]);
  const [editThresholdModalVisible, setEditThresholdModalVisible] =
    useState(false);
  const [editThresholds, setEditThresholds] = useState<ParamThreshold[]>([]);
  const STALE_THRESHOLD = 120000; // 2 minutes in ms - adjust to 180000 (3 mins) if needed

  const [vitalData, setVitalData] = useState<{ [key: string]: string }>({});
  const { isTablet } = useResponsive();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);
  const [configLoading, setConfigLoading] = useState(true);
  const translateY = scrollY.interpolate({
    inputRange: [0, scrollableContentHeight > 0 ? scrollableContentHeight : 1],
    outputRange: [0, thumbScrollRange > 0 ? thumbScrollRange : 0],
    extrapolate: 'clamp',
  });
  const [patientConfigData, setPatientConfigData] = useState<{
    [deviceCode: string]: Record<string, string>;
  }>({});
  const handleThresholdSave = (updated: ParamThreshold[]) => {
    console.log('Updated thresholds:', updated);
    // Optionally: Make an API call to save these updated values.
  };
  // const [updateModalVisible, setUpdateModalVisible] = useState(false);
  // const [selectedParam, setSelectedParam] = useState<any>(null);
  // const handleAlarmConfigUpdate = (
  //   updatedConfig: Record<string, string>,
  //   modalData: {
  //     deviceCode: string;
  //     deviceType: string;
  //     paramName: string;
  //     patientConfig: Record<string, string>;
  //   },
  // ) => {
  //   setPatientConfigData(prev => ({
  //     ...prev,
  //     [modalData.deviceCode]: updatedConfig,
  //   }));
  //   setSelectedParam((prev: typeof modalData | null) =>
  //     prev
  //       ? {
  //           ...prev,
  //           patientConfig: updatedConfig,
  //         }
  //       : prev,
  //   );
  //   console.log('Updated alarm config payload:', updatedConfig);
  //   setUpdateModalVisible(false);
  // };

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

  useEffect(() => {
    const loadDevicesData = async () => {
      if (!assignedDevices.length || !bedCode) return;
      try {
        const { orgName } = await getCommonData();
        const newDevicesData: typeof devicesData = {};
        for (const device of assignedDevices) {
          try {
            const thresholds = await getDeviceConfigAPI(device.deviceId);
            console.log(
              'Device config1: ' + JSON.stringify(thresholds, null, 2),
            );
            console.log('Device ' + device.deviceId);
            const alarmConfig = await fetchAlarmConfig(device.deviceId);
            console.log('Alarm Config ' + alarmConfig);

            const normalizedParams = (alarmConfig?.relatedParams || []).flatMap(
              (p: any) => {
                if (p.paramName === 'NIBP' && p.subParams?.length) {
                  // Expand NIBP → NIBP_S, NIBP_D, NIBP_M
                  return p.subParams.map((sp: string) => ({
                    paramName: sp,
                    unit: p.unit || 'mmHg',
                    typeOfDisplay: 'value',
                  }));
                }
                return p;
              },
            );

            newDevicesData[device.deviceCode] = {
              params: normalizedParams,
              thresholds: thresholds.dataParameters || [],
            };
          } catch (error) {
            // console.error(
            //   `Error fetching data for device ${device.deviceCode}:`,
            //   error,
            // );
          }
        }
        setDevicesData(newDevicesData);
      } catch (error) {
        console.error('Error loading devices data:', error);
      }
    };
    loadDevicesData();
  }, [assignedDevices, bedCode]);

  const [pollingPaused, setPollingPaused] = useState(false);

  const pausePolling = (duration = 8000) => {
    setPollingPaused(true);
    setTimeout(() => setPollingPaused(false), duration);
  };

  useEffect(() => {
    if (!bedCode || !patientCode || pollingPaused) return;

    const fetchMonitoringStatus = async () => {
      try {
        const statusMap: { [key: string]: boolean } = {};
        for (const deviceCode of assignedDevices.map(d => d.deviceCode)) {
          const response = await checkMonitoring(deviceCode, patientCode);
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
  }, [bedCode, patientCode, assignedDevices, pollingPaused]);

  const fetchPatientConfig = async () => {
    try {
      const newConfigData: { [deviceCode: string]: Record<string, string> } =
        {};
      for (const device of assignedDevices) {
        const config = await patientConfig(patientId, device.deviceType);
        newConfigData[device.deviceCode] = config;
      }
      setPatientConfigData(newConfigData);
      return newConfigData;
    } catch (error: any) {
      console.log('Error fetching patient config:', error);
    }
  };

  const handleStartMonitoring = async (deviceCode: string) => {
    const data = { deviceCode };

    try {
      // try {
      //   const data1 = { deviceCode, patientId };
      //   await assignDefaultAlarm(data1);
      // } catch (error: any) {
      //   console.log(error);
      //   throw error;
      // }

      const response = await startMonitoring(data);

      Toast.show({
        text1: t('monitoring.start_success'),
        text2: t('monitoring.started_msg', {deviceCode}),
        type: 'success',
      });

      // Alert.alert(
      //   'Monitoring Started',
      //   `Device ${deviceCode} is now being monitored.`,
      // );

      // Re-fetch patient config after start so thresholds update
      // without requiring modal close/reopen
      const updatedConfigs = await fetchPatientConfig();

      // If the modal is currently open for this device, refresh its data too
      // if (
      //   updatedConfigs &&
      //   updateModalVisible &&
      //   selectedParam?.deviceCode === deviceCode
      // ) {
      //   setSelectedParam((prev: any) =>
      //     prev ? { ...prev, patientConfig: updatedConfigs[deviceCode] } : prev,
      //   );
      // }
    } catch (error) {
      console.error('Error starting monitoring:', error);

      Toast.show({
        text1: t('monitoring.start_failed'),
        text2: t('monitoring.start_failed_msg', {deviceCode}),
        type: 'error',
      });
    }
  };

  const handleStopMonitoring = async (deviceCode: string) => {
    const data = { deviceCode };
    try {
      const response = await stopMonitoring(data);
      Toast.show({
        text1: t('monitoring.stop_success'),
        text2: t('monitoring.stopped_msg', {deviceCode}),
        type: 'success',
      });
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      Toast.show({
        text1: t('monitoring.stop_failed'),
        text2: t('monitoring.stop_failed_msg', {deviceCode}),
        type: 'error',
      });
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

  const resetVitals = () => {
    setVitalData({});
    setLastUpdateTimes({});
  };

  useEffect(() => {
    if (!bedCode || !patientCode) return;

    const fetchMonitoringStatus = async () => {
      try {
        const deviceCodes = await getAssignedDevicesAPI(bedCode);
        if (!deviceCodes || deviceCodes.length === 0) {
          setDeviceMonitoringStatus({});
          return;
        }

        const statusMap: { [key: string]: boolean } = {};

        for (const deviceCode of deviceCodes) {
          const response = await checkMonitoring(deviceCode, patientCode);
          statusMap[deviceCode] = response === 'START'; // backend sends "START"
        }

        setDeviceMonitoringStatus(statusMap);
      } catch (error) {
        //console.error("Error checking monitoring:", error);
        setDeviceMonitoringStatus({});
      }
    };

    fetchMonitoringStatus();
    const interval = setInterval(fetchMonitoringStatus, 5000); // refresh every 5 sec
    return () => clearInterval(interval);
  }, [bedCode, patientCode]);

  useEffect(() => {
    if (!bedCode || !patientCode) {
      return;
    }

    const fetchVitals = async () => {
      try {
        const metadata = await getMonitorDataAPI(
          'DEFAULT_PATIENT',
          '',
          patientId,
        );
        setMetadata(metadata);

        console.log(
          'Metadata from patientdetails1: ' + JSON.stringify(metadata, null, 2),
        );

        if (!metadata || metadata.length === 0) {
          // showToast('No monitoring data available for this patient.');
          resetVitals();
          return;
        }

        // Take all deviceCodes from monitoring API, but skip devices with no params
        const allDevices = metadata
          .map((d: any) => ({
            deviceCode: d.deviceCode,
            params: d.relatedParams?.map((p: any) => p.paramCode) || [],
          }))
          .filter((d: any) => d.params.length > 0); // skip devices with empty params

        console.log(
          'Devices (filtered): ' + JSON.stringify(allDevices, null, 2),
        );

        const vitalsObj: { [key: string]: string } = {};
        const updateTimesObj: { [key: string]: Date | null } = {
          ...lastUpdateTimes,
        };

        for (const device of allDevices) {
          try {
            console.log('Device code: ' + device.deviceCode, device.params);

            const data = await getVitalRecordsAPIForMonitoring({
              patientCode,
              deviceCode: device.deviceCode,
              vitalParams: device.params,
            });

            console.log(
              'Raw data from getVitalRecordsAPI(' + device.deviceCode + '):',
              JSON.stringify(data, null, 2),
            );

            console.log(
              'Data for device ' +
                device.deviceCode +
                ': ' +
                JSON.stringify(data, null, 2),
            );

            device.params.forEach((paramCode: string) => {
              const vital = data.find((v: any) => v.vitalName === paramCode);
              vitalsObj[paramCode] = vital?.vitalValue?.at(-1) || '--';

              if (!vital || !vital.dataPoints?.length) {
                vitalsObj[paramCode] = '--';
                updateTimesObj[paramCode] = null;
                return;
              }
              // LAST DATAPOINT
              const lastPoint = vital.dataPoints[vital.dataPoints.length - 1];

              const baseTs = new Date(vital.startTime).getTime();
              const lastTs = baseTs + Number(lastPoint.offset);

              // FINAL VALUE
              vitalsObj[paramCode] = lastPoint.value ?? '--';

              // TIMESTAMP
              updateTimesObj[paramCode] = new Date(lastTs);

              if (Date.now() - lastTs > STALE_THRESHOLD) {
                vitalsObj[paramCode] = '--';
              }
            });
          } catch (err) {}
        }

        setVitalData(vitalsObj);
        setLastUpdateTimes(updateTimesObj);
      } catch (err: any) {
        resetVitals();
      }
    };

    fetchVitals();
    const interval = setInterval(fetchVitals, 5000); // refresh every 10 sec
    return () => clearInterval(interval);
  }, [bedCode, patientCode, patientId, assignedDevices]);

useFocusEffect(
  React.useCallback(() => {
    const getPatientConfig = async () => {
      try {
        setConfigLoading(true);
        const newConfigData: { [deviceCode: string]: Record<string, string> } = {};
        for (const device of assignedDevices) {
          const config = await patientConfig(patientId, device.deviceType);
          console.log(
            'Patient Config for device ' +
              device.deviceCode +
              ': ' +
              JSON.stringify(config, null, 2),
          );
          newConfigData[device.deviceCode] = config;
        }
        setPatientConfigData(newConfigData);
      } catch (error: any) {
        console.log('Error fetching patient config:', error);
        Toast.show({
          text1: t('common.error'),
          text2: t('monitoring.fetch_config_failed'),
          type: 'error',
        });
      } finally {
        setConfigLoading(false);
      }
    };

    if (assignedDevices.length && patientId) {
      getPatientConfig();
    }
  }, [assignedDevices, patientId]),
);

  const sectionHeaderStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(16, 812) : RFValue(14, 812),
      fontWeight: '500',
      marginBottom: 3,
    }),
    [isTablet],
  );

  const staffNameStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(15, 812) : RFValue(13, 812),
      marginVertical: 2,
    }),
    [isTablet],
  );

  const sectionHeaderInfoTextStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(15, 812) : RFValue(13, 812),
      fontWeight: '400',
      flexWrap: 'wrap',
    }),
    [isTablet],
  );

  const sectionSubHeaderStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(15, 812) : RFValue(13, 812),
      fontWeight: '600',
      marginBottom: 0,
      color: '#333',
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
      fontSize: isTablet ? RFValue(9, 812) : RFValue(8, 812),
      color: '#444',
      fontWeight: '500',
      lineHeight: verticalScale(16),
      letterSpacing: scale(0.25),
    }),
    [isTablet],
  );

  const thresholdValueStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(9, 812) : RFValue(8, 812),
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
      fontSize: isTablet ? RFValue(10, 812) : RFValue(8, 812),
      color: '#000000',
      marginBottom: verticalScale(3),
      marginRight: scale(2),
      lineHeight: verticalScale(16),
      letterSpacing: scale(0.25),
    }),
    [isTablet],
  );

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

  useEffect(() => {
    const result = route.params?.updatedAlarmConfig;
    if (!result) return;
    const { deviceCode, updatedConfig } = result;
    setPatientConfigData(prev => ({ ...prev, [deviceCode]: updatedConfig }));
    navigation.setParams({ updatedAlarmConfig: undefined } as any);
  }, [route.params?.updatedAlarmConfig]);

  return (
    <>
      {/* Nurses + Doctors */}
      <View style={styles.parent}>
        <View style={[styles.left]}>
          <Text style={sectionHeaderStyle}>
            Assigned Nurses:{' '}
            <Text style={staffNameStyle}>
              {nurses.length > 0
                ? nurses.map(n => `${n.firstName} ${n.lastName}`).join(', ')
                : 'No Nurses Assigned'}
            </Text>
          </Text>
        </View>

        <View style={[styles.right]}>
          <Text style={sectionHeaderStyle}>
            Assigned Doctors:{' '}
            <Text style={staffNameStyle}>
              {doctors.length > 0
                ? doctors.map(d => `${d.firstName} ${d.lastName}`).join(', ')
                : 'No Doctors Assigned'}
            </Text>
          </Text>
        </View>
      </View>

      {/* Vitals */}
      <View style={styles.vitalContainer}>
        {metadata && metadata.length > 0 ? (
          metadata
            .filter(
              device => device.relatedParams && device.relatedParams.length > 0,
            ) // skip empty
            .map(device =>
              device.relatedParams.map(param => (
                <Text
                  key={`${device.deviceCode}-${param.paramCode}`}
                  style={styles.vitals}
                >
                  {param.paramName}: {vitalData[param.paramCode] ?? '--'}{' '}
                  {param.unit || ''}
                </Text>
              )),
            )
        ) : (
          <Text style={styles.vitals}>Monitoring stopped</Text>
        )}
      </View>
      {/* Reason for Admission */}
      <View style={styles.reasonforadmission}>
        <View>
          <Text style={sectionHeaderStyle}>Reason for Admission: </Text>
        </View>
        <View style={[styles.sectionHeaderInfo]}>
          <Text style={sectionHeaderInfoTextStyle}>
            {medicalHistory?.admissionReason || 'No Reason Provided'}
          </Text>
        </View>
      </View>

      {/* Medical History + Fixed Devices */}
      <View style={styles.deviceParent}>
        <View style={styles.deviceLeft}>
          <Text style={sectionSubHeaderStyle}>Medical History</Text>
          <View style={styles.medicalHistorySection}>
            <View style={styles.historyRow}>
              <Text style={historyLabelStyle}>Past Medical History</Text>
              <Text style={historyValueStyle}>
                :- {medicalHistory?.medicalHistory || 'No Past History'}
              </Text>
            </View>
            <View style={styles.historyRow}>
              <Text style={historyLabelStyle}>Known Allergies</Text>
              <Text style={historyValueStyle}>
                :- {medicalHistory?.allergies || 'No Allergies'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.deviceRight}>
          <View>
            <View style={styles.newDeviceParent}>
              <View style={styles.left}>
                <Text style={sectionSubHeaderStyle}>Fixed Devices</Text>
              </View>
              <View style={styles.right}>
                {/* <TouchableOpacity style={styles.addButton}>
                  <Text style={styles.addButtonText}>+ Add Devices</Text>
                </TouchableOpacity> */}
              </View>
            </View>
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
                    // console.log(
                    //   'Device Data for ' +
                    //     device.deviceCode +
                    //     ': ' +
                    //     JSON.stringify(data, null, 2),
                    // );
                    const isMonitoring =
                      deviceMonitoringStatus[device.deviceCode];
                    const params = parseParamsFromConfig(device.deviceCode);
                    const hasConfig = params && params.length > 0;
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
                          <View style={styles.deviceHeader}>
                            <Text style={deviceTitleStyle}>
                              {device.deviceName || device.deviceCode}
                            </Text>
                            <View style={styles.actionButtons}>
                              {isMonitoring ? (
                                <TouchableOpacity
                                  style={[styles.stopBtn, styles.actionBtn]}
                                  onPress={async () => {
                                    await handleStopMonitoring(
                                      device.deviceCode,
                                    );
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
                                  <Text style={btnTextStyle}>Stop</Text>
                                </TouchableOpacity>
                              ) : (
                                <TouchableOpacity
                                  style={[
                                    styles.startBtn,
                                    styles.actionBtn,
                                    (!hasConfig || configLoading) && {
                                      backgroundColor: '#ccc',
                                    },
                                  ]} 
                                  onPress={async () => {
                                    if (configLoading) return;
                                    if (!hasConfig) {
                                      Alert.alert(
                                        t('monitoring.config_required'),
                                        t('monitoring.config_required_msg'),
                                      );
                                      return;
                                    }
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
                                  <Text style={btnTextStyle}>Start</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                          <View style={styles.paramCarousel}>
                            <TouchableOpacity
                              style={styles.arrowButton}
                              onPress={() =>
                                handlePrevParams(
                                  device.deviceCode,
                                  currentIndex,
                                )
                              }
                            >
                              <Text style={styles.arrowText}>◀</Text>
                            </TouchableOpacity>
                            <View style={styles.visibleParamsContainer}>
                              {configLoading ? (
                                <View
                                  style={{
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flex: 1,
                                  }}
                                >
                                  <ActivityIndicator
                                    size="small"
                                    color="#4CAF50"
                                  />
                                </View>
                              ) : params.length === 0 ? (
                                <View
                                  style={{
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: '#666',
                                      fontSize: scale(12),
                                    }}
                                  >
                                    No alarm configuration set
                                  </Text>
                                </View>
                              ) : (
                                visibleParams.map((param, pIndex) => {
                                  const { high, low } = param;

                                  return (
                                    <TouchableOpacity
                                      key={pIndex}
                                      style={styles.paramCard}
                                      onPress={() => {
                                        navigation.navigate(
                                          'UpdateAlarmConfig',
                                          {
                                            deviceCode: device.deviceCode,
                                            deviceType: device.deviceType,
                                            paramName: param.paramName,
                                            patientConfig:
                                              patientConfigData[
                                                device.deviceCode
                                              ],
                                            patientId: patientId,
                                            callerScreen: 'CalloutModal',
                                          },
                                        );
                                      }}
                                    >
                                      <Text style={paramNameStyle}>
                                        {param.paramName}:
                                      </Text>
                                      <View style={styles.thresholdBox}>
                                        <Text style={thresholdLabelStyle}>
                                          H{' '}
                                        </Text>
                                        <Text style={thresholdValueStyle}>
                                          {high}
                                        </Text>
                                        <Text style={thresholdLabelStyle}>
                                          {' '}
                                          L{' '}
                                        </Text>
                                        <Text style={thresholdValueStyle}>
                                          {low}
                                        </Text>
                                      </View>
                                    </TouchableOpacity>
                                  );
                                })
                              )}
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
          </View>
        </View>
      </View>
      <AlarmConfigModal
        visible={editThresholdModalVisible}
        onClose={() => setEditThresholdModalVisible(false)}
        onSave={handleThresholdSave}
        paramThresholds={editThresholds}
      />
      {/* <UpdateAlarmConfig
        visible={updateModalVisible}
        onClose={() => setUpdateModalVisible(false)}
        onUpdate={handleAlarmConfigUpdate}
        data={selectedParam}
      /> */}
    </>
  );
};

export default PatientDetails;

const styles = StyleSheet.create({
  parent: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 1 },
  left: { flex: 0.5, justifyContent: 'flex-start', alignItems: 'flex-start' },
  right: { flex: 0.5, justifyContent: 'flex-start', alignItems: 'flex-end' },
  reasonforadmission: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  sectionHeader: {
    fontSize: fontScale(14),
    fontWeight: '500',
    marginBottom: 3,
  },
  sectionHeaderInfo: {
    flex: 1, // allow expansion
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  sectionHeaderInfoText: {
    fontSize: fontScale(13),
    fontWeight: '400',
    flexWrap: 'wrap',
  },
  staffName: { fontSize: fontScale(13), marginVertical: 2 },
  switchButton: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }], // slightly bigger, but keeps thumb inside
    marginVertical: 5,
    marginHorizontal: 10,
  },
  deviceView: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  deviceContainer: {
    width: '98%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(2),
    padding: scale(4),
    marginVertical: verticalScale(5),
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
    marginHorizontal: scale(2),
  },
  deviceHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceTitle: {
    fontSize: RFValue(12, 812),
    fontWeight: '600',
    marginBottom: verticalScale(5),
    marginLeft: scale(4),
    textAlign: 'left',
  },
  paramContainer: {
    flex: 1,
    alignItems: 'center',
  },
  paramLabel: {
    fontSize: fontScale(12),
    fontWeight: 'bold',
    marginBottom: 2,
  },
  thresholdText: {
    fontSize: fontScale(12),
  },
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
  startButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: fontScale(12),
  },
  stopButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: scale(3),
  },
  stopButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: fontScale(12),
  },
  addButton: {
    backgroundColor: '#c8e7ca',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginVertical: 1,
  },
  addButtonText: {
    // color: '#fff',
    fontWeight: '500',
    fontSize: fontScale(10),
  },

  vitalContainer: {
    width: 'auto',
    minWidth: '50%',
    marginTop: verticalScale(2),
    marginBottom: verticalScale(6),
    paddingHorizontal: scale(4),
    paddingVertical: verticalScale(6),
    borderRadius: scale(5),
    backgroundColor: '#c9e7cb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    alignSelf: 'center',
    flexShrink: 1,
    gap: scale(18),
  },

  deviceParent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flex: 1,
    marginTop: 0,
  },
  newDeviceParent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 1,
  },
  deviceLeft: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flex: 1,
  },
  deviceRight: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flex: 1,
    paddingLeft: scale(6),
  },

  medicalHistorySection: {
    flexDirection: 'column',
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 5,
    padding: 8,
    width: '100%',
    flex: 1,
  },
  historyRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  historyLabel: {
    fontWeight: '600',
    fontSize: fontScale(12),
    color: '#4cae51',
    width: '40%', // Fixed width for labels
    paddingRight: 3, // Add some spacing between label and value
  },
  historyValue: {
    fontSize: fontScale(12),
    width: '60%', // Fixed width for values
    flexWrap: 'wrap',
  },
  sectionSubHeader: {
    fontSize: fontScale(13),
    fontWeight: '600',
    marginBottom: 0,
    color: '#333',
  },
  deviceListWrapper: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 5,
    padding: scale(2),
    marginVertical: 3,
    height: verticalScale(10),
  },
  scrollArea: { flex: 1 },
  scrollBarTrack: {
    width: scale(5),
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginLeft: 6,
  },
  scrollBarThumb: {
    width: scale(4),
    backgroundColor: '#4CAE51',
    borderRadius: 3,
  },

  deviceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
    // borderWidth: 1,
    // borderColor: '#a3a3a3ff',
    // borderRadius: 6,
    // padding: 8,
    flex: 1,
    alignSelf: 'center',
  },
  vitals: {
    fontSize: RFValue(13, 900),
    fontWeight: '500',
    color: '#000000',
  },

  paramCarousel: {
    width: '100%',
    height: verticalScale(35),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(6),
  },

  arrowButton: {
    // paddingHorizontal: scale(4),
    // paddingVertical: verticalScale(2),
  },

  arrowText: {
    fontSize: RFValue(16, 812),
    fontWeight: 'bold',
    color: '#000',
    paddingRight: scale(1),
  },

  arrowTextRight: {
    fontSize: RFValue(16, 812),
    fontWeight: 'bold',
    color: '#000',
    paddingLeft: scale(1),
  },

  editView: {
    width: scale(18),
    height: verticalScale(18),
    backgroundColor: '#4CAF50',
    borderRadius: scale(1),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scale(0),
  },
  edit: {
    width: scale(15),
    height: verticalScale(10),
    paddingHorizontal: scale(2),
    paddingVertical: verticalScale(2),
  },

  visibleParamsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
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
    overflow: 'hidden', // ← clips content if it somehow exceeds
    minWidth: 0,
  },

  paramName: {
    fontWeight: '600',
    fontSize: RFValue(8, 812),
    color: '#000000',
    marginBottom: verticalScale(3),
    marginRight: scale(2),
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

  thresholdLabel: {
    fontSize: RFValue(8, 812),
    color: '#444',
    fontWeight: '500',
    lineHeight: verticalScale(16),
    letterSpacing: scale(0.25),
  },

  thresholdValue: {
    fontSize: RFValue(8, 812),
    color: '#000',
    fontWeight: '600',
    lineHeight: verticalScale(16),
    letterSpacing: scale(0.25),
  },
  paramUnit: {
    fontSize: fontScale(10),
    color: '#666',
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  deviceText: {
    fontSize: fontScale(12),
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: verticalScale(2),
  },

  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },

  startBtn: {
    backgroundColor: '#4CAF50', // green
  },

  stopBtn: {
    backgroundColor: '#f44336', // red
  },

  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: RFValue(12, 812),
  },
});
