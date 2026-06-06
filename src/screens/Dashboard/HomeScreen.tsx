import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Pressable,
} from 'react-native';
import Toast from 'react-native-toast-message';
import DynamicSvg from '../../components/DynamicSvg';
import { getBedPatientInfo, getWardSVG, getCurrentShift } from '../../services/nurseService';
import { assignedDevices } from '../../services/bedService';
import { getGlobalRaisedAlarm } from '../../services/alarmService';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header } from '../../components/Header';
import { Notification } from '../Notifications/Notification';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { GlobalNotifications } from '../Notifications/GlobalNotifications';
import { LogBox } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, verticalScale } from '../../utils/scaling';
import WardTransferAndDischarge from '../../components/CallOutModal/WardTransferAndDischarge';
import { NetworkContext } from '../../context/NetworkProvider';
import AdmitPatientModalNew from '../../components/CallOutModal/AdmitPatientModalNew';
import Logout from '../Auth/Logout/Logout';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useWardDashboard } from '../../utils/Usewarddashboard';

const zoomIcon = require('../../../assets/icons/zoom.png');

LogBox.ignoreLogs(['Encountered two children with the same key']);
LogBox.ignoreLogs(['Each child in a list should have a unique "key" prop.']);
LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component.']);

const HomeScreen = () => {
  const isConnected = useContext(NetworkContext).isConnected;

  const [currentColor, setCurrentColor] = useState('#ffffff');
  const [svgXml, setSvgXml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationWidth, setNotificationWidth] = useState(0);
  const notificationRef = useRef<any>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'assignDevices' | 'callout' | 'wardTransfer' | null
  >(null);
  const [bedPatientInfo, setBedPatientInfo] = useState<any>(null);
  const zoomRef = useRef<any>(null); // ref for ZoomableView
  const [isZoomedIn, setIsZoomedIn] = useState(false); // toggle state
  const dynamicSvgRef = useRef<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [assignedDevicesList, setAssignedDevicesList] = useState<any[]>([]);
  const [showLogout, setShowLogout] = useState(false);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const screenWidth = Dimensions.get('window').width;
  const globalNotificationsWidth = screenWidth * 0.085;

  const {
    data: dashboardData,
    error: dashboardError,
    reconnect,
  } = useWardDashboard({ enabled: !!isConnected && sessionReady });

  const assignedBedCodes =
    dashboardData?.monitoringBeds.map(b => b.bedCode) ?? [];
  const admitPatientBed =
    dashboardData?.inpatientBeds.map(b => b.bedCode) ?? [];
  const dischargeBeds = dashboardData?.dischargeBeds.map(b => b.bedCode) ?? [];
  const emptyBeds = dashboardData?.emptyBeds.map(b => b.bedCode) ?? [];
  const wardTransferBeds =
    dashboardData?.transferBeds
      .filter(b => b.bedStatus === 'ADMITTED')
      .map(b => b.bedCode) ?? [];
  const targetForWardTransferBeds =
    dashboardData?.transferBeds
      .filter(b => b.bedStatus === 'ASSIGNED')
      .map(b => b.bedCode) ?? [];

  const openModal = async (bedCode: string) => {
    try {
      // Fetch both in parallel but wait before opening modal
      const [bedPatientResponse, assignedDevicesResponse] = await Promise.all([
        getBedPatientInfo(bedCode),
        assignedDevices(bedCode),
      ]);

      if (!bedPatientResponse || !bedPatientResponse.bedCode) {
        Toast.show({
          type: 'error',
          text1: 'Patient Details Not Available',
          text2: 'Patient details could not be loaded. Please try again.',
        });
        return; // Stop here – don’t open modal
      }

      // Update data only if we have valid response
      setBedPatientInfo(bedPatientResponse);
      setAssignedDevicesList(assignedDevicesResponse || []);

      // Now decide which modal to open
      if (admitPatientBed.includes(bedCode)) {
        setActiveModal('assignDevices');
      } else if (
        wardTransferBeds.includes(bedCode) ||
        dischargeBeds.includes(bedCode)
      ) {
        setActiveModal('wardTransfer');
      } else {
        navigation.navigate('CalloutModal', {
          bedPatientInfo: bedPatientResponse,
          assignedDevices: assignedDevicesResponse || [],
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'This bed is empty.',
        text2: 'No patient is assigned to this bed.',
      });
    }
  };

  const handleZoomToggle = () => {
    if (isZoomedIn) {
      zoomRef.current?.zoomTo(1, { x: 0, y: 0 }, 300);
      setIsZoomedIn(false);
    } else {
      zoomToAssignedBeds();
    }
  };

  const zoomToAssignedBeds = () => {
    if (!dynamicSvgRef.current || !zoomRef.current) return;

    const positions = dynamicSvgRef.current.getElementPositions?.();
    if (!positions) return;

    const selectedBeds = assignedBedCodes
      .map(id => positions[id])
      .filter(Boolean);
    if (selectedBeds.length === 0) return;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    selectedBeds.forEach(({ x, y, width, height }) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height + 150);
    });

    const padding = 20;
    const paddedMinX = minX - padding;
    const paddedMinY = minY - padding;
    const paddedMaxX = maxX + padding;
    const paddedMaxY = maxY + padding;

    const paddedWidth = paddedMaxX - paddedMinX;
    const paddedHeight = paddedMaxY - paddedMinY;

    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height - 50;

    const maxZoom = 3;
    const zoomScale = Math.min(
      screenWidth / paddedWidth,
      screenHeight / paddedHeight,
      maxZoom,
    );

    const contentCenterX = paddedMinX + paddedWidth / 2;
    const contentCenterY = paddedMinY + paddedHeight / 2;

    const screenCenterX = screenWidth / 2;
    const screenCenterY = screenHeight / 2;

    const offsetX = screenCenterX - contentCenterX * zoomScale;
    const offsetY = screenCenterY - contentCenterY * zoomScale;

    zoomRef.current.zoomTo(zoomScale, { x: offsetX, y: offsetY }, 300);
    setIsZoomedIn(true);
  };

  const loadData = async () => {
    setLoading(true);

    try {
      // Validate shift FIRST
      const response = await getCurrentShift();
      console.log('Current Shift Response:', response);

      // Load SVG
      const svgRes = await getWardSVG();

      setSessionReady(true);

      if (!svgRes?.svgFile) {
        Toast.show({
          type: 'error',
          text1: 'SVG Not Found',
          text2: 'Please add SVG for the respective ward.',
        });
        setSvgXml(null);
        return;
      }

      setSvgXml(svgRes.svgFile);
    } catch (e: any) {
      // Shift error
      console.log('Error in loadData:', e);
      if (e?.response?.data?.message === 'No shift created for this time') {
        Toast.show({
          type: 'error',
          text1: 'No Active Shift',
          text2: 'Nurse is not assigned to any shift.',
        });
        setSvgXml(null);
      }
      // SVG or network error
      else {
        Toast.show({
          type: 'error',
          text1: 'SVG Not Found',
          text2: 'Please add SVG for the respective ward.',
        });
        setSvgXml(null);
      }
    } finally {
      setLoading(false); // always correct
    }
  };

  useEffect(() => {
    if (!isConnected) {
      console.log('Skipping SVG load — offline');
      return;
    }

    console.log('Network available — loading SVG');
    loadData();
  }, [isConnected]); // reruns once network is restored

  useEffect(() => {
    if (!isConnected || !sessionReady) {
      // Imperatively stop the alarm interval if session is no longer valid
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
      return;
    }

    const fetchAlarms = async () => {
      try {
        const data = await getGlobalRaisedAlarm();
        setAlerts(Array.isArray(data) ? data : []);
      } catch (err) {
        setAlerts([]);
      }
    };

    fetchAlarms();
    alarmIntervalRef.current = setInterval(fetchAlarms, 5000);

    return () => {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    };
  }, [isConnected, sessionReady]);

  useEffect(() => {
    if (!isConnected || !sessionReady) return;

    const checkShift = async () => {
      try {
        await getCurrentShift();
      } catch (err: any) {
        if (err?.response?.data?.message === 'No shift created for this time') {
          // Stop alarms immediately, don't wait for React re-render cycle
          if (alarmIntervalRef.current) {
            clearInterval(alarmIntervalRef.current);
            alarmIntervalRef.current = null;
          }
          setAlerts([]); // clear stale alerts from UI too
          setSvgXml(null);
          setSessionReady(false);
          Toast.show({
            type: 'info',
            text1: 'Shift Ended',
            text2: 'Your shift has ended.',
          });
        }
      }
    };

    const shiftIntervalId = setInterval(checkShift, 30_000);
    return () => clearInterval(shiftIntervalId);
  }, [isConnected, sessionReady]);


  return (
    <View style={styles.container}>
      {/* Header */}
      <Header onMenuPress={() => setShowLogout(prev => !prev)} />

      {/* Main Body */}
      <View style={styles.body}>
        <View>
          <GlobalNotifications
            width={globalNotificationsWidth}
            alerts={alerts}
            onNotificationClick={() => {
              notificationRef.current?.expandPanel();
            }}
          />
        </View>
        <View
          style={styles.leftPanel}
          onLayout={event => {
            const { width } = event.nativeEvent.layout;
            setNotificationWidth(width);
          }}
        >
          <Notification ref={notificationRef} sessionReady={sessionReady} />
        </View>

        <View
          style={[
            styles.zoomContainer,
            { left: globalNotificationsWidth + notificationWidth },
          ]}
        >
          <TouchableOpacity onPress={handleZoomToggle}>
            <Image source={zoomIcon} style={styles.zoomIconStyle} />
          </TouchableOpacity>
        </View>

        {/* Right Panel - SVG */}
        <View style={styles.rightPanel}>
          <ReactNativeZoomableView
            ref={zoomRef}
            zoomEnabled={true}
            maxZoom={3}
            minZoom={0.5}
            initialZoom={1}
            bindToBorders={true}
            doubleTapZoomToCenter={false}
            pinchToZoomInSensitivity={3}
            movementSensibility={3}
            contentWidth={Dimensions.get('window').width}
            contentHeight={Dimensions.get('window').height - 80}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : svgXml ? (
              <DynamicSvg
                // key={refreshKey}
                ref={dynamicSvgRef}
                svgXml={svgXml}
                width={Dimensions.get('window').width}
                height={Dimensions.get('window').height - 80}
                initialColor={currentColor}
                onElementSelected={(bedCode: string) => {
                  if (targetForWardTransferBeds.includes(bedCode)) {
                    Toast.show({
                      type: 'info',
                      text1: 'Patient Transfer In Progress',
                      text2: 'The patient is being transferred to this bed.',
                    });
                    return;
                  }
                  // Allow only if bed is in highlightedIds or admitPatientBed
                  const hasAccess =
                    assignedBedCodes.includes(bedCode) ||
                    admitPatientBed.includes(bedCode) ||
                    wardTransferBeds.includes(bedCode) ||
                    dischargeBeds.includes(bedCode);

                  if (!hasAccess) {
                    Toast.show({
                      type: 'error',
                      text1: 'Access Denied',
                      text2: 'You do not have access to this patient.',
                    });
                    return;
                  }
                  openModal(bedCode);
                }}
                highlightedIds={assignedBedCodes}
                emptybedsIds={emptyBeds}
                alerts={alerts}
                admitPatientBed={admitPatientBed}
                wardTransferBeds={wardTransferBeds}
                dischargeBeds={dischargeBeds}
                targetForWardTransferBeds={targetForWardTransferBeds}
              />
            ) : (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  loadData();
                  reconnect();
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            )}
          </ReactNativeZoomableView>
        </View>
      </View>
      {activeModal === 'assignDevices' && (
        <AdmitPatientModalNew
          visible={true}
          onClose={() => {
            setActiveModal(null);
            // loadData();
          }}
          patientInfo={bedPatientInfo}
          assignedDevices={assignedDevicesList}
        />
      )}
      {activeModal === 'wardTransfer' && (
        <WardTransferAndDischarge
          visible={true}
          onClose={() => {
            setActiveModal(null);
          }}
          patientInfo={bedPatientInfo}
          assignedDevices={assignedDevicesList}
        />
      )}

      {showLogout && (
        <>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowLogout(false)}
          />

          <View style={styles.logoutOverlay}>
            <Logout onClose={() => setShowLogout(false)} />
          </View>
        </>
      )}
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#EFF5F1',
    //backgroundColor: '#84aa91ff',
  },
  leftPanel: {
    width: 'auto',
    //width: scale(60),
  },
  rightPanel: {
    width: 'auto',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  zoomContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginHorizontal: 3,
    zIndex: 999,
    position: 'absolute',
    bottom: 0,
  },

  zoomIconWrapper: {
    padding: 5,
    zIndex: 30,
  },
  zoomIconStyle: {
    width: scale(40),
    height: verticalScale(40),
    resizeMode: 'contain',
    borderRadius: 5,
    padding: 5,
    elevation: 8,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: '#4cae51',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutOverlay: {
    position: 'absolute',
    top: verticalScale(55),
    left: scale(32),
    zIndex: 1000,
    elevation: 20,
  },
});
