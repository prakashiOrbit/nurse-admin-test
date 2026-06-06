import React, { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { scale, verticalScale } from 'react-native-size-matters';
import Toast from 'react-native-toast-message';
import { admitPatient } from '../../services/nurseService';
import { useResponsive } from '../../utils/responsive';
import { getSharedStyles } from '../../styles/sharedStyles';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

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
    gender: string;
    patientId?: string;
  };
  assignedDevices?: Array<{
    deviceCode: string;
    deviceId: string;
    deviceName?: string;
    deviceType: string;
  }>;
};

const AdmitPatientModalNew: React.FC<AdmitPatientModalProps> = ({
  visible,
  onClose,
  patientInfo,
  assignedDevices,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const { isTablet } = useResponsive();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);
  type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

  const navigation = useNavigation<NavigationProp>();
  // ── Responsive card width — matches Figma's 324px compact frame ──
  const cardWidth = useMemo(
    () => (isTablet ? Math.min(width * 0.45, 480) : Math.min(width - 60, 360)),
    [isTablet],
  );

  // ── Dynamic styles ──
  const titleStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(18, 812) : RFValue(16, 812),
      fontWeight: '700' as const,
      color: '#111111',
      flex: 1,
      marginRight: scale(8),
    }),
    [isTablet],
  );

  const labelStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(14, 812) : RFValue(12, 812),
      fontWeight: '400' as const,
      color: '#333333',
      flex: 1,
      paddingLeft: isTablet ? scale(30) : scale(60),
      textAlign: 'left' as const,
    }),
    [isTablet],
  );

  const valueStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(14, 812) : RFValue(12, 812),
      fontWeight: '700' as const,
      color: '#000000',
      flex: 1,
      textAlign: 'left' as const,
    }),
    [isTablet],
  );

  const colonStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(14, 812) : RFValue(12, 812),
      fontWeight: '400' as const,
      color: '#333333',
      width: scale(20), // ← fixed width
      textAlign: 'center' as const,
    }),
    [isTablet],
  );

  const confirmTextStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(18, 812) : RFValue(14, 812),
      fontWeight: '700' as const,
      color: '#111111',
    }),
    [isTablet],
  );

  const closeButtonStyle = useMemo(
    () => ({
      height: isTablet ? verticalScale(21) : verticalScale(24),
      width: isTablet ? scale(19) : scale(30),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      borderRadius: isTablet ? scale(25) : scale(20),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: isTablet ? 8 : 3,
    }),
    [isTablet],
  );

  const closeTextStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(15, 812) : RFValue(13, 812),
      fontWeight: 'bold',
    }),
    [isTablet],
  );

  const handleConfirmAdmission = async () => {
    if (!patientInfo || isConfirming) return;
    try {
      setIsConfirming(true);
      const data = {
        patientCode: patientInfo.patientCode,
        bedCode: patientInfo.bedCode,
      };
      await admitPatient(data);
      Toast.show({
        text1: 'Patient Admitted',
        text2: `${patientInfo.firstName} ${patientInfo.lastName} admitted successfully`,
        type: 'success',
      });
      onClose();
      navigation.navigate('ActivateMonitoring', {
        patientInfo: patientInfo!,
        assignedDevices: assignedDevices || [],
      });
    } catch (error) {
      console.error('Error admitting patient:', error);
      Toast.show({
        text1: 'Admit Failed',
        text2: JSON.stringify(error),
        type: 'error',
      });
      Alert.alert('Error', 'Failed to admit patient. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop tap to close */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={[styles.card, { width: cardWidth }]}>
          <View style={styles.header}>
            <Text style={titleStyle}>
              Admit New Patient to Bed{'  '}
              <Text style={[titleStyle, styles.bedCode]}>
                {patientInfo?.bedCode}
              </Text>
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={closeButtonStyle}
            >
              <Text style={closeTextStyle}>✕</Text>
            </TouchableOpacity>
          </View>

          {patientInfo != null ? (
            <View style={styles.infoSection}>
              <View style={{ width: '100%' }}>
                <InfoRow
                  label="Patient Name"
                  value={`${patientInfo.firstName} ${patientInfo.lastName}`}
                  labelStyle={labelStyle}
                  valueStyle={valueStyle}
                  colonStyle={colonStyle}
                />
                <InfoRow
                  label="MRN No"
                  value={patientInfo.mrNumber}
                  labelStyle={labelStyle}
                  valueStyle={valueStyle}
                  colonStyle={colonStyle}
                />
                <InfoRow
                  label="Age, Gender"
                  value={`${patientInfo.age} yrs, ${patientInfo.gender}`}
                  labelStyle={labelStyle}
                  valueStyle={valueStyle}
                  colonStyle={colonStyle}
                />
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No patient assigned to this bed
              </Text>
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleConfirmAdmission}
            disabled={isConfirming || !patientInfo}
            style={[
              styles.confirmButton,
              (isConfirming || !patientInfo) && styles.confirmButtonDisabled,
            ]}
          >
            <Text style={confirmTextStyle}>
              {isConfirming ? 'Confirming...' : 'Confirm Admission'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

type InfoRowProps = {
  label: string;
  value: string;
  labelStyle: object;
  valueStyle: object;
  colonStyle: object;
};

const InfoRow: React.FC<InfoRowProps> = ({
  label,
  value,
  labelStyle,
  valueStyle,
  colonStyle,
}) => (
  <View style={styles.infoRow}>
    {/* Label container — pushes content to the right */}
    <View style={{ flex: 1 }}>
      <Text style={labelStyle}>{label}</Text>
    </View>
    <Text style={colonStyle}>:</Text>
    <View style={{ flex: 1 }}>
      <Text style={valueStyle}>{value}</Text>
    </View>
  </View>
);

export default AdmitPatientModalNew;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(5),
    shadowColor: '#000000',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: scale(10),
    elevation: 6,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: scale(13),
    paddingHorizontal: scale(12),
    paddingBottom: scale(4),
  },

  infoSection: {
    paddingHorizontal: scale(18),
    paddingTop: scale(16),
    paddingBottom: scale(18),
    alignItems: 'center', // important
  },

  infoRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },

  infoValue: {
    flex: 1,
    textAlign: 'left',
  },

  emptyState: {
    paddingHorizontal: scale(18),
    paddingVertical: scale(24),
    alignItems: 'center',
  },

  emptyText: {
    fontSize: RFValue(12, 812),
    color: '#888888',
  },

  confirmButton: {
    marginHorizontal: scale(12),
    marginBottom: scale(12),
    marginTop: scale(4),
    paddingVertical: verticalScale(12),
    borderRadius: scale(4),
    backgroundColor: 'rgba(76, 175, 80, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmButtonDisabled: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
});
