import { scale, verticalScale } from '../utils/scaling';
import { RFValue } from 'react-native-responsive-fontsize';

// ─── Static styles (no hooks needed) ───────────────────────────────────────
export const sharedColors = {
  primary: '#4CAE51',
  black: '#000000',
  white: '#ffffff',
  placeholder: '#000000',
  errorRed: '#D32F2F',
};

export const getSharedStyles = (isTablet: boolean) => ({
  // Button
  loginButton: {
    backgroundColor: sharedColors.primary,
    paddingVertical: isTablet ? verticalScale(12) : verticalScale(10),
    borderRadius: 10,
    marginTop: isTablet ? verticalScale(16) : verticalScale(4),
    paddingHorizontal: scale(12),
    alignItems: 'center' as const,
  },

  // Button text
  loginText: {
    textAlign: 'center' as const,
    color: sharedColors.white,
    fontWeight: 'bold' as const,
    fontSize: isTablet ? RFValue(16) : RFValue(12),
  },

  // Placeholder
  placeholder: {
    color: sharedColors.placeholder,
    fontSize: isTablet ? RFValue(14) : RFValue(12),
    flex:1,
  },

  // Header title
  headerTitle: {
    fontSize: isTablet ? RFValue(22) : RFValue(16),
    fontWeight: '600' as const,
    color: sharedColors.black,
  },

  // Subtext / instruction
  subText: {
    fontSize: RFValue(isTablet ? 16 : 14, 812),
    fontWeight: '500' as const,
    marginBottom: isTablet ? verticalScale(20) : verticalScale(12),
    textAlign: 'center' as const,
  },

  // Input label/title
  inputLabel: {
    marginBottom: isTablet ? scale(8) : scale(6),
    fontSize: isTablet ? RFValue(16) : RFValue(14),
    fontWeight: '600' as const,
    color: '#000',
  },
  otpErrorText: {
    color: sharedColors.errorRed, // proper error red
    fontSize: isTablet ? RFValue(12) : RFValue(10),
    fontWeight: '500',
  },
  tpTimerText: {
    color: sharedColors.black, // proper error red
    fontSize: isTablet ? RFValue(12) : RFValue(10),
    fontWeight: '500',
  },

  // app title name
  appTitle: {
    fontSize: isTablet ? RFValue(20) : RFValue(16),
    fontWeight: 'bold',
    marginBottom: verticalScale(12),
  },
  closeText :{
      fontSize: isTablet? RFValue(18, 812): RFValue(16, 812),
      fontWeight: 'bold'
  },
});