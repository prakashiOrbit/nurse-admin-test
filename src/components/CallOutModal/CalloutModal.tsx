import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Text,
  Pressable,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { getAssignedNursesAndDoctors } from '../../services/nurseService';
import { getMedicalHistory } from '../../services/bedService';
import { getRaisedAlarm } from '../../services/alarmService';
import PatientDetails from '../../screens/PatientsComponents/PatientDetails';
import PatientInstructions from '../../screens/PatientsComponents/PatientInstructions';
import WardTransfer from '../../screens/PatientsComponents/WardTransfer';
import MonitoringScreen from '../../features/monitoring/MonitoringScreen.tsx';
// import MonitoringScreen from '../../features-old/monitoring/MonitoringScreen.tsx';

import Monitor from '../../features/monitoring/Monitor.tsx';
// import { fontScale, scale, verticalScale } from '../../utils/scaling.ts';
import { formatDateWithOffset } from '../../utils/dataformatter.ts';
const MonitoringVector = require('../../../assets/icons/monitoring.png');
const InstructionsVector = require('../../../assets/icons/instruction.png');
const WardTransferVector = require('../../../assets/icons/move_out.png');

import { AlarmSummary } from '../../types/Types.ts';
import InstructionModal from './InstructionModal.tsx';
import CalloutHeader from '../CalloutHeader.tsx';
import { useResponsive } from '../../utils/responsive';
import { getSharedStyles } from '../../styles/sharedStyles.ts';
import { RFValue } from 'react-native-responsive-fontsize';
import { scale, verticalScale } from 'react-native-size-matters';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator.tsx';
type CalloutModalRouteProp = RouteProp<RootStackParamList, 'CalloutModal'>;

type CalloutModalProps = {
  visible: boolean;
  onClose: () => void;
  bedPatientInfo?: {
    bedCode: string;
    patientCode: string;
    patientId: string;
    firstName?: string;
    lastName?: string;
    age?: number;
    gender?: string;
    admissionDate?: string;
    mrNumber?: string;
    auditMe?: { createdtime?: string };
  };
  assignedDevices?: any[];
};

