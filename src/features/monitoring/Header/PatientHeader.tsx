import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';

import { scale, verticalScale } from '../../../utils/scaling';
import { RFValue } from 'react-native-responsive-fontsize';
import { BedPatientInfo } from '../../../types/Types';
import { getBedPatientInfo } from '../../../services/nurseService';
import { useResponsive } from '../../../utils/responsive';
import { getSharedStyles } from '../../../styles/sharedStyles';
import { useTranslation } from 'react-i18next';

const BackIcon = require('../../../../assets/icons/back-arrow.png');

interface PatientHeaderProps {
  bedCode: string;
  onClose?: () => void;
}

const PatientHeader: React.FC<PatientHeaderProps> = ({ bedCode, onClose }) => {
  const { t } = useTranslation();
  const [patient, setPatient] = useState<BedPatientInfo | null>(null);
  const [showDateTooltip, setShowDateTooltip] = useState(false);
  const { isTablet } = useResponsive();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);
  useEffect(() => {
    if (!bedCode) return;

    const fetchPatient = async () => {
      try {
        const response = await getBedPatientInfo(bedCode);
        setPatient(Array.isArray(response) ? response[0] : response);
      } catch (err) {
        setPatient(null);
      }
    };

    fetchPatient();
  }, [bedCode]);

  const formatAdmissionDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  const bedCodeStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(17) : RFValue(15),
      fontWeight: '700',
      color: '#4caf50',
    }),
    [isTablet],
  );

  const nameStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(17, 812) : RFValue(15, 812),
      fontWeight: '600',
    }),
    [isTablet],
  );

  const mrnTextStyle = useMemo(
    () => ({
      color: '#000', // or any color you want
      fontSize: isTablet ? RFValue(14, 812) : RFValue(12, 812),
      fontWeight: '500',
    }),
    [isTablet],
  );

  const genderStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(14, 812) : RFValue(12, 812),
    }),
    [isTablet],
  );
  const tooltipTextStyle = useMemo(
    () => ({
      color: '#fff',
      fontSize: isTablet ? RFValue(14, 812) : RFValue(12, 812),
      textAlign: 'center',
    }),
    [isTablet],
  );
  const admissionDateStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(14, 812) : RFValue(12, 812),
      color: '#444',
    }),
    [isTablet],
  );
  const closeTextStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(18, 812) : RFValue(16, 812),
      fontWeight: 'bold',
    }),
    [isTablet],
  );
  return (
    <View style={styles.header}>
      {/* LEFT SECTION */}
      <View style={styles.leftHeader}>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Image source={BackIcon} style={styles.backArrow} />
          </TouchableOpacity>
        )}

        {/* FIXED Bed Code */}
        <Text style={bedCodeStyle}>{bedCode || '-'}</Text>

        {/* SCROLLABLE DETAILS BLOCK */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollArea}
        >
          <Text style={nameStyle}>
            {patient?.firstName ?? ''} {patient?.lastName ?? ''}
          </Text>

          <Text style={mrnTextStyle}>{t('patient_header.mrn_no')}{patient?.mrNumber ?? '-'}</Text>

          <Text style={genderStyle}>
            {patient?.age ?? '-'}{t('common.age_suffix')} | {patient?.gender ?? '-'}
          </Text>
        </ScrollView>
      </View>

      {/* RIGHT SECTION */}
      <View style={styles.rightHeader}>
        {/* Admission Date with Tooltip */}
        <View style={{ position: 'relative' }}>
          <TouchableOpacity
            onPress={() => setShowDateTooltip(prev => !prev)}
            activeOpacity={0.7}
          >
            <Text style={admissionDateStyle} numberOfLines={1}>
              {t('patient_header.admission_date')}{formatAdmissionDate(patient?.admissionDate)}
            </Text>
          </TouchableOpacity>

          {showDateTooltip && (
            <View style={styles.tooltipContainer}>
              <Text style={styles.tooltipText}>
                {t('patient_header.admission')}{formatAdmissionDate(patient?.admissionDate)}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={closeTextStyle}>✕</Text>
          </TouchableOpacity>
      </View>
    </View>
  );
};

export default PatientHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    justifyContent: 'space-between',
  },

  /* LEFT SIDE */
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '70%',
    flexShrink: 1,
    gap: scale(4),
  },

  scrollArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    paddingRight: scale(12),
  },

  backArrow: {
    width: scale(22),
    height: verticalScale(18),
    tintColor: '#4caf50',
    resizeMode: 'contain',
  },

  bedCode: {
    fontSize: RFValue(15),
    fontWeight: '700',
    color: '#4caf50',
  },

  name: {
    fontSize: RFValue(12),
    fontWeight: '700',
  },

  mrn: {
    fontSize: RFValue(10),
    fontWeight: '500',
    color: '#333',
  },

  detailText: {
    fontSize: RFValue(10),
    color: '#000',
  },

  /* RIGHT SIDE */
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: scale(110),
    justifyContent: 'flex-end',
  },

  admissionDate: {
    fontSize: RFValue(10),
    color: '#444',
  },

  tooltipContainer: {
    position: 'absolute',
    bottom: '110%',
    left: 0,
    backgroundColor: '#333',
    padding: scale(8),
    borderRadius: scale(6),
    maxWidth: scale(160),
    zIndex: 100,
  },

  tooltipText: {
    color: '#fff',
    fontSize: RFValue(10),
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#eee',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: scale(16),
  },
});
