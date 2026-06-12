import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';

// import { fontScale, scale, verticalScale } from '../utils/scaling';
import { RFValue } from 'react-native-responsive-fontsize';

// import your existing API
import { getBedPatientInfo } from '../services/nurseService';
import { getMedicalHistory } from '../services/bedService';
import { useResponsive } from '../utils/responsive';
import { getSharedStyles } from '../styles/sharedStyles';
import { scale, verticalScale } from 'react-native-size-matters';
import { useTranslation } from 'react-i18next';

type CalloutHeaderProps = {
  bedCode: string;
  selectedTab: 'none' | 'instructions' | 'wardtransfer' | 'monitoring';
  setSelectedTab: (
    tab: 'none' | 'instructions' | 'wardtransfer' | 'monitoring',
  ) => void;
  onClose: () => void;
};

const CalloutHeader: React.FC<CalloutHeaderProps> = ({
  bedCode,
  selectedTab,
  setSelectedTab,
  onClose,
}) => {
  const { t } = useTranslation();
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [showDateTooltip, setShowDateTooltip] = useState<boolean>(false);
  const { isTablet } = useResponsive();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);
  useEffect(() => {
    if (!bedCode) return;
    const fetchData = async () => {
      try {
        const res = await getBedPatientInfo(bedCode);
        const data = Array.isArray(res) ? res[0] : res;
        setPatientInfo(data || null);
      } catch {
        setPatientInfo(null);
      }
    };
    fetchData();
  }, [bedCode]);

  const formatAdmissionDate = (dateString?: string): string => {
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

  const bedCodeStyle = useMemo(() => ({
    fontSize: isTablet? RFValue(18, 812): RFValue(17, 812),
    fontWeight: '600',
    color: '#4caf50',
  }),
  [isTablet]
);

  const nameStyle = useMemo(() => ({
    fontSize: isTablet? RFValue(17, 812): RFValue(15, 812), fontWeight: '600'
  }),
  [isTablet]
);

  const mrnTextStyle = useMemo(() => ({
    color: '#000', // or any color you want
    fontSize: isTablet? RFValue(14, 812): RFValue(12, 812),
    fontWeight: '500',
  }),
  [isTablet]
);

  const genderStyle = useMemo(() => ({
    fontSize: isTablet? RFValue(14, 812): RFValue(12, 812),
  }),
  [isTablet]
);
  const tooltipTextStyle = useMemo(() => ({
    color: '#fff',
    fontSize: isTablet? RFValue(14, 812): RFValue(12, 812),
    textAlign: 'center',
  }),
  [isTablet]
);
const admissionDateStyle = useMemo(() => ({
    fontSize: isTablet? RFValue(14, 812): RFValue(12, 812),
    color: '#444'
  }),
  [isTablet]
);

const closeTextStyle = useMemo(() => ({
    fontSize: isTablet? RFValue(18, 812): RFValue(16, 812),
    fontWeight: 'bold'
  }),
  [isTablet]
);

  return (
    <View style={styles.header}>
      {/* LEFT */}
      <View style={styles.leftHeader}>
        <TouchableOpacity
          onPress={() => {
            if (selectedTab === 'none') onClose();
            else setSelectedTab('none');
          }}
        >
          <Image
            source={require('../../assets/icons/back-arrow.png')}
            style={styles.backArrow}
          />
        </TouchableOpacity>

        <Text style={bedCodeStyle}>{bedCode || '-'}</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollableHeaderContent}
        >
          <Text style={nameStyle}>
            {patientInfo?.firstName ?? ''} {patientInfo?.lastName ?? ''}
          </Text>

          <Text style={mrnTextStyle}>
            {t('callout_header.mrn_no')}: {patientInfo?.mrNumber || '-'}
          </Text>

          <Text style={genderStyle}>
            {patientInfo?.age ?? '-'}{t('common.age_suffix')} | {patientInfo?.gender ?? '-'}
          </Text>
        </ScrollView>
      </View>

      {/* RIGHT */}
      <View style={styles.rightHeader}>
        <View style={{ position: 'relative' }}>
          <TouchableOpacity
            onPress={() => setShowDateTooltip(prev => !prev)}
            activeOpacity={0.7}
          >
            <Text style={admissionDateStyle} numberOfLines={1}>
              {t('callout_header.admission_date')}: {formatAdmissionDate(patientInfo?.admissionDate)}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => {
            setSelectedTab('none');
            onClose();
          }}
          style={styles.closeButton}
        >
          <Text style={closeTextStyle}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CalloutHeader;

const styles = StyleSheet.create({
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
    gap: scale(6),
    flexShrink: 1,
    maxWidth: '70%',
  },
  scrollableHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: scale(120),
  },
  // bedCode: {
  //   fontSize: RFValue(17, 812),
  //   fontWeight: '600',
  //   color: '#4caf50',
  // },
  // name: { fontSize: fontScale(15), fontWeight: '600' },
  // gender: { fontSize: fontScale(12) },
  // admissionDate: { fontSize: fontScale(12), color: '#444' },
  backArrow: {
    width: scale(25),
    height: verticalScale(20),
    tintColor: '#4caf50',
    resizeMode: 'contain'
  },
  closeButton: {
    backgroundColor: '#eee',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: scale(16),
  },
  // closeText: { fontSize: fontScale(16), fontWeight: 'bold' },

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
  // tooltipText: {
  //   color: '#fff',
  //   fontSize: fontScale(11),
  //   textAlign: 'center',
  // },
  // mrnText: {
  //   color: '#000', // or any color you want
  //   fontSize: fontScale(12),
  //   fontWeight: '500',
  // },
});