const CalloutModal: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CalloutModalRouteProp>();
  const onClose = () => navigation.goBack();

  const { bedPatientInfo, assignedDevices = [] } = route.params;
  const [selectedTab, setSelectedTab] = useState<
    'none' | 'instructions' | 'wardtransfer' | 'monitoring'
  >('none');
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [raisedAlarms, setRaisedAlarms] = useState<any[]>([]);
  const [monitoringProps, setMonitoringProps] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  // Data fetched via APIs
  const [nurses, setNurses] = useState<
    { code: string; firstName: string; lastName: string }[]
  >([]);
  const [doctors, setDoctors] = useState<
    { code: string; firstName: string; lastName: string }[]
  >([]);
  const [medicalHistory, setMedicalHistory] = useState<{
    bedCode: string;
    patientCode: string;
    wardCode: string;
    admissionReason: string;
    medicalHistory: string;
    allergies: string;
  } | null>(null);

  // Optional vitals (wire up to your own API if you have one)
  const [HR, setHR] = useState<number | null>(null);
  const [RR, setRR] = useState<number | null>(null);
  const [SpO2, setSpO2] = useState<number | null>(null);
  const [showDateTooltip, setShowDateTooltip] = useState(false);

  const { isTablet, wp, hp } = useResponsive();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);
  useEffect(() => {
  if (!bedPatientInfo?.bedCode) return;

  const bedCode = bedPatientInfo.bedCode;

  const fetchAssignedStaff = async () => {
    try {
      const response = await getAssignedNursesAndDoctors(bedCode);
      setNurses(response?.nurses || []);
      setDoctors(response?.doctors || []);
    } catch (error) {
      setNurses([]);
      setDoctors([]);
    }
  };

  const fetchMedicalHistory = async () => {
    try {
      const response = await getMedicalHistory(bedCode);
      setMedicalHistory(
        Array.isArray(response) ? response[0] || null : response || null,
      );
    } catch (error) {
      setMedicalHistory(null);
    }
  };

  fetchAssignedStaff();
  fetchMedicalHistory();
}, [bedPatientInfo?.bedCode]); 

  const formatAdmissionDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date); // e.g., "25 Sept 2025"
    } catch (err) {
      return dateString; // fallback to original if parsing fails
    }
  };

  const [monitoringVisible, setMonitoringVisible] = useState(false);

  const handleGoToMonitoring = () => {
    // setShowInstructions(false);
    setMonitoringProps({
      source: 'DEFAULT',
    });
    setMonitoringVisible(true);
  };

  useEffect(() => {
    if (selectedTab === 'monitoring') {
      handleGoToMonitoring();
    }
  }, [selectedTab]);

  const getParameterParts = (
    param?: string,
  ): { key: string; value: string } => {
    if (!param) return { key: '-', value: '-' };
    const [rawKey, rawValue] = param.split(':');
    return {
      key: rawKey?.trim() ?? '-',
      value: rawValue?.trim() ?? '-',
    };
  };

  const handleMonitoringClose = () => {
    setMonitoringVisible(false);
    setSelectedTab('none');
  };
  const { key: vitalName, value: vitalValue } = getParameterParts(
    raisedAlarms[0]?.violatedParameter,
  );

  // ActionButton text style, receives isTablet as parameter
  const getActionButtonTextStyle = (isTablet: boolean) => ({
    color: '#fff',
    fontWeight: '600',
    fontSize: isTablet ? RFValue(16, 812) : RFValue(14, 812),
  });

  const containerStyle = useMemo(
    () => ({
      // width: isTablet ? wp(90) : modalWidth,
      // height: isTablet ? hp(70) : modalHeight,
      width: isTablet ? wp(90) : scale(650),
      height: isTablet ? hp(70) : verticalScale(260),
    }),
    [isTablet],
  );
  return (
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.card, containerStyle]}>
          <CalloutHeader
            bedCode={bedPatientInfo?.bedCode || ''}
            selectedTab={selectedTab}
            setSelectedTab={setSelectedTab}
            onClose={onClose}
          />

          {/* <View style={[styles.charts, { width: '100%', height: '65%' }]}> */}
          <View style={styles.charts}>
            {/* Everything below is now the extracted component */}
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
            >
              {selectedTab === 'none' && (
                <PatientDetails
                  nurses={nurses}
                  doctors={doctors}
                  medicalHistory={medicalHistory}
                  assignedDevices={assignedDevices}
                  selectedDevices={selectedDevices}
                  setSelectedDevices={setSelectedDevices}
                  patientCode={bedPatientInfo?.patientCode || ''}
                  bedCode={bedPatientInfo?.bedCode || ''}
                  patientId={bedPatientInfo?.patientId || ''}
                  HR={HR}
                  RR={RR}
                  SpO2={SpO2}
                />
              )}

              {selectedTab === 'monitoring' && (
                // <Monitor
                //   visible={monitoringVisible}
                //   onClose={onClose}
                //   bedCode={bedPatientInfo?.bedCode || ''}
                //   patientCode={bedPatientInfo?.patientCode || ''}
                //   patientId={bedPatientInfo?.patientId || ''}
                //   raisedTime={monitoringProps?.raisedTime}
                //   violatedParam={vitalName}
                //   source={monitoringProps?.source || 'DEFAULT'}
                //   desc={monitoringProps?.desc}
                // />
                <MonitoringScreen
                  visible={monitoringVisible}
                  onClose={handleMonitoringClose}
                  bedCode={bedPatientInfo?.bedCode || ''}
                  patientCode={bedPatientInfo?.patientCode || ''}
                  patientId={bedPatientInfo?.patientId || ''}
                  raisedTime={monitoringProps?.raisedTime}
                  violatedParam={vitalName}
                  source={monitoringProps?.source || 'DEFAULT'}
                  desc={monitoringProps?.desc}
                  alarmValue={vitalValue}
                />
              )}
              {/* 
              {selectedTab === 'instructions' && (
                // <View>
                //   <View style={styles.instructionHeaderRow}>
                //     <Image
                //       source={InstructionsVector}
                //       style={styles.instructionIcon}
                //     />
                //     <Text style={styles.instructionsHeader}>Instructions</Text>
                //   </View>
                //   <PatientInstructions
                //     patientCode={bedPatientInfo?.patientCode || ''}
                //   />
                // </View>
                
              )} */}
            </ScrollView>
          </View>
          <InstructionModal
            visible={showInstructions}
            onClose={() => setShowInstructions(false)}
            patientCode={bedPatientInfo?.patientCode || ''}
          />
          {/* Footer Buttons */}
          <View style={styles.buttonRow}>
            <ActionButton
              label="Monitoring Screen"
              icon={MonitoringVector}
              onPress={() => setSelectedTab('monitoring')}
              isActive={selectedTab === 'monitoring'}
              actionButtonTextStyle={getActionButtonTextStyle(isTablet)}
            />
            <ActionButton
              label="Instructions"
              icon={InstructionsVector}
              onPress={() => setShowInstructions(true)}
              isActive={selectedTab === 'instructions'}
              actionButtonTextStyle={getActionButtonTextStyle(isTablet)}
            />
          </View>
        </View>
      </View>
  );
};

