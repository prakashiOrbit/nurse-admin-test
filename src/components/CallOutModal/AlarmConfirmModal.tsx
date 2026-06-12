import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';

import { handleAlarmIgnore } from '../../services/alarmService';
import { fontScale, scale, verticalScale } from '../../utils/scaling';
import { useResponsive } from '../../utils/responsive';
import { getSharedStyles } from '../../styles/sharedStyles';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTranslation } from 'react-i18next';

type AlarmConfirmModalProps = {
  visible: boolean;
  onClose: () => void;
  alarmInfo: AlarmInfo;
};
type AlarmInfo = any;
const { width, height } = Dimensions.get('window');

export const AlarmConfirmModal: React.FC<AlarmConfirmModalProps> = ({
  visible,
  onClose,
  alarmInfo,
}) => {
  const { t } = useTranslation();
  const { isTablet, wp, hp } = useResponsive();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);

  const handleAlarmIgnoreForAlarm = async (alarmInfo: AlarmInfo) => {
    // Logic to ignore the alarm using alarmInfo
    try {
      console.log('alarm info id:, ', alarmInfo.alarmId);
      const response = await handleAlarmIgnore(alarmInfo.alarmId);
      if (response && response.alarmId) {
        Alert.alert(t('common.success'), t('alarm.ignored_successfully'));
      } else {
        Alert.alert(t('common.error'), t('alarm.ignore_failed'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('alarm.ignore_failed'));
    }
    onClose();
  };

  const confirmBoxStyle = useMemo(
    () => ({
      width: isTablet ? wp(40) : scale(350),
      height: isTablet ? hp(50) : scale(250),
      backgroundColor: '#fff',
      borderRadius: scale(10),
      padding: scale(20),
      justifyContent: 'space-between',
    }),
    [isTablet],
  );

  const textStyle = useMemo(
    () => ({
      flex: 1, // take available vertical space
      textAlign: 'center',
      textAlignVertical: 'center', // for Android vertical centering
      fontSize: isTablet ? RFValue(17, 812) : RFValue(16, 812),
      color: '#000',
    }),
    [isTablet],
  );

  const cancelButtonTextStyle = useMemo(
    () => ({
      color: '#000',
      fontWeight: '600',
      fontSize: isTablet ? RFValue(16, 812) : RFValue(14, 812),
    }),
    [isTablet],
  );

  const confirmButtonTextStyle = useMemo(
    () => ({
      color: '#fff',
      fontWeight: '600',
      fontSize: isTablet ? RFValue(16, 812) : RFValue(14, 812),
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
        <View style={confirmBoxStyle}>
          <Text style={textStyle}>
            {t('alarm.ignore_confirm')}
          </Text>

          <View style={styles.buttonParent}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={cancelButtonTextStyle}>{t('common.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => handleAlarmIgnoreForAlarm(alarmInfo)}
            >
              <Text style={confirmButtonTextStyle}>{t('alarm.yes_ignore')}</Text>
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
  confirmBox: {
    // width: scale(width * 0.5), // modal takes 50% of screen width
    // height: verticalScale(height * 0.6), // modal takes 60% of screen height
    width: scale(350),
    height: scale(250),
    backgroundColor: '#fff',
    borderRadius: scale(10),
    padding: scale(20),
    justifyContent: 'space-between',
  },
  text: {
    flex: 1, // take available vertical space
    textAlign: 'center',
    textAlignVertical: 'center', // for Android vertical centering
    fontSize: fontScale(16),
    color: '#000',
  },
  buttonParent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    borderRadius: scale(5),
    flex: 1,
    marginRight: scale(10),
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#4caf50',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    borderRadius: scale(5),
    flex: 1,
    marginLeft: scale(10),
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
