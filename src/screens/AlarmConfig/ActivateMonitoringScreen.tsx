import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { scale, verticalScale } from 'react-native-size-matters';
import { useResponsive } from '../../utils/responsive';
import { checkMonitoring, patientConfig, startMonitoring, stopMonitoring } from '../../services/deviceService';
import Toast from 'react-native-toast-message';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import EditAlarm from '../../../assets/SVGIcons/EditAlarm';
import LeftArrow from '../../../assets/SVGIcons/LeftArrow';
import RightArrow from '../../../assets/SVGIcons/RightArrow';
import WarningIcon from '../../../assets/SVGIcons/WarningIcon';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Path, Svg } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');
type RouteProps = RouteProp<RootStackParamList, 'ActivateMonitoring'>;
type ActivateMonitoringScreenProps = {
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
const ActivateMonitoringScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProps>();
  const { patientInfo, assignedDevices } = route.params;
  const { isTablet, wp, hp } = useResponsive();

  // Card dimensions
  const cardWidth = isTablet ? wp(75) : scale(630);
  const cardHeight = isTablet ? hp(66) : verticalScale(250);
  const [scrollHeight, setScrollHeight] = useState(1);
  const [contentHeight, setContentHeight] = useState(1);
  const [patientConfigData, setPatientConfigData] = useState<{
    [deviceCode: string]: Record<string, string>;
  }>({});
  const [deviceMonitoringStatus, setDeviceMonitoringStatus] = useState<{
    [key: string]: boolean;
  }>({});
  const isAnyDeviceStarted = useMemo(
    () => Object.values(deviceMonitoringStatus).some(v => v),
    [deviceMonitoringStatus],
  );
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
  type ParamThreshold = {
    paramName: string;
    low: number | null;
    high: number | null;
  };
  const scrollY = useRef(new Animated.Value(0)).current;
  const indicatorSize = (scrollHeight / contentHeight) * scrollHeight;
  const scrollableContentHeight = contentHeight - scrollHeight;
  const thumbScrollRange = scrollHeight - indicatorSize;
  const translateY = scrollY.interpolate({
    inputRange: [0, scrollableContentHeight > 0 ? scrollableContentHeight : 1],
    outputRange: [0, thumbScrollRange > 0 ? thumbScrollRange : 0],
    extrapolate: 'clamp',
  });
  const [pollingPaused, setPollingPaused] = useState(false);
  const pollingPauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pausePolling = (duration = 8000) => {
    if (pollingPauseTimer.current) {
      clearTimeout(pollingPauseTimer.current); // clear any existing timer
    }
    setPollingPaused(true);
    pollingPauseTimer.current = setTimeout(() => {
      setPollingPaused(false);
      pollingPauseTimer.current = null;
    }, duration);
  };

  // Add cleanup in a useEffect:
  useEffect(() => {
    return () => {
      if (pollingPauseTimer.current) {
        clearTimeout(pollingPauseTimer.current);
      }
    };
  }, []);

  const handleThresholdSave = (updated: ParamThreshold[]) => {
    console.log('Updated thresholds:', updated);
    // Optionally: Make an API call to save these updated values.
  };
  const titleStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(24, 812) : RFValue(16, 812),
      fontWeight: '600' as const,
      color: '#111',
      marginHorizontal: scale(2),
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

  const fixedDeviceStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(14, 812) : RFValue(14, 812),
      fontWeight: '600',
      marginBottom: verticalScale(5),
      // marginLeft: scale(4),
      textAlign: 'left',
      marginHorizontal: scale(2),
    }),
    [isTablet],
  );

  const thresholdLabelStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(14, 812) : RFValue(12, 812),
      color: '#444',
      fontWeight: '500',
      // lineHeight: verticalScale(16),
      letterSpacing: scale(0.25),
    }),
    [isTablet],
  );

  const thresholdValueStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(14, 812) : RFValue(12, 812),
      color: '#000',
      fontWeight: '600',
      // lineHeight: verticalScale(16),
      letterSpacing: scale(0.25),
    }),
    [isTablet],
  );

  const paramNameStyle = useMemo(
    () => ({
      fontWeight: '600',
      fontSize: isTablet ? RFValue(14, 812) : RFValue(12, 812),
      color: '#000000',
      // marginBottom: verticalScale(2),
      // marginRight: scale(2),
      // lineHeight: verticalScale(16),
      letterSpacing: scale(0.25),
      marginRight: scale(6),
    }),
    [isTablet],
  );

  const startButtonTextStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(16, 812) : RFValue(10, 812),
      fontWeight: '600' as const,
    }),
    [isTablet],
  );

  const bottomButtonTextStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(18, 812) : RFValue(14, 812),
      fontWeight: '600' as const,
    }),
    [isTablet],
  );

  const borderContainerStyle = useMemo(
    () => ({
      marginTop: isTablet ? verticalScale(6) : verticalScale(8),
    }),
    [isTablet],
  );

  const bottomButtonStyle = useMemo(
    () => ({
      width: '100%',
      paddingVertical: isTablet ? verticalScale(6) : verticalScale(10),
      borderRadius: scale(3),
      alignItems: 'center',
    }),
    [isTablet],
  );
  useFocusEffect(
    React.useCallback(() => {
      const getPatientConfig = async () => {
        try {
          const results = await Promise.allSettled(
            assignedDevices.map(device =>
              patientConfig(patientInfo?.patientId!, device.deviceType),
            ),
          );

          const newConfigData: {
            [deviceCode: string]: Record<string, string>;
          } = {};

          results.forEach((result, index) => {
            const device = assignedDevices[index];
            if (result.status === 'fulfilled') {
              newConfigData[device.deviceCode] = result.value;
            } else {
              console.log(
                `Failed for device ${device.deviceCode}`,
                result.reason,
              );
            }
          });

          setPatientConfigData(newConfigData);
        } catch (error: any) {
          console.log('Error fetching patient config:', error);
          Toast.show({
            text1: t('common.error'),
            text2: t('monitoring.fetch_config_failed'),
            type: 'error',
          });
        }
      };

      if (assignedDevices.length > 0 && patientInfo?.patientId) {
        getPatientConfig();
      }
    }, [assignedDevices, patientInfo]),
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
    // 1. Update UI immediately
    setDeviceMonitoringStatus(prev => ({
      ...prev,
      [deviceCode]: true,
    }));

    pausePolling();

    try {
      await startMonitoring({ deviceCode });
      Toast.show({
        type: 'success',
        text1: t('monitoring.started'),
        text2: t('monitoring.started_msg', {deviceCode}),
      });
    } catch (error) {
      // 2. Rollback if failed
      setDeviceMonitoringStatus(prev => ({
        ...prev,
        [deviceCode]: false,
      }));

      Toast.show({
        text1: t('monitoring.start_failed'),
        type: 'error',
      });
    }
  };

  const handleStopMonitoring = async (deviceCode: string) => {
    // 1. Optimistically update UI (STOP immediately)
    setDeviceMonitoringStatus(prev => ({
      ...prev,
      [deviceCode]: false,
    }));

    pausePolling();

    try {
      await stopMonitoring({ deviceCode });
      Toast.show({
        type: 'success',
        text1: t('monitoring.stopped'),
        text2: t('monitoring.stopped_msg', {deviceCode}),
      });
    } catch (error) {
      // 2. Rollback if API fails (restore previous state)
      setDeviceMonitoringStatus(prev => ({
        ...prev,
        [deviceCode]: true,
      }));

      Toast.show({
        text1: t('monitoring.stop_failed'),
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

  const parsedParams = useMemo(() => {
    const result: any = {};
    Object.keys(patientConfigData).forEach(deviceCode => {
      result[deviceCode] = parseParamsFromConfig(deviceCode);
    });
    return result;
  }, [patientConfigData]);

  useEffect(() => {
    const result = route.params?.updatedAlarmConfig;
    if (!result) return;
    const { deviceCode, updatedConfig } = result;
    setPatientConfigData(prev => ({ ...prev, [deviceCode]: updatedConfig }));
    navigation.setParams({ updatedAlarmConfig: undefined } as any);
  }, [route.params?.updatedAlarmConfig]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.overlay}>
        {/* Backdrop (optional for future close handling) */}
        <View style={StyleSheet.absoluteFillObject} />

        {/* Card */}
        <View
          style={[
            styles.card,
            {
              width: cardWidth,
              height: cardHeight,
            },
          ]}
        >
          <Text style={[styles.title, titleStyle]}>Activate Monitoring</Text>

          <View style={{ flex: 1 }}>
            <Text style={fixedDeviceStyle}>Fixed Device</Text>
            <View style={{ flex: 1 }}>
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
                      const params = parsedParams[device.deviceCode] || [];
                      const hasConfig = params.length > 0;
                      const currentIndex =
                        currentParamIndices[device.deviceCode] || 0;
                      const visibleParams = params.slice(
                        currentIndex,
                        currentIndex + 3,
                      );
                      const paramsLength = params.length;
                      return (
                        <View key={index} style={styles.deviceContainer}>
                          <View style={styles.deviceRow}>
                            <View style={styles.leftSection}>
                              <Text style={deviceTitleStyle}>
                                {device.deviceName || device.deviceCode}
                              </Text>

                              <View style={styles.paramContainer}>
                                <TouchableOpacity
                                  onPress={() =>
                                    handlePrevParams(
                                      device.deviceCode,
                                      currentIndex,
                                    )
                                  }
                                  style={styles.editAlarmButton}
                                >
                                  <LeftArrow
                                    width={scale(isTablet ? 10 : 16)}
                                    height={scale(isTablet ? 10 : 16)}
                                    fill="#000000"
                                  />
                                </TouchableOpacity>

                                {/* Chips — shrink/grow with content, NO flex:1 */}
                                <View style={styles.visibleParamsContainer}>
                                  {!hasConfig ? (
                                    <Text
                                      style={{
                                        color: '#d32f2f',
                                        fontSize: scale(12),
                                        textAlign: 'center',
                                      }}
                                    >
                                      No alarm configuration set
                                    </Text>
                                  ) : (
                                    visibleParams.map((param, pIndex) => (
                                      <View
                                        key={pIndex}
                                        style={styles.paramChip}
                                      >
                                        <Text style={paramNameStyle}>
                                          {param.paramName}
                                        </Text>
                                        <Text style={thresholdLabelStyle}>
                                          {' '}
                                          H{' '}
                                        </Text>
                                        <Text style={thresholdValueStyle}>
                                          {param.high}
                                        </Text>
                                        <Text style={thresholdLabelStyle}>
                                          {' '}
                                          L{' '}
                                        </Text>
                                        <Text style={thresholdValueStyle}>
                                          {param.low}
                                        </Text>
                                      </View>
                                    ))
                                  )}
                                </View>
                                <TouchableOpacity
                                  onPress={() =>
                                    handleNextParams(
                                      device.deviceCode,
                                      currentIndex,
                                      paramsLength,
                                    )
                                  }
                                  style={styles.editAlarmButton}
                                >
                                  <RightArrow
                                    width={scale(isTablet ? 10 : 16)}
                                    height={scale(isTablet ? 10 : 16)}
                                    fill="#000000"
                                  />
                                </TouchableOpacity>
                                {hasConfig && (
                                  <TouchableOpacity
                                    onPress={() => {
                                      const params = parseParamsFromConfig(
                                        device.deviceCode,
                                      );

                                      navigation.navigate('UpdateAlarmConfig', {
                                        deviceCode: device.deviceCode,
                                        deviceType: device.deviceType,
                                        paramName:
                                          params[currentIndex]?.paramName ?? '',
                                        patientConfig:
                                          patientConfigData[device.deviceCode],
                                        patientId: patientInfo?.patientId ?? '',
                                        callerScreen: 'ActivateMonitoring',
                                      });
                                    }}
                                    style={styles.editAlarmButton}
                                  >
                                    <EditAlarm
                                      width={scale(isTablet ? 12 : 14)}
                                      height={scale(isTablet ? 12 : 14)}
                                      fill="#4CAF50"
                                    />
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                            <View style={styles.rightSection}>
                              {/* START/STOP button — fixed width on the right */}
                              <TouchableOpacity
                                style={[
                                  styles.startButton,
                                  isMonitoring && styles.startedButton,
                                  !hasConfig && { backgroundColor: '#ccc' }, // disabled look
                                ]}
                                // disabled={!hasConfig && !isMonitoring}
                                onPress={() => {
                                  if (!hasConfig && !isMonitoring) {
                                    Toast.show({
                                      type: 'error',
                                      text1: t('monitoring.config_required'),
                                      text2: t('monitoring.config_required_msg'),
                                    });
                                    return;
                                  }

                                  isMonitoring
                                    ? handleStopMonitoring(device.deviceCode)
                                    : handleStartMonitoring(device.deviceCode);
                                }}
                              >
                                <Text
                                  style={[
                                    startButtonTextStyle,
                                    { color: '#fff' },
                                  ]}
                                >
                                  {isMonitoring ? 'STOP' : 'START'}
                                </Text>
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
          <View style={borderContainerStyle}>
            {!isAnyDeviceStarted && (
              <View style={styles.warningRow}>
                <WarningIcon
                  width={scale(isTablet ? 10 : 14)}
                  height={scale(isTablet ? 10 : 14)}
                />
                <Text style={styles.bottomText}>
                  Monitoring will remain inactive until setup is completed.
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[
                bottomButtonStyle,
                isAnyDeviceStarted ? styles.continueButton : styles.skipButton,
              ]}
              onPress={() => {
                navigation.replace('Dashboard');
              }}
            >
              <Text
                style={[
                  bottomButtonTextStyle,
                  { color: isAnyDeviceStarted ? '#fff' : '#000' },
                ]}
              >
                {isAnyDeviceStarted ? 'Continue' : 'Skip for Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ActivateMonitoringScreen;

const styles = StyleSheet.create({
  // Dim background like modal
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(2),
    paddingVertical: scale(8),
    paddingHorizontal: scale(10),
    // shadow (same feel as modal)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },

  title: {
    marginBottom: verticalScale(10),
  },

  deviceListWrapper: {
    flex: 1,
    flexDirection: 'row',
    // width: '100%',
    // borderWidth: scale(1),
    // borderColor: '#000000',
    // borderRadius: scale(3),
    // padding: scale(8),
    // marginVertical: verticalScale(3),
  },
  scrollArea: {
    flex: 1,
  },
  scrollBarTrack: {
    width: scale(4),
    backgroundColor: '#e0e0e0',
    borderRadius: scale(3),
    marginLeft: scale(6),
    alignSelf: 'stretch',
  },
  scrollBarThumb: {
    width: scale(4),
    backgroundColor: '#4CAE51',
    borderRadius: scale(3),
  },
  deviceView: {
    flexDirection: 'column',
    alignItems: 'stretch', //
    width: '100%',
  },

  deviceContainer: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(4),
    padding: scale(8),
    marginVertical: verticalScale(4),
    marginHorizontal: scale(2),

    borderWidth: 1,
    borderColor: '#EAEAEA',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,

    elevation: 3,
  },
  deviceTitle: {
    fontSize: RFValue(13, 812),
    fontWeight: '600',
    marginBottom: verticalScale(5),
    marginLeft: scale(4),
    textAlign: 'left',
  },
  paramContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%', // works now because deviceContainer is column
  },

  paramLeft: {
    flex: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: scale(4),
    overflow: 'hidden',
  },

  // NEW: Right 35% zone — button
  paramRight: {
    flex: 35,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: scale(60),
  },
  rightSection: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(10),
  },

  arrowText: {
    fontSize: RFValue(14, 812),
    fontWeight: 'bold',
    color: '#555',
    paddingHorizontal: scale(4),
  },

  arrowTextRight: {
    fontSize: RFValue(14, 812),
    fontWeight: 'bold',
    color: '#555',
    paddingHorizontal: scale(4),
  },

  visibleParamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    flexShrink: 1,
  },
  paramChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: scale(2),
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(6),
  },

  spacer: {
    flex: 1,
  },

  editAlarmButton: {
    marginHorizontal: scale(6),
    justifyContent: 'center',
    alignItems: 'center',
  },

  thresholdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(2),
    lineHeight: verticalScale(16),
    letterSpacing: scale(0.25),
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center', // 🔥 centers button vertically
  },

  leftSection: {
    flex: 1, // takes remaining space
  },

  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(6),
    borderRadius: scale(3),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: scale(60),
  },

  startedButton: {
    backgroundColor: '#fc2020',
    borderWidth: 1,
    borderColor: '#fcfcfc',
  },

  startButtonText: {
    color: '#fff',
    fontSize: RFValue(10, 812),
    fontWeight: '600',
  },

  bottomContainer: {
    marginTop: verticalScale(8),
  },
  bottomText: {
    color: '#5B5B5B',
    fontSize: RFValue(10, 812),
  },

  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    marginBottom: verticalScale(4),
    paddingHorizontal: scale(2),
  },

  bottomButton: {
    width: '100%',
    paddingVertical: verticalScale(6),
    borderRadius: scale(3),
    alignItems: 'center',
  },

  skipButton: {
    backgroundColor: '#C8E6C9',
  },

  continueButton: {
    backgroundColor: '#4CAF50',
  },

  bottomButtonText: {
    fontWeight: '600',
    fontSize: RFValue(12, 812),
    color: '#000',
  },
});