const ActionButton = ({
  label,
  icon,
  onPress,
  isActive,
  actionButtonTextStyle,
}: {
  label: string;
  icon: any;
  onPress: () => void;
  isActive: boolean;
  actionButtonTextStyle: any;
}) => (
  <TouchableOpacity
    style={[
      styles.actionButton,
      { backgroundColor: isActive ? '#4CAE51' : '#C8E6CB' },
    ]}
    onPress={onPress}
  >
    <Image
      source={icon}
      style={[styles.actionIcon, { tintColor: isActive ? '#fff' : '#1E4721' }]}
    />
    <Text
      style={[actionButtonTextStyle, { color: isActive ? '#fff' : '#1E4721' }]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export default CalloutModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: { ...StyleSheet.absoluteFillObject },
  card: {
    backgroundColor: '#fff',
    borderRadius: scale(6),
    padding: scale(12),
    elevation: 20,
    flexDirection: 'column',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  header: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    // flexWrap: 'wrap',
    gap: scale(6),
    flexShrink: 1,
    width: 'auto',
    // backgroundColor:'#987654',
    maxWidth: '70%',
  },
  scrollableHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    paddingRight: scale(8), // spacing before scrollbar end
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
    minWidth: scale(120),
    // backgroundColor:'#456789',
  },
  // bedCode: {
  //   fontSize: fontScale(24),
  //   fontWeight: 'bold',
  //   color: '#4caf50',
  //   marginRight: scale(2),
  //   alignSelf: 'center',
  // },
  // name: { fontSize: fontScale(15), fontWeight: '600', marginRight: scale(6) },
  // gender: { fontSize: fontScale(12), fontWeight: '400' },
  // admissionDate: {
  //   fontSize: fontScale(12),
  //   color: '#444',
  //   marginRight: scale(2),
  // },
  closeButton: {
    justifyContent: 'flex-end',
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    backgroundColor: '#eee',
    borderRadius: scale(16),
    shadowColor: '#000',
    //shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    //elevation: 3,
    // marginLeft: scale(12),
  },
  // closeText: { fontSize: fontScale(16), fontWeight: 'bold' },
  backArrow: {
    width: scale(20),
    height: verticalScale(20),
    marginRight: 6,
    tintColor: '#4caf50',
    resizeMode: 'contain',
  },
  buttonRow: {
    // flex: 1.5,
    flexDirection: 'row',
    // marginTop: 'auto',
    justifyContent: 'space-between',
    gap: 6,
    paddingBottom: verticalScale(4),
    minHeight: verticalScale(48),
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    paddingVertical: verticalScale(8),
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  actionIcon: {
    width: scale(20),
    height: verticalScale(20),
    marginRight: 8,
    resizeMode: 'contain',
  },
  // actionButtonText: {
  //   color: '#fff',
  //   fontWeight: '600',
  //   fontSize: fontScale(14),
  // },
  charts: {
    flex: 8, // 70% of modal height
    width: '100%',
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: '110%', // position above the date
    left: 0,
    backgroundColor: '#333',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: scale(6),
    maxWidth: scale(160),
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  // tooltipText: {
  //   color: '#fff',
  //   fontSize: fontScale(11),
  //   textAlign: 'center',
  // },
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
  // instructionsHeader: {
  //   fontSize: fontScale(15),
  //   fontWeight: '500',
  //   marginBottom: 4,
  //   color: '#4CAE51',
  // },
});
