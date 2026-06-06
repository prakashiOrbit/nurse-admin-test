import React from 'react';
import { BaseToast, ErrorToast, InfoToast, ToastConfig } from 'react-native-toast-message';
import { RFValue } from 'react-native-responsive-fontsize';
import { useResponsive } from '../utils/responsive';
import { scale } from '../utils/scaling';

const ResponsiveToast = ({ props, type }: { props: any, type: 'success' | 'error' | 'info' }) => {
  const { isTablet, wp } = useResponsive();

  const baseStyle = {
    borderLeftWidth: isTablet ? 10 : 5,
    height: undefined, // Allows vertical growth
    minHeight: isTablet ? 90 : 60,
    width: isTablet ? wp(60) : scale(350), // Uses wp from your hook
    maxWidth: 600,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  };

  const text1Style = {
    fontSize: RFValue(isTablet ? 15 : 14, 812),
    fontWeight: '700' as const,
    color: '#000',
  };

  const text2Style = {
    fontSize: RFValue(isTablet ? 13 : 12, 812),
    color: '#444',
  };

  if (type === 'error') {
    return (
      <ErrorToast
        {...props}
        style={[baseStyle, { borderLeftColor: '#ff4d4d' }]}
        text1Style={text1Style}
        text2Style={text2Style}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
      />
    );
  }

  if (type === 'info') {
    return (
      <InfoToast
        {...props}
        style={[baseStyle, { borderLeftColor: '#4a90e2' }]}
        text1Style={text1Style}
        text2Style={text2Style}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
      />
    );
  }

  return (
    <BaseToast
      {...props}
      style={[baseStyle, { borderLeftColor: '#4bb543' }]}
      text1Style={text1Style}
      text2Style={text2Style}
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
    />
  );
};

export const toastConfig: ToastConfig = {
  success: (props) => <ResponsiveToast props={props} type="success" />,
  error: (props) => <ResponsiveToast props={props} type="error" />,
  info: (props) => <ResponsiveToast props={props} type="info" />,
};
