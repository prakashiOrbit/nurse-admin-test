import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  TextInput,
} from 'react-native';

import { handleAlarmWithAction } from '../../services/alarmService';
import { fontScale, scale, verticalScale } from '../../utils/scaling';
import { useResponsive } from '../../utils/responsive';
import { getSharedStyles } from '../../styles/sharedStyles';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTranslation } from 'react-i18next';

type AlarmInputModalProps = {
  visible: boolean;
  onClose: () => void;
  alarmInfo: AlarmInfo;
};
type AlarmInfo = any;

const { width, height } = Dimensions.get('window');

export const AlarmInputModal: React.FC<AlarmInputModalProps> = ({
  visible,
  onClose,
  alarmInfo,
}) => {
  const { t } = useTranslation();
  const [userInput, setUserInput] = useState('');
  const { isTablet, wp, hp } = useResponsive();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);
  const handleSubmit = async () => {
    if (!userInput.trim()) {
      Alert.alert(t('alarm.input_required'), t('alarm.input_required_msg'));
      return;
    }

    try {
      const response = await handleAlarmWithAction({
        alarmId: alarmInfo.alarmId,
        note: userInput,
      });

      if (response && response.alarmId) {
        Alert.alert(t('common.success'), t('alarm.handled_successfully'));
      } else {
        Alert.alert(t('common.error'), t('alarm.handle_failed'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('alarm.handle_failed'));
    }
    onClose();
    setUserInput('');
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
            {t('alarm.input_reason')}
          </Text>

          <TextInput
            style={[styles.input, shared.placeholder]}
            placeholder={t('alarm.type_here')}
            placeholderTextColor="#999"
            value={userInput}
            disableFullscreenUI={true}
            onChangeText={setUserInput}
            multiline
          />

          <View style={styles.buttonParent}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={cancelButtonTextStyle}>{t('common.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleSubmit}
            >
              <Text style={confirmButtonTextStyle}>{t('alarm.submit')}</Text>
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
    fontSize: fontScale(16),
    color: '#000',
    marginBottom: scale(15),
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    minHeight: verticalScale(80),
    padding: scale(10),
    fontSize: fontScale(14),
    color: '#000',
    marginBottom: scale(20),
    textAlignVertical: 'top',
  },
  buttonParent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
