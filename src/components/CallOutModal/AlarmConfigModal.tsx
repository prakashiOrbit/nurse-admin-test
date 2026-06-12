import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { scale, verticalScale } from '../../utils/scaling';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTranslation } from 'react-i18next';

type ParamThreshold = {
  paramName: string;
  low: number | null;
  high: number | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (updatedThresholds: ParamThreshold[]) => void;
  paramThresholds: ParamThreshold[];
};

const AlarmConfigModal: React.FC<Props> = ({
  visible,
  onClose,
  onSave,
  paramThresholds,
}) => {
  const { t } = useTranslation();
  const [thresholds, setThresholds] =
    React.useState<ParamThreshold[]>(paramThresholds);

  const handleChange = (index: number, key: 'low' | 'high', value: string) => {
    const newThresholds = [...thresholds];
    newThresholds[index][key] = value === '' ? null : parseInt(value);
    setThresholds(newThresholds);
  };

  React.useEffect(() => {
    if (visible) {
      setThresholds(paramThresholds);
    }
  }, [visible, paramThresholds]);

  const handleSave = () => {
    onSave(thresholds);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.configHeader}>
            <Text style={styles.title}>{t('alarm.config_title')}</Text>
            {onClose && (
              <TouchableOpacity onPress={onClose} style={styles.backArrow}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Top Tab (Patient Monitoring) */}
          <View style={styles.tabContainer}>
            <TouchableOpacity style={[styles.tabButton, styles.activeTab]}>
              <Text style={[styles.tabText, styles.activeTabText]}>
                {t('alarm.patient_monitoring')}
              </Text>
            </TouchableOpacity>
            {/* <TouchableOpacity style={styles.tabButton}>
              <Text style={styles.tabText}>Ventilator Monitoring</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabButton}>
              <Text style={styles.tabText}>Syringe Pump</Text>
            </TouchableOpacity> */}
          </View>

          {/* Scrollable Parameter Section */}
          <ScrollView style={styles.scrollArea}>
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.headerText]}>{t('alarm.parameters')}</Text>
              <Text style={[styles.headerText]}>{t('alarm.lower_limit')}</Text>
              <Text style={[styles.headerText]}>{t('alarm.upper_limit')}</Text>
            </View>

            {thresholds.map((param, index) => (
              <View key={index} style={styles.row}>
                <Text style={styles.paramName}>{param.paramName}</Text>
                <TextInput
                  style={[styles.flexInput, { borderColor: '#f44336' }]}
                  placeholder={t('alarm.low_placeholder')}
                  keyboardType="numeric"
                  disableFullscreenUI={true}
                  value={param.low?.toString() || ''}
                  onChangeText={val => handleChange(index, 'low', val)}
                />
                <TextInput
                  style={[styles.flexInput, { borderColor: '#4CAF50' }]}
                  placeholder={t('alarm.high_placeholder')}
                  keyboardType="numeric"
                  disableFullscreenUI={true}
                  value={param.high?.toString() || ''}
                  onChangeText={val => handleChange(index, 'high', val)}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: scale(550),
    height: verticalScale(330),
    backgroundColor: '#fff',
    borderRadius: scale(3),
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(6),
  },
  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: scale(10),
  },
  backArrow: {
    height: verticalScale(24),
    width: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  closeText: {
    fontSize: RFValue(13, 812),
    fontWeight: 'bold',
  },
  title: {
    fontSize: RFValue(15, 812),
    fontWeight: '600',
    color: '#000',
    marginBottom: verticalScale(10),
    marginLeft: scale(28),
  },

  /** Tab Row **/
  tabContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: verticalScale(6),
    marginBottom: verticalScale(12),
    // justifyContent: 'space-evenly',
    paddingLeft: scale(20),
    gap: scale(50),
  },
  tabButton: {
    paddingVertical: verticalScale(4),
  },
  tabText: {
    fontSize: RFValue(13, 812),
    color: '#666',
    fontWeight: '500',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#43A047',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
  },

  /** Scroll Area **/
  scrollArea: {
    flexGrow: 1,
  },
  headerRow: {
    // marginLeft: scale(48),
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: verticalScale(6),
    marginBottom: verticalScale(12),
    justifyContent: 'space-evenly',
    paddingRight: scale(80),
  },
  headerText: {
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
    color: '#000',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: scale(78),
    alignItems: 'center',
    marginBottom: verticalScale(14),
    marginLeft: scale(30),
  },
  paramName: {
    width: scale(95),
    fontWeight: '600',
    fontSize: RFValue(13, 812),
    textAlign: 'center',
    color: '#fff',
    backgroundColor: '#43A047',
    paddingVertical: verticalScale(6),
    borderRadius: scale(3),
  },
  flexInput: {
    width: scale(90),
    marginHorizontal: scale(6),
    borderWidth: 1.5,
    borderRadius: 6,
    paddingVertical: verticalScale(6),
    textAlign: 'center',
    fontSize: RFValue(13, 812),
    fontWeight: '500',
  },
});

export default AlarmConfigModal;
