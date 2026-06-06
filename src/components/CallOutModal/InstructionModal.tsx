// InstructionModal.tsx
import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Pressable,
} from 'react-native';

// import { scale, verticalScale, fontScale } from '../../utils/scaling';
import PatientInstructions from '../../screens/PatientsComponents/PatientInstructions';
import { useResponsive } from '../../utils/responsive';
import { getSharedStyles } from '../../styles/sharedStyles';
import { RFValue } from 'react-native-responsive-fontsize';
import { scale, verticalScale } from 'react-native-size-matters';

const InstructionsVector = require('../../../assets/icons/instruction.png');
// const SCREEN_WIDTH = Dimensions.get('window').width;
// const SCREEN_HEIGHT = Dimensions.get('window').height;

type Props = {
  visible: boolean;
  onClose: () => void;
  patientCode: string;
};

const InstructionModal: React.FC<Props> = ({
  visible,
  onClose,
  patientCode,
}) => {
  const { isTablet, wp, hp } = useResponsive();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);
  const titleStyle = useMemo(
    () => ({
      flex: 1,
      fontSize: isTablet ? RFValue(18, 812) : RFValue(16, 812),
      fontWeight: '600',
      color: '#4CAE51',
      marginLeft: scale(8),
    }),
    [isTablet],
  );

  const cardStyle = useMemo(
    () => ({
      // width: isTablet? wp(37): SCREEN_WIDTH * 0.37,
      // height: isTablet? hp(70): SCREEN_HEIGHT * 0.85,
      width: isTablet ? wp(37) : scale(320),
      height: isTablet ? hp(70) : verticalScale(258),
      backgroundColor: '#fff',
      borderRadius: scale(6),
      paddingVertical: scale(8),
      paddingHorizontal: scale(8),
      elevation: 15,
    }),
    [isTablet],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={cardStyle}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Image source={InstructionsVector} style={styles.icon} />
            <Text style={titleStyle}>Instructions</Text>

            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={shared.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.contentWrapper}
            showsVerticalScrollIndicator={true}
          >
            <PatientInstructions patientCode={patientCode} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default InstructionModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(6),
    padding: scale(2),
  },

  icon: {
    width: scale(20),
    height: scale(25),
    tintColor: '#4CAE51',
  },

  // title: {
  //   flex: 1,
  //   fontSize: fontScale(16),
  //   fontWeight: '600',
  //   color: '#4CAE51',
  //   marginLeft: scale(8),
  // },

  closeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    backgroundColor: '#eee',
    borderRadius: scale(20),
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  // closeText: {
  //   fontSize: fontScale(16),
  //   fontWeight: 'bold',
  //   color: '#333',
  // },

  contentWrapper: {
    marginTop: scale(4),
  },
});
