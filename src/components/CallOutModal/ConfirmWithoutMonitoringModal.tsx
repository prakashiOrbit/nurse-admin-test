import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert
} from "react-native";
import { admitPatient } from "../../services/nurseService";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import { fontScale, scale, verticalScale } from "../../utils/scaling";
import { useTranslation } from "react-i18next";

type ConfirmWithoutMonitoringModalProps = {
  visible: boolean;
  onClose: () => void;
  onProceed: () => void;
  patientCode: string;
  bedCode: string;
};

const ConfirmWithoutMonitoringModal: React.FC<ConfirmWithoutMonitoringModalProps> = ({
  visible,
  onClose,
  onProceed,
  patientCode,
  bedCode,
}) => {
  const { t } = useTranslation();
  const { width, height } = Dimensions.get("window");
  const modalWidth = width * 0.5;
  const modalHeight = height * 0.5;

  const navigation = useNavigation<any>();

  const handleProceed = async () => {
  try {
    await admitPatient({ patientCode, bedCode });
    Toast.show({
      text1: t('admit_patient.admitted_toast'),
      text2: t('admit_patient.admitted_without_msg'),
      type: "success",
    });
    Alert.alert(t('common.success'), t('admit_patient.admitted_without_msg'));
    onProceed();
    navigation.reset({
        index: 0,
        routes: [{ name: "Dashboard" }],
      });
  } catch (error) {
    console.error("Error admitting patient without monitoring:", error);
    Toast.show({
      text1: t('admit_patient.admit_failed'),
      text2: JSON.stringify(error),
      type: "error",
    });
    Alert.alert(t('common.error'), t('admit_patient.admit_error_msg'));
  }
};


  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.confirmBox, { width: modalWidth, height: modalHeight }]}>
          {/* Centered Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{t('admit_patient.no_monitoring_title')}</Text>
            <Text style={styles.subtitle}>
              {t('admit_patient.no_monitoring_msg')}
            </Text>
          </View>

          {/* Sticky Bottom Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>{t('admit_patient.go_back')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleProceed}>
              <Text style={styles.confirmText}>{t('admit_patient.proceed_without_monitoring')}</Text>
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBox: {
    backgroundColor: "#fff",
    borderRadius: scale(10),
    padding: scale(20),
    justifyContent: "space-between", // pushes actionRow to bottom
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(10),
  },
  title: {
    fontSize: fontScale(16),
    fontWeight: "600",
    marginBottom: scale(10),
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontScale(14),
    color: "#555",
    textAlign: "center",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: scale(20),
  },
  cancelBtn: {
    flex: 1,
    marginRight: scale(8),
    paddingVertical: verticalScale(12),
    borderRadius: scale(6),
    borderWidth: scale(1),
    borderColor: "#ccc",
    alignItems: "center",
  },
  cancelText: {
    fontWeight: "600",
    color: "#444",
    fontSize: fontScale(12),
  },
  confirmBtn: {
    flex: 1,
    marginLeft: scale(8),
    paddingVertical: verticalScale(12),
    borderRadius: scale(6),
    backgroundColor: "#4cae51",
    alignItems: "center",
  },
  confirmText: {
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    fontSize: fontScale(12),
  },
});

export default ConfirmWithoutMonitoringModal;
