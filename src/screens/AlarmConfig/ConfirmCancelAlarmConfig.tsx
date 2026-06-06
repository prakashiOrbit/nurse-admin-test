import React, { useMemo } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { scale } from 'react-native-size-matters';
import { useResponsive } from '../../utils/responsive';

const { width } = Dimensions.get('window');

const ACTIVE_GREEN = '#4CAF50';

export type ConfirmModalVariant = 'update' | 'cancel';

type Props = {
  visible: boolean;
  variant: ConfirmModalVariant;
  /** Called when the user confirms (Yes / Discard) */
  onConfirm: () => void;
  /** Called when the user dismisses (Cancel button or backdrop tap) */
  onDismiss: () => void;
};

const VARIANT_CONTENT: Record<
  ConfirmModalVariant,
  {
    title: string;
    message: string;
    confirmLabel: string;
    confirmDanger: boolean;
  }
> = {
  update: {
    title: 'Confirm Update',
    message: 'Do you want to apply the updated threshold values?',
    confirmLabel: 'Yes',
    confirmDanger: false,
  },
  cancel: {
    title: 'Discard changes?',
    message: 'You have unsaved changes.',
    confirmLabel: 'Discard',
    confirmDanger: true,
  },
};

const ConfirmCancelAlarmConfig: React.FC<Props> = ({
  visible,
  variant,
  onConfirm,
  onDismiss,
}) => {
  const { isTablet } = useResponsive();
  const content = VARIANT_CONTENT[variant];

  // Card width mirrors UpdateAlarmConfig responsive sizing
  const cardStyle = useMemo(
    () => ({
      width: isTablet ? Math.min(width * 0.55, 440) : Math.min(width - 80, 300),
    }),
    [isTablet],
  );

  const titleStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(15) : RFValue(14),
    }),
    [isTablet],
  );

  const messageStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(11) : RFValue(10),
    }),
    [isTablet],
  );

  const buttonLabelStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(13) : RFValue(12),
    }),
    [isTablet],
  );

  const cancelButtonStyle = useMemo(
    () => ({
      minWidth: isTablet ? scale(60) : scale(88),
      height: isTablet ? scale(26) : scale(35),
      borderRadius: scale(4),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#CCCCCC',
      backgroundColor: '#F5F5F5',
      paddingHorizontal: scale(16),
    }),
    [isTablet],
  );

  const confirmButtonStyle = useMemo(
    () => ({
      minWidth: isTablet ? scale(60) : scale(88),
      height: isTablet ? scale(26) : scale(35),
      borderRadius: scale(4),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ACTIVE_GREEN,
      paddingHorizontal: scale(16),
      shadowColor: '#4CAF50',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.22,
      shadowRadius: 4,
      elevation: 2,
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
        {/* Backdrop — tapping outside dismisses */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={onDismiss}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Dialog card */}
        <View style={[styles.card, cardStyle]}>
          {/* Title */}
          <Text style={[styles.title, titleStyle]}>{content.title}</Text>

          {/* Message */}
          <Text style={[styles.message, messageStyle]}>{content.message}</Text>

          {/* Divider */}
          {/* <View style={styles.divider} /> */}

          {/* Actions */}
          <View style={styles.actions}>
            {/* Cancel / secondary button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onDismiss}
              style={cancelButtonStyle}
            >
              <Text style={[styles.cancelButtonText, buttonLabelStyle]}>
                Cancel
              </Text>
            </TouchableOpacity>

            {/* Confirm button — green for update, green for discard (matches Figma) */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onConfirm}
              style={confirmButtonStyle}
            >
              <Text style={[styles.confirmButtonText, buttonLabelStyle]}>
                {content.confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmCancelAlarmConfig;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(6),
    paddingTop: scale(22),
    paddingBottom: scale(20),
    paddingHorizontal: scale(25),
    // Subtle shadow to lift card off the dimmed background
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },

  title: {
    color: '#111111',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: scale(10),
  },

  message: {
    color: '#444444',
    fontWeight: '400',
    textAlign: 'center',
    // lineHeight: scale(18),
    marginBottom: scale(18),
    paddingHorizontal: scale(2),
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E0E0E0',
    marginBottom: scale(14),
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scale(12),
  },

  cancelButton: {
    minWidth: scale(88),
    height: scale(30),
    borderRadius: scale(4),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: scale(16),
  },

  cancelButtonText: {
    color: '#333333',
    fontWeight: '500',
  },

  confirmButton: {
    minWidth: scale(88),
    height: scale(30),
    borderRadius: scale(4),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACTIVE_GREEN,
    paddingHorizontal: scale(16),
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 2,
  },

  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
