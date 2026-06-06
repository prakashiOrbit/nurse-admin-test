import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { scale, verticalScale, fontScale } from '../../../utils/scaling';
import { useResponsive } from '../../../utils/responsive';
import { getSharedStyles } from '../../../styles/sharedStyles';
import { RFValue } from 'react-native-responsive-fontsize';

type ConfirmLogoutProps = {
  onConfirm: () => void;
  onCancel: () => void;
  LogoutImage: any;
};

const ConfirmLogout: React.FC<ConfirmLogoutProps> = ({
  onConfirm,
  onCancel,
  LogoutImage,
}) => {
  const { isTablet, wp, hp } = useResponsive();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);

  const containerStyle = useMemo(
    () => ({
      backgroundColor: '#fff',
      borderRadius: scale(12),
      paddingVertical: verticalScale(20),
      paddingHorizontal: scale(20),
      alignItems: 'center',
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      width: isTablet? wp(40): scale(300),
      maxWidth: '90%',
    }),
    [isTablet],
  );

  const titleStyle = useMemo(
    () => ({
      fontSize: RFValue(18, 812),
      fontWeight: '700',
      marginTop: isTablet ? scale(12) : verticalScale(12),
      color: '#000',
    }),
    [isTablet],
  );

  const subTitleStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(16, 812) : RFValue(14, 812),
      color: '#444',
      marginTop: verticalScale(6),
      textAlign: 'center',
    }),
    [isTablet],
  );

  const cancelStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(18, 812) : RFValue(16, 812),
      color: '#9E9E9E',
      fontWeight: '600',
    }),
    [isTablet],
  );

  const confirmStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(18, 812) : RFValue(16, 812),
      color: '#4CAF50',
      fontWeight: '700',
    }),
    [isTablet],
  );
  return (
    <View style={containerStyle}>
      <Image source={LogoutImage} style={styles.icon} />

      <Text style={titleStyle}>Confirm Logout</Text>
      <Text style={subTitleStyle}>Are you sure you want to Logout?</Text>

      <View style={styles.actions}>
        <Pressable onPress={onCancel}>
          <Text style={cancelStyle}>Cancel</Text>
        </Pressable>

        <Pressable onPress={onConfirm}>
          <Text style={confirmStyle}>Yes</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default ConfirmLogout;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: scale(12),
    paddingVertical: verticalScale(20),
    paddingHorizontal: scale(20),
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: scale(300),
    maxWidth: '90%',
  },
  icon: {
    width: scale(24),
    height: scale(24),
    resizeMode: 'contain',
  },
  title: {
    fontSize: fontScale(18),
    fontWeight: '700',
    marginTop: verticalScale(12),
    color: '#000',
  },
  subtitle: {
    fontSize: fontScale(14),
    color: '#444',
    marginTop: verticalScale(6),
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: verticalScale(24),
    paddingHorizontal: scale(20),
  },
  cancel: {
    fontSize: fontScale(16),
    color: '#9E9E9E',
    fontWeight: '600',
  },
  confirm: {
    fontSize: fontScale(16),
    color: '#4CAF50',
    fontWeight: '700',
  },
});
