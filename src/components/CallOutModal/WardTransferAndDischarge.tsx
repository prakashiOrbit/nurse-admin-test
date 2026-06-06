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
} from 'react-native';
import ConfirmWithoutMonitoringModal from './ConfirmWithoutMonitoringModal';
import { admitPatient } from '../../services/nurseService';
import { dischargePatient, wardTransferPatient } from '../../services/bedService';
import { startMonitoring, stopMonitoring, getAssignedDevicesAPI, checkMonitoring } from '../../services/deviceService';
import Toast from 'react-native-toast-message';
import { fontScale, scale, verticalScale } from '../../utils/scaling';
import { useResponsive } from '../../utils/responsive';
import { getSharedStyles } from '../../styles/sharedStyles';
import { RFValue } from 'react-native-responsive-fontsize';

type WardTransferAndDischargeProps = {
  visible: boolean;
  onClose: () => void;
  patientInfo?: {
    firstName: string;
    lastName: string;
    mrNumber: string;
    age: string;
    patientCode: string;
    bedCode: string;
    patientStatus?: string; // New field for patient status
  };
  assignedDevices?: any[];
};

const WardTransferAndDischarge: React.FC<WardTransferAndDischargeProps> = ({
  visible,
  onClose,
  patientInfo,
  assignedDevices = [],
}) => {
  const { isTablet, wp, hp } = useResponsive();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);

  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [patientStatus, setPatientStatus] = useState<string>('');
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

  const translateY = scrollY.interpolate({
    inputRange: [0, scrollableContentHeight > 0 ? scrollableContentHeight : 1],
    outputRange: [0, thumbScrollRange > 0 ? thumbScrollRange : 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (patientInfo?.patientStatus) {
      setPatientStatus(patientInfo?.patientStatus || 'null');
    }
  }, [patientInfo?.patientStatus]);

  useEffect(() => {
    if (!patientInfo?.bedCode || !patientInfo?.patientCode) return;

    const fetchMonitoringStatus = async () => {
      try {
        console.log(
          'The bedCode and patientCode: ',
          patientInfo.bedCode,
          patientInfo.patientCode,
        );
        const deviceCodes = await getAssignedDevicesAPI(patientInfo.bedCode);
        if (!deviceCodes || deviceCodes.length === 0) {
          setDeviceMonitoringStatus({});
          return;
        }

        const statusMap: { [key: string]: boolean } = {};

        for (const deviceCode of deviceCodes) {
          const response = await checkMonitoring(
            deviceCode,
            patientInfo.patientCode,
          );
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
  }, [patientInfo?.bedCode, patientInfo?.patientCode]);

  const handleStartMonitoring = async (deviceCode: string) => {
    const data = { deviceCode };
    try {
      const response = await startMonitoring(data);
      Toast.show({
        text1: 'Monitoring Started',
        // text2: JSON.stringify(response),
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
        // text2: JSON.stringify(error),
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
        text1: 'Monitoring Stopped',
        // text2: JSON.stringify(response),
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
        // text2: JSON.stringify(error),
        type: 'error',
      });
      Alert.alert(
        'Error',
        `Failed to stop monitoring for device ${deviceCode}.`,
      );
    }
  };

  const handleDischargePatient = async (
    bedCode: string,
    patientCode: string,
  ) => {
    try {
      const payload = {
        bedCode: bedCode,
        patientCode: patientCode,
      };
      const response = await dischargePatient(payload);
      // Alert.alert('Success', 'Patient Discharged Successfully');
      Toast.show({
        text1: 'Patient Discharged Successfully',
        // text2: JSON.stringify(response),
        type: 'success',
      });
      return response;
    } catch (error: any) {
      Toast.show({
        text1: 'Discharge Failed',
        // text2: JSON.stringify(error),
        type: 'error',
      });
      throw error;
    }
  };

  const handleWardTransferPatient = async (
    bedCode: string,
    patientCode: string,
  ) => {
    try {
      const payload = {
        bedCode: bedCode,
        patientCode: patientCode,
      };
      const response = await wardTransferPatient(payload);
      Toast.show({
        text1: 'Patient Transferred Successfully',
        // text2: JSON.stringify(response),
        type: 'success',
      });
      return response;
    } catch (error: any) {
      Toast.show({
        text1: 'Ward Transfer Failed',
        // text2: JSON.stringify(error),
        type: 'error',
      });
      throw error;
    }
  };

  const containerStyle = useMemo(
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
      fontSize: isTablet ? RFValue(14, 812) : RFValue(12, 812),
    }),
    [isTablet],
  );

  const valueStyle = useMemo(
    () => ({
      fontWeight: 'bold',
      color: '#000',
      flexShrink: 1,
      width: 'auto',
      fontSize: isTablet ? RFValue(14, 812) : RFValue(12, 812),
    }),
    [isTablet],
  );

  const colonStyle = useMemo(
    () => ({
      width: scale(10),
      textAlign: 'center',
      fontSize: isTablet ? RFValue(16, 812) : RFValue(14, 812),
    }),
    [isTablet],
  );

  const subTextStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(16, 812) : RFValue(14, 812),
      fontWeight: '600',
      marginBottom: scale(3),
      textAlign: 'left',
    }),
    [isTablet],
  );

  const deviceTextStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(14, 812) : RFValue(12, 812),
    }),
    [isTablet],
  );

  const monitoringButtonTextStyle = useMemo(
    () => ({
      color: '#fff',
      fontWeight: '600',
      fontSize: isTablet ? RFValue(14, 812) : RFValue(12, 812),
    }),
    [isTablet],
  );

  const cancelTextStyle = useMemo(
    () => ({
      fontWeight: '600',
      color: '#444',
      fontSize: isTablet ? RFValue(14, 812) : RFValue(12, 812),
    }),
    [isTablet],
  );

  const confirmTextStyle = useMemo(
    () => ({
    fontWeight: '600',
    color: '#fff',
    fontSize: isTablet ? RFValue(14, 812) : RFValue(12, 812),
    }),
    [isTablet],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View
          style={[styles.modalBox, { width: modalWidth, height: modalHeight }]}
        >
          <Text style={containerStyle}>
            {patientStatus === 'TRANSFER INITIATED'
              ? 'Ward Transfer'
              : patientStatus === 'DISCHARGE INITIATED'
              ? 'Discharge'
              : ''}
          </Text>
          {patientInfo != null ? (
            <>
              <View style={styles.parent}>
                <View style={styles.left}>
                  <View style={styles.patientInfo}>
                    <Text style={labelStyle}>Patient Name</Text>
                    <Text style={colonStyle}>:</Text>
                    <Text style={valueStyle}>
                      {patientInfo.firstName} {patientInfo.lastName}
                    </Text>
                  </View>

                  <View style={styles.patientInfo}>
                    <Text style={labelStyle}>Bed no</Text>
                    <Text style={colonStyle}>:</Text>
                    <Text style={valueStyle}>{patientInfo.bedCode}</Text>
                  </View>

                  <View style={styles.patientInfo}>
                    <Text style={labelStyle}>Age</Text>
                    <Text style={colonStyle}>:</Text>
                    <Text style={valueStyle}>{patientInfo.age} yrs</Text>
                  </View>
                </View>
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
                <View style={styles.deviceSection}>
                  <View style={styles.deviceColumn}>
                    <Text style={subTextStyle}>Stop Monitoring</Text>
                    {assignedDevices.map((device, index) => {
                      const isSelected = selectedDevices.includes(
                        device.deviceCode,
                      );

                      return (
                        <View key={index} style={styles.deviceRow}>
                          <Text style={deviceTextStyle}>
                            {device.deviceCode}
                          </Text>
                          <TouchableOpacity
                            style={[
                              styles.monitorButton,
                              deviceMonitoringStatus[device.deviceCode]
                                ? styles.stopButton
                                : styles.startButton,
                            ]}
                            onPress={async () => {
                              if (deviceMonitoringStatus[device.deviceCode]) {
                                await handleStopMonitoring(device.deviceCode);
                                setDeviceMonitoringStatus(prev => ({
                                  ...prev,
                                  [device.deviceCode]: false,
                                }));
                              } else {
                                await handleStartMonitoring(device.deviceCode);
                                setDeviceMonitoringStatus(prev => ({
                                  ...prev,
                                  [device.deviceCode]: true,
                                }));
                              }
                            }}
                          >
                            <Text style={monitoringButtonTextStyle}>
                              {deviceMonitoringStatus[device.deviceCode]
                                ? 'Stop'
                                : 'Start'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </View>
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
                const isAnyMonitoringActive = Object.values(
                  deviceMonitoringStatus,
                ).some(status => status === true);
                if (isAnyMonitoringActive) {
                  Alert.alert(
                    'Monitoring Active',
                    'Please stop monitoring for all devices before proceeding with Ward Transfer or Discharge.',
                  );
                  return; // stop further execution
                }
                if (patientStatus === 'TRANSFER INITIATED') {
                  handleWardTransferPatient(
                    patientInfo?.bedCode || '',
                    patientInfo?.patientCode || '',
                  );
                  onClose();
                } else if (patientStatus === 'DISCHARGE INITIATED') {
                  handleDischargePatient(
                    patientInfo?.bedCode || '',
                    patientInfo?.patientCode || '',
                  );
                  onClose();
                }
              }}
            >
              <Text style={confirmTextStyle}>
                {patientStatus === 'TRANSFER INITIATED'
                  ? 'Ward Transfer'
                  : patientStatus === 'DISCHARGE INITIATED'
                  ? 'Discharge'
                  : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: scale(6),
    padding: scale(10),
    elevation: scale(5),
  },
  deviceListWrapper: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    borderWidth: scale(1),
    borderColor: '#000000',
    borderRadius: scale(5),
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
  title: {
    fontSize: fontScale(18),
    fontWeight: 'bold',
    marginBottom: scale(12),
    textAlign: 'left',
  },
  patientInfo: {
    flexDirection: 'row',
    marginBottom: scale(2),
    alignItems: 'center',
  },
  label: {
    fontWeight: '400',
    width: scale(100),
    textAlign: 'left',
    fontSize: fontScale(12),
  },
  colon: {
    width: scale(10),
    textAlign: 'center',
  },
  value: {
    fontWeight: 'bold',
    color: '#000',
    flexShrink: 1,
    width: 'auto',
    fontSize: fontScale(12),
  },

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
  deviceSection: {
    // flexDirection: 'row',
    // justifyContent: 'space-between',
    marginVertical: verticalScale(2),
  },
  deviceColumn: {
    flex: 0.5,
    marginHorizontal: scale(2),
  },
  subTitle: {
    fontSize: fontScale(14),
    fontWeight: '600',
    marginBottom: scale(3),
    textAlign: 'left',
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(2),
  },
  deviceText: {
    fontSize: fontScale(12),
  },
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
  cancelText: {
    fontWeight: '600',
    color: '#444',
    fontSize: fontScale(12),
  },
  confirmBtn: {
    flex: 1,
    marginLeft: scale(8),
    paddingVertical: verticalScale(10),
    borderRadius: scale(3),
    backgroundColor: '#4cae51',
    alignItems: 'center',
  },
  confirmText: {
    fontWeight: '600',
    color: '#fff',
    fontSize: fontScale(12),
  },
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
  monitorButton: {
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(12),
    borderRadius: scale(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#4CAE51',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  monitorButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: fontScale(12),
  },
});

export default WardTransferAndDischarge;
